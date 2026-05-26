'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function getProductos() {
  await requireAuth();
  return prisma.producto.findMany({
    where: { activo: true },
    include: { stocks: { include: { sede: true } } },
    orderBy: { nombre: 'asc' },
  });
}

export async function crearProducto(data: {
  nombre: string;
  unidadMedida: string;
  costo: number;
  precioVenta: number;
  stockInicial?: { sedeId: string; cantidad: number }[];
}) {
  await requireAdmin();

  const producto = await prisma.producto.create({
    data: {
      nombre: data.nombre,
      unidadMedida: data.unidadMedida,
      costo: data.costo,
      precioVenta: data.precioVenta,
    },
  });

  if (data.stockInicial) {
    for (const s of data.stockInicial) {
      if (s.cantidad > 0) {
        await prisma.stockSede.create({
          data: { productoId: producto.id, sedeId: s.sedeId, cantidad: s.cantidad },
        });
      }
    }
  }

  revalidatePath('/almacen');
  return producto;
}

export async function actualizarStock(sedeId: string, productoId: string, cantidad: number) {
  await requireAdmin();
  await prisma.stockSede.upsert({
    where: { productoId_sedeId: { productoId, sedeId } },
    update: { cantidad },
    create: { productoId, sedeId, cantidad },
  });
  revalidatePath('/almacen');
}

export async function transferirStock(data: {
  productoId: string;
  sedeOrigenId: string;
  sedeDestinoId: string;
  cantidad: number;
  observaciones?: string;
}) {
  const session = await requireAdmin();
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user!.email! } });
  if (!usuario) throw new Error('Usuario no encontrado');

  const stockOrigen = await prisma.stockSede.findUnique({
    where: { productoId_sedeId: { productoId: data.productoId, sedeId: data.sedeOrigenId } },
  });
  if (!stockOrigen || stockOrigen.cantidad < data.cantidad) {
    throw new Error('Stock insuficiente en sede origen');
  }

  await prisma.$transaction([
    prisma.stockSede.update({
      where: { productoId_sedeId: { productoId: data.productoId, sedeId: data.sedeOrigenId } },
      data: { cantidad: { decrement: data.cantidad } },
    }),
    prisma.stockSede.upsert({
      where: { productoId_sedeId: { productoId: data.productoId, sedeId: data.sedeDestinoId } },
      update: { cantidad: { increment: data.cantidad } },
      create: { productoId: data.productoId, sedeId: data.sedeDestinoId, cantidad: data.cantidad },
    }),
    prisma.transferenciaStock.create({
      data: {
        productoId: data.productoId,
        sedeOrigenId: data.sedeOrigenId,
        sedeDestinoId: data.sedeDestinoId,
        cantidad: data.cantidad,
        observaciones: data.observaciones,
        adminId: usuario.id,
      },
    }),
  ]);

  revalidatePath('/almacen');
}

export async function editarProducto(id: string, data: {
  nombre?: string;
  unidadMedida?: string;
  costo?: number;
  precioVenta?: number;
  activo?: boolean;
}) {
  await requireAdmin();
  await prisma.producto.update({ where: { id }, data });
  revalidatePath('/almacen');
}

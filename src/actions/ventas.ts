'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export type FormaPago = 'EFECTIVO' | 'QR' | 'TARJETA' | 'NEQUI_DR' | 'NEQUI';
export type TipoVenta = 'MEDICO' | 'ESTETICO' | 'ALMACEN';

export async function crearVenta(data: {
  sedeId: string;
  pacienteNombre: string;
  pacienteApellido: string;
  tipo: TipoVenta;
  tratamiento?: string;
  productoId?: string;
  cantidad?: number;
  valorPagado: number;
  formaPago: FormaPago;
  observaciones?: string;
  fecha?: string;
}) {
  const session = await requireAuth();
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user!.email! } });
  if (!usuario) throw new Error('Usuario no encontrado');

  // Si es ALMACEN descontar stock
  if (data.tipo === 'ALMACEN' && data.productoId && data.cantidad) {
    const stock = await prisma.stockSede.findUnique({
      where: { productoId_sedeId: { productoId: data.productoId, sedeId: data.sedeId } },
    });
    if (!stock || stock.cantidad < data.cantidad) {
      throw new Error('Stock insuficiente en esta sede');
    }
    await prisma.stockSede.update({
      where: { productoId_sedeId: { productoId: data.productoId, sedeId: data.sedeId } },
      data: { cantidad: { decrement: data.cantidad } },
    });
  }

  await prisma.venta.create({
    data: {
      sedeId: data.sedeId,
      pacienteNombre: data.pacienteNombre.toUpperCase(),
      pacienteApellido: data.pacienteApellido.toUpperCase(),
      tipo: data.tipo,
      tratamiento: data.tratamiento,
      productoId: data.productoId,
      cantidad: data.cantidad,
      valorPagado: data.valorPagado,
      formaPago: data.formaPago,
      observaciones: data.observaciones,
      registradoPorId: usuario.id,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
    },
  });

  revalidatePath('/');
}

export async function getVentasDelDia(sedeId: string, fecha?: string) {
  await requireAuth();
  const dia = fecha ? new Date(fecha) : new Date();
  const inicio = new Date(dia);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(dia);
  fin.setHours(23, 59, 59, 999);

  return prisma.venta.findMany({
    where: { sedeId, fecha: { gte: inicio, lte: fin } },
    include: { producto: true, registradoPor: { select: { nombre: true } } },
    orderBy: { fecha: 'asc' },
  });
}

export async function getResumenDia(sedeId: string, fecha?: string) {
  await requireAuth();
  const dia = fecha ? new Date(fecha) : new Date();
  const inicio = new Date(dia);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(dia);
  fin.setHours(23, 59, 59, 999);

  const ventas = await prisma.venta.findMany({
    where: { sedeId, fecha: { gte: inicio, lte: fin } },
  });

  const total = ventas.reduce((s, v) => s + v.valorPagado, 0);
  const porFormaPago = ventas.reduce((acc, v) => {
    acc[v.formaPago] = (acc[v.formaPago] || 0) + v.valorPagado;
    return acc;
  }, {} as Record<string, number>);

  return { total, porFormaPago, cantidad: ventas.length };
}

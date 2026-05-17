'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSedes() {
  return await prisma.sede.findMany();
}

export async function getInsumos(sedeId: string) {
  return await prisma.inventarioSede.findMany({
    where: { sedeId },
    include: { insumo: true },
    orderBy: { insumo: { nombre: 'asc' } },
  });
}

export async function getServicios() {
  return await prisma.servicio.findMany({
    include: {
      recetas: {
        include: { insumo: true },
      },
    },
  });
}

export async function getInsumosBajoStock(sedeId: string, limite: number = 15) {
  return await prisma.inventarioSede.findMany({
    where: {
      sedeId,
      stockActual: { lte: limite },
    },
    include: { insumo: true },
    orderBy: { stockActual: 'asc' },
  });
}

export async function registrarServicioRealizado(servicioId: string, sedeId: string) {
  const servicio = await prisma.servicio.findUnique({
    where: { id: servicioId },
    include: { recetas: { include: { insumo: true } } },
  });

  if (!servicio) throw new Error('Servicio no encontrado');

  const insumosInsuficientes: string[] = [];

  for (const receta of servicio.recetas) {
    const inventario = await prisma.inventarioSede.findFirst({
      where: { sedeId, insumoId: receta.insumoId },
    });
    if (!inventario || inventario.stockActual < receta.cantidadNecesaria) {
      const disponibles = inventario?.stockActual ?? 0;
      insumosInsuficientes.push(`${receta.insumo.nombre} (disponible: ${disponibles}, requerido: ${receta.cantidadNecesaria})`);
    }
  }

  if (insumosInsuficientes.length > 0) {
    throw new Error(`Stock insuficiente: ${insumosInsuficientes.join(', ')}`);
  }

  for (const receta of servicio.recetas) {
    await prisma.inventarioSede.updateMany({
      where: { sedeId, insumoId: receta.insumoId },
      data: { stockActual: { decrement: receta.cantidadNecesaria } },
    });
  }

  revalidatePath('/');
  revalidatePath('/insumos');
}
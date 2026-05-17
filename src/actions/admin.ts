'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function crearInsumo(formData: FormData, sedeId: string) {
  const nombre = formData.get('nombre') as string;
  const unidadMedida = formData.get('unidadMedida') as string;
  const costoUnitario = parseFloat(formData.get('costoUnitario') as string);
  const stockInicial = parseFloat(formData.get('stockInicial') as string) || 0;

  if (!nombre || !unidadMedida || isNaN(costoUnitario)) {
    throw new Error('Todos los campos son requeridos');
  }

  const insumo = await prisma.insumo.create({
    data: { nombre, unidadMedida },
  });

  await prisma.inventarioSede.create({
    data: { sedeId, insumoId: insumo.id, stockActual: stockInicial, costoUnitario },
  });

  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function agregarStock(insumoId: string, sedeId: string, cantidad: number) {
  if (!insumoId || isNaN(cantidad) || cantidad <= 0) {
    throw new Error('ID de insumo y cantidad válidos son requeridos');
  }

  const existente = await prisma.inventarioSede.findFirst({
    where: { sedeId, insumoId },
  });

  if (existente) {
    await prisma.inventarioSede.update({
      where: { id: existente.id },
      data: { stockActual: { increment: cantidad } },
    });
  } else {
    const costoUnitario = parseFloat((await prisma.insumo.findUnique({ where: { id: insumoId } }))?.unidadMedida || '0') || 0;
    await prisma.inventarioSede.create({
      data: { sedeId, insumoId, stockActual: cantidad, costoUnitario },
    });
  }

  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function crearServicio(formData: FormData, receta: Array<{ insumoId: string; cantidad: number }>) {
  const nombre = formData.get('nombre') as string;
  const precioVenta = parseFloat(formData.get('precioVenta') as string);

  if (!nombre || isNaN(precioVenta)) {
    throw new Error('Nombre y precio de venta son requeridos');
  }

  await prisma.$transaction(async (tx) => {
    const servicio = await tx.servicio.create({ data: { nombre, precioVenta } });
    for (const item of receta) {
      if (item.insumoId && item.cantidad > 0) {
        await tx.recetaInsumo.create({
          data: { servicioId: servicio.id, insumoId: item.insumoId, cantidadNecesaria: item.cantidad },
        });
      }
    }
  });

  revalidatePath('/servicios');
  revalidatePath('/admin');
}

export async function importarInsumosMasivo(data: Array<{ nombre: string; unidadMedida: string; costoUnitario: number; stockInicial: number }>, sedeId: string) {
  if (!data || data.length === 0) throw new Error('No hay datos para importar');

  const insumos = data.filter((row) => row.nombre && row.unidadMedida).map((row) => ({
    nombre: row.nombre,
    unidadMedida: row.unidadMedida,
    costoUnitario: row.costoUnitario || 0,
    stockInicial: row.stockInicial || 0,
  }));

  if (insumos.length === 0) throw new Error('No se encontraron registros válidos para importar');

  for (const insumo of insumos) {
    let insumoDb = await prisma.insumo.findFirst({ where: { nombre: insumo.nombre } });
    if (!insumoDb) {
      insumoDb = await prisma.insumo.create({ data: { nombre: insumo.nombre, unidadMedida: insumo.unidadMedida } });
    }

    const inventarioExistente = await prisma.inventarioSede.findFirst({ where: { sedeId, insumoId: insumoDb.id } });
    if (inventarioExistente) {
      await prisma.inventarioSede.update({
        where: { id: inventarioExistente.id },
        data: { costoUnitario: insumo.costoUnitario, stockActual: { increment: insumo.stockInicial } },
      });
    } else {
      await prisma.inventarioSede.create({
        data: { sedeId, insumoId: insumoDb.id, stockActual: insumo.stockInicial, costoUnitario: insumo.costoUnitario },
      });
    }
  }

  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function getCatalogoInsumos() {
  return await prisma.insumo.findMany({ orderBy: { nombre: 'asc' } });
}

export async function editarInsumo(id: string, nombre: string, unidadMedida: string) {
  if (!id || !nombre || !unidadMedida) throw new Error('Todos los campos son requeridos');
  await prisma.insumo.update({ where: { id }, data: { nombre, unidadMedida } });
  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function eliminarInsumo(id: string, sedeId: string) {
  if (!id) throw new Error('ID requerido');
  await prisma.inventarioSede.deleteMany({ where: { sedeId, insumoId: id } });
  await prisma.recetaInsumo.deleteMany({ where: { insumoId: id } });
  await prisma.insumo.delete({ where: { id } });
  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function editarInventario(inventarioId: string, stockActual: number, costoUnitario: number) {
  await prisma.inventarioSede.update({
    where: { id: inventarioId },
    data: { stockActual, costoUnitario },
  });
  revalidatePath('/insumos');
  revalidatePath('/admin');
}

export async function editarServicio(id: string, nombre: string, precioVenta: number) {
  if (!id || !nombre || isNaN(precioVenta)) throw new Error('Campos requeridos');
  await prisma.servicio.update({ where: { id }, data: { nombre, precioVenta } });
  revalidatePath('/servicios');
  revalidatePath('/admin');
}

export async function eliminarServicio(id: string) {
  if (!id) throw new Error('ID requerido');
  await prisma.recetaInsumo.deleteMany({ where: { servicioId: id } });
  await prisma.servicio.delete({ where: { id } });
  revalidatePath('/servicios');
  revalidatePath('/admin');
}

export async function actualizarReceta(servicioId: string, receta: Array<{ insumoId: string; cantidadNecesaria: number }>) {
  if (!servicioId) throw new Error('ID de servicio requerido');
  await prisma.$transaction(async (tx) => {
    await tx.recetaInsumo.deleteMany({ where: { servicioId } });
    for (const item of receta) {
      if (item.insumoId && item.cantidadNecesaria > 0) {
        await tx.recetaInsumo.create({ data: { servicioId, insumoId: item.insumoId, cantidadNecesaria: item.cantidadNecesaria } });
      }
    }
  });
  revalidatePath('/servicios');
  revalidatePath('/admin');
}

export async function getUsuarios() {
  return await prisma.usuario.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function crearUsuario(formData: FormData) {
  const email = formData.get('email') as string;
  const nombre = formData.get('nombre') as string;
  const rol = formData.get('rol') as string;

  if (!email || !nombre || !rol) {
    throw new Error('Todos los campos son requeridos');
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new Error('El correo ya está registrado');
  }

  await prisma.usuario.create({
    data: { email, nombre, rol },
  });

  revalidatePath('/admin');
}

export async function eliminarUsuario(id: string) {
  if (!id) throw new Error('ID requerido');
  await prisma.usuario.delete({ where: { id } });
  revalidatePath('/admin');
}
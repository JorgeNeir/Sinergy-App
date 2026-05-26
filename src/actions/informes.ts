'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function getInformeVentas(fechaInicio: string, fechaFin: string, sedeId?: string) {
  await requireAdmin();

  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin);
  fin.setHours(23, 59, 59, 999);

  const where: any = { fecha: { gte: inicio, lte: fin } };
  if (sedeId) where.sedeId = sedeId;

  const ventas = await prisma.venta.findMany({
    where,
    include: { producto: true, sede: true },
    orderBy: { fecha: 'asc' },
  });

  // Totales por forma de pago
  const porFormaPago = ventas.reduce((acc, v) => {
    acc[v.formaPago] = (acc[v.formaPago] || 0) + v.valorPagado;
    return acc;
  }, {} as Record<string, number>);

  // Totales por tipo
  const porTipo = ventas.reduce((acc, v) => {
    acc[v.tipo] = (acc[v.tipo] || 0) + v.valorPagado;
    return acc;
  }, {} as Record<string, number>);

  // Top tratamientos/productos
  const porTratamiento = ventas.reduce((acc, v) => {
    const label = v.tipo === 'ALMACEN' ? (v.producto?.nombre ?? 'Producto') : (v.tratamiento ?? 'Sin nombre');
    if (!acc[label]) acc[label] = { cantidad: 0, total: 0 };
    acc[label].cantidad += 1;
    acc[label].total += v.valorPagado;
    return acc;
  }, {} as Record<string, { cantidad: number; total: number }>);

  // Ventas por día (para gráfico de línea)
  const porDia = ventas.reduce((acc, v) => {
    const dia = v.fecha.toISOString().split('T')[0];
    acc[dia] = (acc[dia] || 0) + v.valorPagado;
    return acc;
  }, {} as Record<string, number>);

  const total = ventas.reduce((s, v) => s + v.valorPagado, 0);

  // Pagos de planes en el rango
  const pagosPlanes = await prisma.pagoPlan.findMany({
    where: { fecha: { gte: inicio, lte: fin }, ...(sedeId ? { plan: { sedeId } } : {}) },
  });
  const totalPagosPlanes = pagosPlanes.reduce((s, p) => s + p.monto, 0);
  const porFormaPagoPlan = pagosPlanes.reduce((acc, p) => {
    acc[p.formaPago] = (acc[p.formaPago] || 0) + p.monto;
    return acc;
  }, {} as Record<string, number>);

  return {
    ventas,
    total,
    porFormaPago,
    porTipo,
    porTratamiento,
    porDia,
    totalPagosPlanes,
    porFormaPagoPlan,
    cantidadVentas: ventas.length,
  };
}

export async function getSedes() {
  await requireAdmin();
  return prisma.sede.findMany({ orderBy: { nombre: 'asc' } });
}

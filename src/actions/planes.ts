'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function crearPlan(data: {
  sedeId: string;
  pacienteNombre: string;
  pacienteApellido: string;
  tipo: 'MEDICO' | 'ESTETICO';
  tratamiento: string;
  totalDosis: number;
  valorTotal: number;
  observaciones?: string;
  pagoInicial?: { monto: number; formaPago: string };
}) {
  const session = await requireAuth();
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user!.email! } });
  if (!usuario) throw new Error('Usuario no encontrado');

  const plan = await prisma.planTratamiento.create({
    data: {
      sedeId: data.sedeId,
      pacienteNombre: data.pacienteNombre.toUpperCase(),
      pacienteApellido: data.pacienteApellido.toUpperCase(),
      tipo: data.tipo,
      tratamiento: data.tratamiento,
      totalDosis: data.totalDosis,
      valorTotal: data.valorTotal,
      observaciones: data.observaciones,
      registradoPorId: usuario.id,
    },
  });

  if (data.pagoInicial && data.pagoInicial.monto > 0) {
    await prisma.pagoPlan.create({
      data: {
        planId: plan.id,
        monto: data.pagoInicial.monto,
        formaPago: data.pagoInicial.formaPago,
        registradoPorId: usuario.id,
      },
    });
  }

  revalidatePath('/planes');
  return plan;
}

export async function registrarSesion(data: {
  planId: string;
  sedeId: string;
  dosisAplicadas: number;
  notas?: string;
}) {
  const session = await requireAuth();
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user!.email! } });
  if (!usuario) throw new Error('Usuario no encontrado');

  const plan = await prisma.planTratamiento.findUnique({
    where: { id: data.planId },
    include: { sesiones: true },
  });
  if (!plan) throw new Error('Plan no encontrado');

  const dosisUsadas = plan.sesiones.reduce((s, ses) => s + ses.dosisAplicadas, 0);
  if (dosisUsadas + data.dosisAplicadas > plan.totalDosis) {
    throw new Error('Excede las dosis disponibles del plan');
  }

  await prisma.sesionPlan.create({
    data: {
      planId: data.planId,
      sedeId: data.sedeId,
      dosisAplicadas: data.dosisAplicadas,
      notas: data.notas,
      registradoPorId: usuario.id,
    },
  });

  revalidatePath('/planes');
}

export async function registrarPago(data: {
  planId: string;
  monto: number;
  formaPago: string;
  observaciones?: string;
}) {
  const session = await requireAuth();
  const usuario = await prisma.usuario.findUnique({ where: { email: session.user!.email! } });
  if (!usuario) throw new Error('Usuario no encontrado');

  await prisma.pagoPlan.create({
    data: {
      planId: data.planId,
      monto: data.monto,
      formaPago: data.formaPago,
      observaciones: data.observaciones,
      registradoPorId: usuario.id,
    },
  });

  revalidatePath('/planes');
}

export async function buscarPaciente(nombre: string) {
  await requireAuth();
  return prisma.planTratamiento.findMany({
    where: {
      OR: [
        { pacienteNombre: { contains: nombre.toUpperCase() } },
        { pacienteApellido: { contains: nombre.toUpperCase() } },
      ],
    },
    include: {
      sesiones: true,
      pagos: true,
      sede: true,
    },
    orderBy: { fechaVenta: 'desc' },
  });
}

export async function getPlanes(filtro: 'ACTIVOS' | 'COMPLETADOS' | 'TODOS' = 'ACTIVOS') {
  await requireAuth();
  const planes = await prisma.planTratamiento.findMany({
    include: { sesiones: true, pagos: true, sede: true, registradoPor: { select: { nombre: true } } },
    orderBy: { fechaVenta: 'desc' },
  });

  return planes.filter((p) => {
    const dosisAplicadas = p.sesiones.reduce((s, ses) => s + ses.dosisAplicadas, 0);
    const completado = dosisAplicadas >= p.totalDosis;
    if (filtro === 'ACTIVOS') return !completado;
    if (filtro === 'COMPLETADOS') return completado;
    return true;
  });
}

export async function getPlanDetalle(id: string) {
  await requireAuth();
  return prisma.planTratamiento.findUnique({
    where: { id },
    include: {
      sede: true,
      registradoPor: { select: { nombre: true } },
      sesiones: { include: { sede: true, registradoPor: { select: { nombre: true } } }, orderBy: { fecha: 'asc' } },
      pagos: { include: { registradoPor: { select: { nombre: true } } }, orderBy: { fecha: 'asc' } },
    },
  });
}

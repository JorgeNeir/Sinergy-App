'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function getUsuarios() {
  await requireAdmin();
  return prisma.usuario.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, nombre: true, rol: true, createdAt: true },
  });
}

export async function crearUsuario(data: { email: string; nombre: string; rol: string; password: string }) {
  await requireAdmin();

  const existente = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existente) throw new Error('El correo ya está registrado');

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.usuario.create({
    data: { email: data.email, nombre: data.nombre, rol: data.rol, passwordHash },
  });
  revalidatePath('/admin');
}

export async function cambiarPassword(id: string, password: string) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.usuario.update({ where: { id }, data: { passwordHash } });
  revalidatePath('/admin');
}

export async function cambiarRol(id: string, rol: string) {
  await requireAdmin();
  await prisma.usuario.update({ where: { id }, data: { rol } });
  revalidatePath('/admin');
}

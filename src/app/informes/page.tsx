import { prisma } from '@/lib/prisma';
import InformesPage from '@/components/InformesPage';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Informes() {
  const session = await getSession();
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/');
  const sedes = await prisma.sede.findMany({ orderBy: { nombre: 'asc' } });
  return <InformesPage sedes={sedes} />;
}

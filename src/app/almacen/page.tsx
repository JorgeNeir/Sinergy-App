import { getProductos } from '@/actions/almacen';
import { prisma } from '@/lib/prisma';
import AlmacenPage from '@/components/AlmacenPage';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Almacen() {
  const session = await getSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const productos = await getProductos();
  const sedes = await prisma.sede.findMany({ orderBy: { nombre: 'asc' } });
  return <AlmacenPage productos={productos} sedes={sedes} isAdmin={isAdmin} />;
}

import { prisma } from '@/lib/prisma';
import VentasPage from '@/components/VentasPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sedes = await prisma.sede.findMany({ orderBy: { nombre: 'asc' } });
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: { stocks: { include: { sede: true } } },
    orderBy: { nombre: 'asc' },
  });
  return <VentasPage sedes={sedes} productos={productos} />;
}

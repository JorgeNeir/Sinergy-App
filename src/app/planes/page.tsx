import { prisma } from '@/lib/prisma';
import PlanesPage from '@/components/PlanesPage';

export const dynamic = 'force-dynamic';

export default async function Planes() {
  const sedes = await prisma.sede.findMany({ orderBy: { nombre: 'asc' } });
  const planes = await prisma.planTratamiento.findMany({
    include: { sesiones: true, pagos: true, sede: true, registradoPor: { select: { nombre: true } } },
    orderBy: { fechaVenta: 'desc' },
  });
  return <PlanesPage sedes={sedes} planesIniciales={planes} />;
}

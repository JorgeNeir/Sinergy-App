import { getInsumos, getServicios, getSedes, getInsumosBajoStock } from "@/actions/inventory";
import AlertasStock from "@/components/AlertasStock";

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ sede?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const sedeId = params.sede;
  
  const sedes = await getSedes();
  const defaultSede = sedeId || (sedes.length > 0 ? sedes[0].id : '');
  
  const insumos = sedeId ? await getInsumos(sedeId) : [];
  const insumosBajoStock = sedeId ? await getInsumosBajoStock(sedeId) : [];
  const servicios = await getServicios();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-500">
          Vista actual: <span className="font-semibold text-purple-600">{sedes.find(s => s.id === defaultSede)?.nombre || 'Sin sede'}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Total de Insumos en Inventario</p>
          </div>
          <p className="text-4xl font-bold text-slate-900">{insumos.length}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">Servicios Disponibles</p>
          </div>
          <p className="text-4xl font-bold text-slate-900">{servicios.length}</p>
        </div>
      </div>
      
      {sedeId ? (
        <AlertasStock insumos={insumosBajoStock} />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 font-medium">Selecciona una sede desde el menú superior para ver las alertas de stock.</p>
        </div>
      )}
    </div>
  );
}
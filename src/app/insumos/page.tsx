import { getInsumos, getSedes } from "@/actions/inventory";
import TablaInsumos from "@/components/TablaInsumos";

interface Props {
  searchParams: Promise<{ sede?: string }>;
}

export default async function InsumosPage({ searchParams }: Props) {
  const params = await searchParams;
  const sedeId = params.sede;
  
  const sedes = await getSedes();
  const defaultSede = sedeId || (sedes.length > 0 ? sedes[0].id : '');
  
  const inventarios = defaultSede ? await getInsumos(defaultSede) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventario por Sede</h1>
        <p className="text-slate-500">
          Vista actual: <span className="font-semibold text-purple-600">{sedes.find(s => s.id === defaultSede)?.nombre || 'Sin sede'}</span>
        </p>
      </div>
      
      {sedeId ? (
        <TablaInsumos inventarios={inventarios} sedeId={sedeId} />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-700 font-medium">Selecciona una sede desde el menú superior para ver el inventario.</p>
        </div>
      )}
    </div>
  );
}
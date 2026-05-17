import { getInsumos, getSedes } from "@/actions/inventory";
import { getCatalogoInsumos } from "@/actions/admin";
import FormNuevoInsumo from "@/components/FormNuevoInsumo";
import FormAgregarStock from "@/components/FormAgregarStock";
import FormCrearServicio from "@/components/FormCrearServicio";
import ImportadorExcel from "@/components/ImportadorExcel";
import AdminTabs from "@/components/AdminTabs";
import FormGestionUsuarios from "@/components/FormGestionUsuarios";

interface Props {
  searchParams: Promise<{ sede?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const sedeId = params.sede;
  
  const sedes = await getSedes();
  const defaultSede = sedeId || (sedes.length > 0 ? sedes[0].id : '');
  
  const inventarios = defaultSede ? await getInsumos(defaultSede) : [];
  const catalogoInsumos = await getCatalogoInsumos();

  const insumosInventario = inventarios.map(inv => ({ id: inv.insumo.id, nombre: inv.insumo.nombre, unidadMedida: inv.insumo.unidadMedida }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Administración</h1>
        <p className="text-slate-500">
          Vista actual: <span className="font-semibold text-purple-600">{sedes.find(s => s.id === defaultSede)?.nombre || 'Sin sede'}</span>
        </p>
      </div>
      
      {!sedeId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-700 font-medium">Selecciona una sede desde el menú superior para administrar el inventario.</p>
        </div>
      ) : (
        <AdminTabs tabs={["Gestión de Insumos", "Gestión de Servicios", "Usuarios"]}>
          {/* Pestaña 1: Gestión de Insumos */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <ImportadorExcel sedeId={defaultSede} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <FormNuevoInsumo sedeId={defaultSede} />
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <FormAgregarStock insumos={insumosInventario} sedeId={defaultSede} />
              </div>
            </div>
          </div>

          {/* Pestaña 2: Gestión de Servicios */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <FormCrearServicio insumos={catalogoInsumos} />
            </div>
          </div>

          {/* Pestaña 3: Gestión de Usuarios */}
          <FormGestionUsuarios />
        </AdminTabs>
      )}
    </div>
  );
}
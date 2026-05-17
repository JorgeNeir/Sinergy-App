interface InsumoBajoStock {
  id: string;
  stockActual: number;
  insumo: { nombre: string; unidadMedida: string };
}

interface Props {
  insumos: InsumoBajoStock[];
}

export default function AlertasStock({ insumos }: Props) {
  if (insumos.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-emerald-700 font-medium">Todo el inventario está en niveles óptimos</p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-red-800 font-semibold text-lg">
          Alerta: {insumos.length} insumo{insumos.length > 1 ? 's' : ''} con stock bajo
        </h3>
      </div>
      <div className="space-y-3">
        {insumos.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-red-100 rounded-lg p-4 flex justify-between items-center"
          >
            <span className="text-slate-800 font-medium">{item.insumo.nombre}</span>
            <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm">
              {item.stockActual} {item.insumo.unidadMedida}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';

import { crearInsumo } from '@/actions/admin';
import { useRef } from 'react';

interface Props {
  sedeId: string;
}

export default function FormNuevoInsumo({ sedeId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    try {
      await crearInsumo(formData, sedeId);
      alert('✅ Insumo creado exitosamente');
      formRef.current?.reset();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Nuevo Insumo</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
        <input
          name="nombre"
          type="text"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Unidad de Medida</label>
        <select
          name="unidadMedida"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">Seleccionar...</option>
          <option value="unidad">unidad</option>
          <option value="par">par</option>
          <option value="ml">ml</option>
          <option value="jeringa">jeringa</option>
          <option value="ampolla">ampolla</option>
          <option value="tubo">tubo</option>
          <option value="sobre">sobre</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Stock Inicial</label>
        <input
          name="stockInicial"
          type="number"
          step="0.01"
          defaultValue={0}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Costo Unitario ($)</label>
        <input
          name="costoUnitario"
          type="number"
          step="0.01"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-600 transition-all shadow-md"
      >
        Crear Insumo
      </button>
    </form>
  );
}
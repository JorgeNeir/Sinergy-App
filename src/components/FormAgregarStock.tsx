'use client';

import { agregarStock } from '@/actions/admin';
import { useRef } from 'react';

interface Insumo {
  id: string;
  nombre: string;
  unidadMedida: string;
}

interface Props {
  insumos: Insumo[];
  sedeId: string;
}

export default function FormAgregarStock({ insumos, sedeId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const insumoId = formData.get('insumoId') as string;
    const cantidad = parseFloat(formData.get('cantidad') as string);

    try {
      await agregarStock(insumoId, sedeId, cantidad);
      alert('✅ Stock agregado exitosamente');
      formRef.current?.reset();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Stock</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Insumo</label>
        <select
          name="insumoId"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        >
          <option value="">Seleccionar insumo...</option>
          {insumos.map((insumo) => (
            <option key={insumo.id} value={insumo.id}>
              {insumo.nombre} ({insumo.unidadMedida})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Cantidad</label>
        <input
          name="cantidad"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
      </div>
      <button
        type="submit"
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
      >
        Agregar Stock
      </button>
    </form>
  );
}
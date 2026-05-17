'use client';

import { crearServicio } from '@/actions/admin';
import { useRef, useState } from 'react';

interface Insumo {
  id: string;
  nombre: string;
  unidadMedida: string;
}

interface Props {
  insumos: Insumo[];
}

export default function FormCrearServicio({ insumos }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [receta, setReceta] = useState<Array<{ insumoId: string; cantidad: number }>>([]);

  const agregarInsumoReceta = () => {
    setReceta([...receta, { insumoId: '', cantidad: 1 }]);
  };

  const actualizarReceta = (index: number, field: 'insumoId' | 'cantidad', value: string | number) => {
    const nuevaReceta = [...receta];
    nuevaReceta[index] = { ...nuevaReceta[index], [field]: value };
    setReceta(nuevaReceta);
  };

  const eliminarInsumoReceta = (index: number) => {
    setReceta(receta.filter((_, i) => i !== index));
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      await crearServicio(formData, receta);
      alert('✅ Servicio creado exitosamente');
      formRef.current?.reset();
      setReceta([]);
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Nuevo Servicio</h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Servicio</label>
        <input
          name="nombre"
          type="text"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: Harmonización Facial"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Precio de Venta ($)</label>
        <input
          name="precioVenta"
          type="number"
          step="0.01"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: 800000"
        />
      </div>

      <div className="border-t border-gray-100 pt-6">
        <p className="text-sm font-semibold text-slate-700 mb-4">Receta (Insumos requeridos)</p>
        
        {receta.length === 0 ? (
          <p className="text-sm text-slate-400 italic mb-4">No hay insumos agregados a la receta</p>
        ) : (
          <div className="space-y-3 mb-4">
            {receta.map((item, index) => (
              <div key={index} className="flex gap-3 items-center">
                <select
                  value={item.insumoId}
                  onChange={(e) => actualizarReceta(index, 'insumoId', e.target.value)}
                  required
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Seleccionar insumo...</option>
                  {insumos.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.cantidad}
                  onChange={(e) => actualizarReceta(index, 'cantidad', parseFloat(e.target.value))}
                  required
                  className="w-24 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center"
                />
                <button
                  type="button"
                  onClick={() => eliminarInsumoReceta(index)}
                  className="px-3 py-3 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button
          type="button"
          onClick={agregarInsumoReceta}
          className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
        >
          + Agregar insumo a la receta
        </button>
      </div>

      <button
        type="submit"
        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-600 transition-all shadow-md hover:shadow-lg"
      >
        Crear Servicio
      </button>
    </form>
  );
}
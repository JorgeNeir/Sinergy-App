'use client';

import { editarInventario, eliminarInsumo } from '@/actions/admin';
import { useState } from 'react';

interface Inventario {
  id: string;
  stockActual: number;
  costoUnitario: number;
  insumo: { id: string; nombre: string; unidadMedida: string };
}

interface Props {
  inventarios: Inventario[];
  sedeId: string;
}

export default function TablaInsumos({ inventarios: initialInventarios, sedeId }: Props) {
  const [inventarios, setInventarios] = useState(initialInventarios);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ stockActual: 0, costoUnitario: 0 });

  const iniciarEdicion = (inv: Inventario) => {
    setEditandoId(inv.id);
    setFormData({ stockActual: inv.stockActual, costoUnitario: inv.costoUnitario });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData({ stockActual: 0, costoUnitario: 0 });
  };

  const guardarEdicion = async () => {
    try {
      await editarInventario(editandoId!, formData.stockActual, formData.costoUnitario);
      setInventarios(inventarios.map(i => i.id === editandoId ? { ...i, ...formData } : i));
      setEditandoId(null);
      alert('✅ Inventario actualizado');
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const eliminar = async (insumoId: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" del inventario de esta sede?`)) return;
    try {
      await eliminarInsumo(insumoId, sedeId);
      setInventarios(inventarios.filter(i => i.insumo.id !== insumoId));
      alert('✅ Eliminado');
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumo</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidad</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Unit.</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inventarios.map((inv) => (
            <tr key={inv.id} className={inv.stockActual < 15 ? "bg-red-50/50" : "hover:bg-slate-50"}>
              {editandoId === inv.id ? (
                <>
                  <td className="px-6 py-3 text-sm text-slate-800">{inv.insumo.nombre}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{inv.insumo.unidadMedida}</td>
                  <td className="px-6 py-3"><input type="number" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: parseFloat(e.target.value)})} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" /></td>
                  <td className="px-6 py-3"><input type="number" value={formData.costoUnitario} onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" /></td>
                  <td className="px-6 py-3 space-x-2">
                    <button onClick={guardarEdicion} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm px-2">Guardar</button>
                    <button onClick={cancelarEdicion} className="text-slate-500 hover:text-slate-700 font-medium text-sm px-2">Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{inv.insumo.nombre}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{inv.insumo.unidadMedida}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.stockActual < 15 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {inv.stockActual}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">${inv.costoUnitario.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => iniciarEdicion(inv)} className="text-purple-600 hover:text-purple-800 font-medium text-sm">Editar</button>
                    <button onClick={() => eliminar(inv.insumo.id, inv.insumo.nombre)} className="text-red-500 hover:text-red-700 font-medium text-sm">Eliminar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
'use client';

import { editarServicio, eliminarServicio, actualizarReceta } from '@/actions/admin';
import { registrarServicioRealizado } from '@/actions/inventory';
import { useState, useTransition } from 'react';

interface Insumo {
  id: string;
  nombre: string;
  unidadMedida: string;
}

interface Receta {
  id: string;
  cantidadNecesaria: number;
  insumo: Insumo;
}

interface Servicio {
  id: string;
  nombre: string;
  precioVenta: number;
  recetas: Receta[];
}

interface Props {
  servicios: Servicio[];
  insumos: Insumo[];
  sedeId: string;
}

export default function GridServicios({ servicios: initialServicios, insumos, sedeId }: Props) {
  const [servicios, setServicios] = useState(initialServicios);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoRecetaId, setEditandoRecetaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', precioVenta: 0 });
  const [recetaData, setRecetaData] = useState<Array<{ insumoId: string; cantidadNecesaria: number }>>([]);
  const [isPending, startTransition] = useTransition();

  const iniciarEdicion = (servicio: Servicio) => {
    setEditandoId(servicio.id);
    setFormData({ nombre: servicio.nombre, precioVenta: servicio.precioVenta });
  };

  const iniciarEdicionReceta = (servicio: Servicio) => {
    setEditandoRecetaId(servicio.id);
    setRecetaData(servicio.recetas.map(r => ({ insumoId: r.insumo.id, cantidadNecesaria: r.cantidadNecesaria })));
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData({ nombre: '', precioVenta: 0 });
  };

  const cancelarEdicionReceta = () => {
    setEditandoRecetaId(null);
    setRecetaData([]);
  };

  const guardarEdicion = async () => {
    try {
      await editarServicio(editandoId!, formData.nombre, formData.precioVenta);
      setServicios(servicios.map(s => s.id === editandoId ? { ...s, ...formData } : s));
      setEditandoId(null);
      alert('✅ Servicio actualizado');
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const guardarReceta = async () => {
    try {
      await actualizarReceta(editandoRecetaId!, recetaData);
      setEditandoRecetaId(null);
      setRecetaData([]);
      window.location.reload();
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await eliminarServicio(id);
      setServicios(servicios.filter(s => s.id !== id));
      alert('✅ Eliminado');
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  const agregarInsumoReceta = () => {
    setRecetaData([...recetaData, { insumoId: '', cantidadNecesaria: 1 }]);
  };

  const actualizarItemReceta = (index: number, field: 'insumoId' | 'cantidadNecesaria', value: string | number) => {
    const nuevaReceta = [...recetaData];
    nuevaReceta[index] = { ...nuevaReceta[index], [field]: value };
    setRecetaData(nuevaReceta);
  };

  const eliminarItemReceta = (index: number) => {
    setRecetaData(recetaData.filter((_, i) => i !== index));
  };

  const realizarServicio = (servicioId: string, nombre: string) => {
    startTransition(async () => {
      try {
        await registrarServicioRealizado(servicioId, sedeId);
        alert(`✅ ${nombre} realizado con éxito`);
      } catch (error) {
        alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {servicios.map((servicio) => (
        <div key={servicio.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
          {editandoId === servicio.id ? (
            <div className="space-y-4">
              <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Nombre del servicio" />
              <input type="number" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: parseFloat(e.target.value)})} className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Precio de venta" />
              <div className="flex gap-3">
                <button onClick={guardarEdicion} className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">Guardar</button>
                <button onClick={cancelarEdicion} className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
              </div>
            </div>
          ) : editandoRecetaId === servicio.id ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Editar Receta</p>
              {recetaData.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={item.insumoId}
                    onChange={(e) => actualizarItemReceta(index, 'insumoId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar...</option>
                    {insumos.map(insumo => (
                      <option key={insumo.id} value={insumo.id}>{insumo.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.cantidadNecesaria}
                    onChange={(e) => actualizarItemReceta(index, 'cantidadNecesaria', parseFloat(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    min="0.01"
                    step="0.01"
                  />
                  <button onClick={() => eliminarItemReceta(index)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              ))}
              <button onClick={agregarInsumoReceta} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Agregar insumo</button>
              <div className="flex gap-3 pt-2">
                <button onClick={guardarReceta} className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 text-sm">Guardar Receta</button>
                <button onClick={cancelarEdicionReceta} className="flex-1 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-slate-900">{servicio.nombre}</h2>
                <div className="flex gap-2">
                  <button onClick={() => iniciarEdicion(servicio)} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Editar</button>
                  <button onClick={() => eliminar(servicio.id, servicio.nombre)} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent mb-4">
                ${servicio.precioVenta.toLocaleString("es-CO")}
              </p>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receta</p>
                  <button onClick={() => iniciarEdicionReceta(servicio)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">✏️ Editar</button>
                </div>
                {servicio.recetas.length > 0 ? (
                  <ul className="space-y-2">
                    {servicio.recetas.map((receta) => (
                      <li key={receta.id} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-semibold text-purple-600">{receta.cantidadNecesaria}</span> {receta.insumo.unidadMedida} - {receta.insumo.nombre}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sin insumos definidos</p>
                )}
              </div>
              <button
                onClick={() => realizarServicio(servicio.id, servicio.nombre)}
                disabled={isPending}
                className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {isPending ? 'Procesando...' : 'Realizar Tratamiento'}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
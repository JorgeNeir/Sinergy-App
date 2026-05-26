'use client';

import { useState, useEffect, useTransition } from 'react';
import { crearVenta, getVentasDelDia, getResumenDia } from '@/actions/ventas';
import type { FormaPago, TipoVenta } from '@/actions/ventas';

const FORMAS_PAGO: { value: FormaPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'QR', label: 'QR / Bancolombia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'NEQUI_DR', label: 'Nequi Dr.' },
  { value: 'NEQUI', label: 'Nequi' },
];

const TIPOS: { value: TipoVenta; label: string }[] = [
  { value: 'MEDICO', label: 'Médico' },
  { value: 'ESTETICO', label: 'Estético' },
  { value: 'ALMACEN', label: 'Almacén' },
];

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

interface Sede { id: string; nombre: string }
interface StockSede { sedeId: string; cantidad: number; sede: Sede }
interface Producto { id: string; nombre: string; precioVenta: number; unidadMedida: string; stocks: StockSede[] }

export default function VentasPage({ sedes, productos }: { sedes: Sede[]; productos: Producto[] }) {
  const [sedeId, setSedeId] = useState(sedes[0]?.id ?? '');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // form state
  const [tipo, setTipo] = useState<TipoVenta>('MEDICO');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [valor, setValor] = useState('');
  const [formaPago, setFormaPago] = useState<FormaPago>('EFECTIVO');
  const [obs, setObs] = useState('');

  const cargar = async () => {
    const [v, r] = await Promise.all([getVentasDelDia(sedeId, fecha), getResumenDia(sedeId, fecha)]);
    setVentas(v);
    setResumen(r);
  };

  useEffect(() => { if (sedeId) cargar(); }, [sedeId, fecha]);

  const productoSel = productos.find(p => p.id === productoId);
  const stockDisponible = productoSel?.stocks.find(s => s.sedeId === sedeId)?.cantidad ?? 0;

  const handleProductoChange = (id: string) => {
    setProductoId(id);
    const p = productos.find(p => p.id === id);
    if (p) setValor(String(p.precioVenta * cantidad));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        await crearVenta({
          sedeId, pacienteNombre: nombre, pacienteApellido: apellido,
          tipo, tratamiento: tipo !== 'ALMACEN' ? tratamiento : undefined,
          productoId: tipo === 'ALMACEN' ? productoId : undefined,
          cantidad: tipo === 'ALMACEN' ? cantidad : undefined,
          valorPagado: parseFloat(valor), formaPago, observaciones: obs || undefined, fecha,
        });
        setNombre(''); setApellido(''); setTratamiento(''); setProductoId('');
        setCantidad(1); setValor(''); setObs(''); setShowForm(false);
        await cargar();
      } catch (e: any) { setError(e.message); }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ventas del día</h1>
          <p className="text-sm text-slate-500">Registro de consultas y productos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={sedeId} onChange={e => setSedeId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-slate-500 mb-1">Total del día</p>
            <p className="text-xl font-bold text-slate-800">{fmt(resumen.total)}</p>
            <p className="text-xs text-slate-400">{resumen.cantidad} venta{resumen.cantidad !== 1 ? 's' : ''}</p>
          </div>
          {FORMAS_PAGO.map(fp => (
            <div key={fp.value} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-slate-500 mb-1">{fp.label}</p>
              <p className="text-lg font-semibold text-slate-700">{fmt(resumen.porFormaPago[fp.value] ?? 0)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Nueva venta</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map(t => (
                  <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${tipo === t.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-slate-600 hover:border-purple-300'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Nombre paciente" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              {tipo === 'ALMACEN' ? (
                <div className="space-y-2">
                  <select required value={productoId} onChange={e => handleProductoChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — stock: {p.stocks.find(s => s.sedeId === sedeId)?.cantidad ?? 0} {p.unidadMedida}
                      </option>
                    ))}
                  </select>
                  {productoId && stockDisponible < 1 && (
                    <p className="text-xs text-red-500">Sin stock en esta sede</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={1} max={stockDisponible} placeholder="Cantidad" value={cantidad}
                      onChange={e => { const n = parseInt(e.target.value); setCantidad(n); if (productoSel) setValor(String(productoSel.precioVenta * n)); }}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input type="number" required placeholder="Valor pagado" value={valor} onChange={e => setValor(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="Tratamiento" value={tratamiento} onChange={e => setTratamiento(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input type="number" required placeholder="Valor pagado" value={valor} onChange={e => setValor(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <select value={formaPago} onChange={e => setFormaPago(e.target.value as FormaPago)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {FORMAS_PAGO.map(fp => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
              <textarea placeholder="Observaciones (opcional)" value={obs} onChange={e => setObs(e.target.value)}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Guardar venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {ventas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">💰</p>
            <p>Sin ventas registradas para este día</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Paciente</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Tratamiento / Producto</th>
                <th className="px-4 py-3 text-left">Forma de pago</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ventas.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{v.pacienteNombre} {v.pacienteApellido}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      v.tipo === 'MEDICO' ? 'bg-blue-100 text-blue-700' :
                      v.tipo === 'ESTETICO' ? 'bg-fuchsia-100 text-fuchsia-700' :
                      'bg-green-100 text-green-700'}`}>
                      {v.tipo === 'MEDICO' ? 'Médico' : v.tipo === 'ESTETICO' ? 'Estético' : 'Almacén'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.tipo === 'ALMACEN' ? v.producto?.nombre : v.tratamiento}</td>
                  <td className="px-4 py-3 text-slate-600">{FORMAS_PAGO.find(f => f.value === v.formaPago)?.label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(v.valorPagado)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{v.registradoPor?.nombre}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-600">Total</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(ventas.reduce((s, v) => s + v.valorPagado, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

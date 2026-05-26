'use client';

import { useState, useTransition } from 'react';
import { getInformeVentas } from '@/actions/informes';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#7c3aed', '#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#818cf8', '#60a5fa', '#34d399'];
const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const FORMAS_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo', QR: 'QR', TARJETA: 'Tarjeta', NEQUI_DR: 'Nequi Dr.', NEQUI: 'Nequi',
};

const TIPOS: Record<string, string> = {
  MEDICO: 'Médico', ESTETICO: 'Estético', ALMACEN: 'Almacén',
};

export default function InformesPage({ sedes }: { sedes: any[] }) {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [sedeId, setSedeId] = useState('');
  const [informe, setInforme] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const consultar = () => {
    startTransition(async () => {
      const data = await getInformeVentas(fechaInicio, fechaFin, sedeId || undefined);
      setInforme(data);
    });
  };

  const dataPago = informe ? Object.entries(informe.porFormaPago).map(([k, v]) => ({ name: FORMAS_PAGO[k] ?? k, value: v as number })) : [];
  const dataTipo = informe ? Object.entries(informe.porTipo).map(([k, v]) => ({ name: TIPOS[k] ?? k, value: v as number })) : [];
  const dataTratamiento = informe
    ? Object.entries(informe.porTratamiento)
        .sort(([, a]: any, [, b]: any) => b.total - a.total)
        .slice(0, 10)
        .map(([k, v]: any) => ({ name: k.length > 20 ? k.slice(0, 18) + '…' : k, total: v.total, cantidad: v.cantidad }))
    : [];
  const dataDia = informe
    ? Object.entries(informe.porDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({ dia: k.slice(5), total: v as number }))
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Informes de ventas</h1>
        <p className="text-sm text-slate-500">Análisis por rango de fechas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Sede</label>
          <select value={sedeId} onChange={e => setSedeId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <button onClick={consultar} disabled={isPending}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {isPending ? 'Consultando…' : 'Generar informe'}
        </button>
      </div>

      {!informe && !isPending && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-3">📊</p>
          <p>Selecciona un rango de fechas y genera el informe</p>
        </div>
      )}

      {informe && (
        <div className="space-y-6">
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-slate-500 mb-1">Total ventas</p>
              <p className="text-xl font-bold text-slate-800">{fmt(informe.total)}</p>
              <p className="text-xs text-slate-400">{informe.cantidadVentas} transacciones</p>
            </div>
            {Object.entries(FORMAS_PAGO).map(([k, label]) => (
              <div key={k} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-lg font-semibold text-slate-700">{fmt(informe.porFormaPago[k] ?? 0)}</p>
              </div>
            ))}
          </div>

          {/* Ventas por tipo */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TIPOS).map(([k, label]) => (
              <div key={k} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-800">{fmt(informe.porTipo[k] ?? 0)}</p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie forma de pago */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribución por forma de pago</h3>
              {dataPago.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dataPago} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {dataPago.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sin datos</p>}
            </div>

            {/* Pie tipo */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribución por tipo</h3>
              {dataTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dataTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {dataTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sin datos</p>}
            </div>

            {/* Ventas por día */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Ventas por día</h3>
              {dataDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dataDia}>
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sin datos</p>}
            </div>

            {/* Top tratamientos */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Top tratamientos / productos</h3>
              {dataTratamiento.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, dataTratamiento.length * 35)}>
                  <BarChart data={dataTratamiento} layout="vertical">
                    <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Bar dataKey="total" fill="#a855f7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-slate-400 py-8">Sin datos</p>}
            </div>
          </div>

          {/* Tabla de ventas */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-slate-700">Detalle de ventas ({informe.cantidadVentas})</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-slate-500 uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Paciente</th>
                    <th className="px-4 py-2 text-left">Sede</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-left">Tratamiento/Producto</th>
                    <th className="px-4 py-2 text-left">Forma pago</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {informe.ventas.map((v: any) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{new Date(v.fecha).toLocaleDateString('es-CO')}</td>
                      <td className="px-4 py-2">{v.pacienteNombre} {v.pacienteApellido}</td>
                      <td className="px-4 py-2">{v.sede?.nombre}</td>
                      <td className="px-4 py-2">{TIPOS[v.tipo] ?? v.tipo}</td>
                      <td className="px-4 py-2">{v.tipo === 'ALMACEN' ? v.producto?.nombre : v.tratamiento}</td>
                      <td className="px-4 py-2">{FORMAS_PAGO[v.formaPago] ?? v.formaPago}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(v.valorPagado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { crearPlan, registrarSesion, registrarPago, buscarPaciente } from '@/actions/planes';

const FORMAS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'QR', label: 'QR / Bancolombia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'NEQUI_DR', label: 'Nequi Dr.' },
  { value: 'NEQUI', label: 'Nequi' },
];

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

function calcPlan(plan: any) {
  const dosisAplicadas = plan.sesiones.reduce((s: number, ses: any) => s + ses.dosisAplicadas, 0);
  const totalPagado = plan.pagos.reduce((s: number, p: any) => s + p.monto, 0);
  return {
    dosisAplicadas, dosisPendientes: plan.totalDosis - dosisAplicadas,
    totalPagado, saldoPendiente: plan.valorTotal - totalPagado,
    completado: dosisAplicadas >= plan.totalDosis,
  };
}

export default function PlanesPage({ sedes, planesIniciales }: { sedes: any[]; planesIniciales: any[] }) {
  const [planes, setPlanes] = useState(planesIniciales);
  const [filtro, setFiltro] = useState<'ACTIVOS' | 'TODOS' | 'COMPLETADOS'>('ACTIVOS');
  const [busqueda, setBusqueda] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalSesion, setModalSesion] = useState<any>(null);
  const [modalPago, setModalPago] = useState<any>(null);
  const [planDetalle, setPlanDetalle] = useState<any>(null);

  // Form nuevo plan
  const [sedeId, setSedeId] = useState(sedes[0]?.id ?? '');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tipo, setTipo] = useState('MEDICO');
  const [tratamiento, setTratamiento] = useState('');
  const [totalDosis, setTotalDosis] = useState(1);
  const [valorTotal, setValorTotal] = useState('');
  const [obs, setObs] = useState('');
  const [pagoInicialMonto, setPagoInicialMonto] = useState('');
  const [pagoInicialForma, setPagoInicialForma] = useState('EFECTIVO');

  // Form sesión
  const [sesSede, setSesSede] = useState(sedes[0]?.id ?? '');
  const [sesDosis, setSesDosis] = useState(1);
  const [sesNotas, setSesNotas] = useState('');

  // Form pago
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoForma, setPagoForma] = useState('EFECTIVO');
  const [pagoObs, setPagoObs] = useState('');

  const reload = async () => {
    const res = await buscarPaciente('');
    setPlanes(res);
  };

  const planesFiltered = planes
    .filter(p => {
      const c = calcPlan(p);
      if (filtro === 'ACTIVOS') return !c.completado;
      if (filtro === 'COMPLETADOS') return c.completado;
      return true;
    })
    .filter(p => {
      if (!busqueda) return true;
      const q = busqueda.toUpperCase();
      return p.pacienteNombre.includes(q) || p.pacienteApellido.includes(q) || p.tratamiento.toUpperCase().includes(q);
    });

  const handleCrearPlan = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await crearPlan({
          sedeId, pacienteNombre: nombre, pacienteApellido: apellido,
          tipo: tipo as any, tratamiento, totalDosis, valorTotal: parseFloat(valorTotal), observaciones: obs || undefined,
          pagoInicial: pagoInicialMonto ? { monto: parseFloat(pagoInicialMonto), formaPago: pagoInicialForma } : undefined,
        });
        setModalNuevo(false);
        setNombre(''); setApellido(''); setTratamiento(''); setValorTotal(''); setObs(''); setPagoInicialMonto(''); setTotalDosis(1);
        await reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handleSesion = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await registrarSesion({ planId: modalSesion.id, sedeId: sesSede, dosisAplicadas: sesDosis, notas: sesNotas || undefined });
        setModalSesion(null); setSesNotas(''); setSesDosis(1);
        await reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await registrarPago({ planId: modalPago.id, monto: parseFloat(pagoMonto), formaPago: pagoForma, observaciones: pagoObs || undefined });
        setModalPago(null); setPagoMonto(''); setPagoObs('');
        await reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planes de tratamiento</h1>
          <p className="text-sm text-slate-500">Paquetes de dosis con seguimiento por paciente</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
          + Nuevo plan
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['ACTIVOS', 'COMPLETADOS', 'TODOS'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:border-purple-300'}`}>
            {f === 'ACTIVOS' ? 'Activos' : f === 'COMPLETADOS' ? 'Completados' : 'Todos'}
          </button>
        ))}
        <input placeholder="Buscar paciente o tratamiento…" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-48" />
      </div>

      {/* Lista de planes */}
      <div className="space-y-3">
        {planesFiltered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-gray-100">
            <p className="text-4xl mb-3">📋</p>
            <p>No hay planes con este filtro</p>
          </div>
        ) : planesFiltered.map(plan => {
          const c = calcPlan(plan);
          const progDosis = Math.round((c.dosisAplicadas / plan.totalDosis) * 100);
          const progPago = Math.round((c.totalPagado / plan.valorTotal) * 100);
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.completado ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.completado ? 'Completado' : 'Activo'}
                    </span>
                    <span className="text-xs text-slate-400">{plan.sede.nombre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${plan.tipo === 'MEDICO' ? 'bg-blue-50 text-blue-600' : 'bg-fuchsia-50 text-fuchsia-600'}`}>
                      {plan.tipo === 'MEDICO' ? 'Médico' : 'Estético'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{plan.pacienteNombre} {plan.pacienteApellido}</p>
                  <p className="text-sm text-slate-600">{plan.tratamiento}</p>
                </div>
                <div className="flex gap-2 items-start">
                  {!c.completado && (
                    <button onClick={() => { setModalSesion(plan); setSesSede(plan.sedeId); }}
                      className="px-3 py-1.5 border border-purple-200 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-50">
                      + Sesión
                    </button>
                  )}
                  {c.saldoPendiente > 0 && (
                    <button onClick={() => setModalPago(plan)}
                      className="px-3 py-1.5 border border-green-200 text-green-600 rounded-lg text-xs font-medium hover:bg-green-50">
                      + Pago
                    </button>
                  )}
                  <button onClick={() => setPlanDetalle(planDetalle?.id === plan.id ? null : plan)}
                    className="px-3 py-1.5 border border-gray-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-gray-50">
                    {planDetalle?.id === plan.id ? 'Ocultar' : 'Detalle'}
                  </button>
                </div>
              </div>

              {/* Barras de progreso */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Dosis: {c.dosisAplicadas}/{plan.totalDosis}</span>
                    <span>{c.dosisPendientes} pendientes</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progDosis}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Pagado: {fmt(c.totalPagado)}</span>
                    <span className={c.saldoPendiente > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {c.saldoPendiente > 0 ? `Debe ${fmt(c.saldoPendiente)}` : '✓ Al día'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(progPago, 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Detalle expandido */}
              {planDetalle?.id === plan.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Sesiones</p>
                    {plan.sesiones.length === 0 ? <p className="text-xs text-slate-400">Sin sesiones</p> :
                      plan.sesiones.map((ses: any, i: number) => (
                        <div key={ses.id} className="text-xs text-slate-600 py-1 border-b border-gray-50">
                          <span className="font-medium">#{i + 1}</span> · {new Date(ses.fecha).toLocaleDateString('es-CO')} · {ses.dosisAplicadas} dosis
                          {ses.notas && <span className="text-slate-400"> · {ses.notas}</span>}
                        </div>
                      ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pagos</p>
                    {plan.pagos.length === 0 ? <p className="text-xs text-slate-400">Sin pagos</p> :
                      plan.pagos.map((p: any, i: number) => (
                        <div key={p.id} className="text-xs text-slate-600 py-1 border-b border-gray-50">
                          <span className="font-medium">{fmt(p.monto)}</span> · {FORMAS_PAGO.find(f => f.value === p.formaPago)?.label} · {new Date(p.fecha).toLocaleDateString('es-CO')}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal nuevo plan */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Nuevo plan de tratamiento</h2>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCrearPlan} className="space-y-3">
              <select value={sedeId} onChange={e => setSedeId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Nombre paciente" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="MEDICO">Médico</option>
                  <option value="ESTETICO">Estético</option>
                </select>
                <input required placeholder="Tratamiento (ej: Depilación Laser)" value={tratamiento} onChange={e => setTratamiento(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Total dosis / sesiones</label>
                  <input type="number" min={1} required value={totalDosis} onChange={e => setTotalDosis(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Valor total del paquete</label>
                  <input type="number" required placeholder="0" value={valorTotal} onChange={e => setValorTotal(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <textarea placeholder="Observaciones (opcional)" value={obs} onChange={e => setObs(e.target.value)}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Pago inicial (opcional)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Monto del abono" value={pagoInicialMonto} onChange={e => setPagoInicialMonto(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <select value={pagoInicialForma} onChange={e => setPagoInicialForma(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    {FORMAS_PAGO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Crear plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sesión */}
      {modalSesion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Registrar sesión</h2>
              <button onClick={() => setModalSesion(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {modalSesion.pacienteNombre} {modalSesion.pacienteApellido} — {modalSesion.tratamiento}
              <br />
              <span className="text-xs text-slate-400">
                {calcPlan(modalSesion).dosisPendientes} dosis pendientes de {modalSesion.totalDosis}
              </span>
            </p>
            <form onSubmit={handleSesion} className="space-y-3">
              <select value={sesSede} onChange={e => setSesSede(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Dosis aplicadas hoy</label>
                <input type="number" min={1} max={calcPlan(modalSesion).dosisPendientes} required value={sesDosis} onChange={e => setSesDosis(parseInt(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <textarea placeholder="Notas (opcional)" value={sesNotas} onChange={e => setSesNotas(e.target.value)}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalSesion(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Registrar sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pago */}
      {modalPago && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Registrar pago</h2>
              <button onClick={() => setModalPago(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-sm text-slate-600 mb-1">{modalPago.pacienteNombre} {modalPago.pacienteApellido}</p>
            <p className="text-xs text-slate-400 mb-4">Saldo pendiente: {fmt(calcPlan(modalPago).saldoPendiente)}</p>
            <form onSubmit={handlePago} className="space-y-3">
              <input type="number" required placeholder="Monto a abonar" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <select value={pagoForma} onChange={e => setPagoForma(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {FORMAS_PAGO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <textarea placeholder="Observaciones (opcional)" value={pagoObs} onChange={e => setPagoObs(e.target.value)}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalPago(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

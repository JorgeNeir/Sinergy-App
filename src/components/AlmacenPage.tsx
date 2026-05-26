'use client';

import { useState, useTransition } from 'react';
import { crearProducto, actualizarStock, transferirStock, editarProducto } from '@/actions/almacen';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export default function AlmacenPage({ productos: inicial, sedes, isAdmin }: { productos: any[]; sedes: any[]; isAdmin: boolean }) {
  const [productos, setProductos] = useState(inicial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalStock, setModalStock] = useState<any>(null);
  const [modalTransf, setModalTransf] = useState<any>(null);
  const [modalEditar, setModalEditar] = useState<any>(null);

  // Form nuevo producto
  const [nombre, setNombre] = useState('');
  const [unidad, setUnidad] = useState('unidad');
  const [costo, setCosto] = useState('');
  const [precio, setPrecio] = useState('');
  const [stockIniciales, setStockIniciales] = useState<{ sedeId: string; cantidad: number }[]>(
    sedes.map(s => ({ sedeId: s.id, cantidad: 0 }))
  );

  // Form stock
  const [stockSedeId, setStockSedeId] = useState(sedes[0]?.id ?? '');
  const [stockCantidad, setStockCantidad] = useState('');

  // Form transferencia
  const [transfOrigen, setTransfOrigen] = useState(sedes[0]?.id ?? '');
  const [transfDestino, setTransfDestino] = useState(sedes[1]?.id ?? sedes[0]?.id ?? '');
  const [transfCantidad, setTransfCantidad] = useState('');
  const [transfObs, setTransfObs] = useState('');

  const reload = async () => {
    const res = await fetch('/almacen', { cache: 'no-store' });
    // Revalidar via router
    window.location.reload();
  };

  const handleNuevo = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await crearProducto({
          nombre, unidadMedida: unidad, costo: parseFloat(costo), precioVenta: parseFloat(precio),
          stockInicial: stockIniciales.filter(s => s.cantidad > 0),
        });
        setModalNuevo(false);
        setNombre(''); setUnidad('unidad'); setCosto(''); setPrecio('');
        setStockIniciales(sedes.map(s => ({ sedeId: s.id, cantidad: 0 })));
        window.location.reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handleStock = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await actualizarStock(stockSedeId, modalStock.id, parseFloat(stockCantidad));
        setModalStock(null); setStockCantidad('');
        window.location.reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handleTransf = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await transferirStock({ productoId: modalTransf.id, sedeOrigenId: transfOrigen, sedeDestinoId: transfDestino, cantidad: parseFloat(transfCantidad), observaciones: transfObs || undefined });
        setModalTransf(null); setTransfCantidad(''); setTransfObs('');
        window.location.reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await editarProducto(modalEditar.id, {
          nombre: modalEditar.nombre, unidadMedida: modalEditar.unidadMedida,
          costo: parseFloat(modalEditar.costo), precioVenta: parseFloat(modalEditar.precioVenta),
        });
        setModalEditar(null);
        window.location.reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Almacén</h1>
          <p className="text-sm text-slate-500">{isAdmin ? 'Gestión de inventario de productos' : 'Consulta de inventario'}</p>
        </div>
        <div className="flex gap-2">
          <input placeholder="Buscar producto…" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          {isAdmin && (
            <button onClick={() => setModalNuevo(true)}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
              + Producto
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📦</p>
            <p>No hay productos en el almacén</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Unidad</th>
                {sedes.map(s => <th key={s.id} className="px-4 py-3 text-center">{s.nombre}</th>)}
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Precio venta</th>
                {isAdmin && <th className="px-4 py-3 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productosFiltrados.map(p => {
                const totalStock = p.stocks.reduce((s: number, st: any) => s + st.cantidad, 0);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{p.unidadMedida}</td>
                    {sedes.map(s => {
                      const stock = p.stocks.find((st: any) => st.sedeId === s.id);
                      const qty = stock?.cantidad ?? 0;
                      return (
                        <td key={s.id} className="px-4 py-3 text-center">
                          <span className={`font-semibold ${qty === 0 ? 'text-red-500' : qty < 3 ? 'text-amber-500' : 'text-slate-700'}`}>
                            {qty}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right text-slate-600">{fmt(p.costo)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(p.precioVenta)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => { setModalStock(p); setStockSedeId(sedes[0]?.id); setStockCantidad(''); }}
                            className="px-2 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50">Stock</button>
                          <button onClick={() => { setModalTransf(p); setTransfOrigen(sedes[0]?.id); setTransfDestino(sedes[1]?.id ?? sedes[0]?.id); }}
                            className="px-2 py-1 text-xs border border-amber-200 text-amber-600 rounded hover:bg-amber-50">Mover</button>
                          <button onClick={() => setModalEditar({ ...p, costo: String(p.costo), precioVenta: String(p.precioVenta) })}
                            className="px-2 py-1 text-xs border border-gray-200 text-slate-600 rounded hover:bg-gray-50">Editar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo producto */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Nuevo producto</h2>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleNuevo} className="space-y-3">
              <input required placeholder="Nombre del producto" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Unidad de medida (ej: unidad, caja, ml)" value={unidad} onChange={e => setUnidad(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required placeholder="Costo" value={costo} onChange={e => setCosto(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input type="number" required placeholder="Precio de venta" value={precio} onChange={e => setPrecio(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Stock inicial por sede</p>
                {sedes.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-600 w-36">{s.nombre}</span>
                    <input type="number" min={0} value={stockIniciales[i]?.cantidad ?? 0}
                      onChange={e => setStockIniciales(prev => prev.map((si, idx) => idx === i ? { ...si, cantidad: parseInt(e.target.value) || 0 } : si))}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24" />
                  </div>
                ))}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ajuste de stock */}
      {modalStock && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Ajustar stock — {modalStock.nombre}</h2>
              <button onClick={() => setModalStock(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleStock} className="space-y-3">
              <select value={stockSedeId} onChange={e => setStockSedeId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre} (actual: {modalStock.stocks.find((st: any) => st.sedeId === s.id)?.cantidad ?? 0})</option>)}
              </select>
              <input type="number" min={0} required placeholder="Nuevo stock total" value={stockCantidad} onChange={e => setStockCantidad(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalStock(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal transferencia */}
      {modalTransf && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Transferir stock — {modalTransf.nombre}</h2>
              <button onClick={() => setModalTransf(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleTransf} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Sede origen</label>
                <select value={transfOrigen} onChange={e => setTransfOrigen(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre} (stock: {modalTransf.stocks.find((st: any) => st.sedeId === s.id)?.cantidad ?? 0})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Sede destino</label>
                <select value={transfDestino} onChange={e => setTransfDestino(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {sedes.filter(s => s.id !== transfOrigen).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <input type="number" min={1} required placeholder="Cantidad a transferir" value={transfCantidad} onChange={e => setTransfCantidad(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Observaciones (opcional)" value={transfObs} onChange={e => setTransfObs(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalTransf(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Transfiriendo...' : 'Transferir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar producto */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Editar producto</h2>
              <button onClick={() => setModalEditar(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleEditar} className="space-y-3">
              <input required placeholder="Nombre" value={modalEditar.nombre} onChange={e => setModalEditar((p: any) => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Unidad" value={modalEditar.unidadMedida} onChange={e => setModalEditar((p: any) => ({ ...p, unidadMedida: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Costo" value={modalEditar.costo} onChange={e => setModalEditar((p: any) => ({ ...p, costo: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input type="number" placeholder="Precio venta" value={modalEditar.precioVenta} onChange={e => setModalEditar((p: any) => ({ ...p, precioVenta: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalEditar(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-slate-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

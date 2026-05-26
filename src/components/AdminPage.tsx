'use client';

import { useState, useTransition } from 'react';
import { crearUsuario, cambiarPassword, cambiarRol } from '@/actions/admin';

export default function AdminPage({ usuarios: inicial }: { usuarios: any[] }) {
  const [usuarios, setUsuarios] = useState(inicial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalPass, setModalPass] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('STAFF');
  const [pass, setPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const reload = () => window.location.reload();

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await crearUsuario({ email, nombre, rol, password: pass });
        setModalNuevo(false); setEmail(''); setNombre(''); setPass(''); setRol('STAFF');
        reload();
      } catch (e: any) { setError(e.message); }
    });
  };

  const handlePass = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        await cambiarPassword(modalPass.id, newPass);
        setModalPass(null); setNewPass('');
      } catch (e: any) { setError(e.message); }
    });
  };

  const handleRol = async (id: string, nuevoRol: string) => {
    startTransition(async () => {
      await cambiarRol(id, nuevoRol);
      reload();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administración</h1>
          <p className="text-sm text-slate-500">Gestión de usuarios del sistema</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Desde</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.rol} onChange={e => handleRol(u.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1">
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { setModalPass(u); setNewPass(''); }}
                    className="px-3 py-1 text-xs border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50">
                    Cambiar contraseña
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo usuario */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Nuevo usuario</h2>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCrear} className="space-y-3">
              <input required placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="email" required placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <select value={rol} onChange={e => setRol(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input type="password" required placeholder="Contraseña temporal" value={pass} onChange={e => setPass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalNuevo(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modalPass && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Cambiar contraseña</h2>
              <button onClick={() => setModalPass(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modalPass.nombre} · {modalPass.email}</p>
            <form onSubmit={handlePass} className="space-y-3">
              <input type="password" required placeholder="Nueva contraseña" value={newPass} onChange={e => setNewPass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalPass(null)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-slate-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

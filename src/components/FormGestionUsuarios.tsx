'use client';

import { crearUsuario, eliminarUsuario, getUsuarios } from '@/actions/admin';
import { useRef, useState, useEffect } from 'react';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  createdAt: Date;
}

export default function FormGestionUsuarios() {
  const formRef = useRef<HTMLFormElement>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsuarios().then((data) => {
      setUsuarios(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (formData: FormData) => {
    try {
      await crearUsuario(formData);
      alert('✅ Usuario creado exitosamente');
      formRef.current?.reset();
      const updated = await getUsuarios();
      setUsuarios(updated);
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEliminar = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar al usuario ${email}?`)) return;
    try {
      await eliminarUsuario(id);
      setUsuarios(usuarios.filter((u) => u.id !== id));
      alert('✅ Usuario eliminado');
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Error'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Formulario para agregar usuario */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Nuevo Usuario</h3>
        <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
            <input
              name="nombre"
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
            <select
              name="rol"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button
            type="submit"
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-600 transition-all shadow-md"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium">{usuario.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.nombre}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      usuario.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEliminar(usuario.id, usuario.email)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
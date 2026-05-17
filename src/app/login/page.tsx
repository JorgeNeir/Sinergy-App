'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [showEmergency, setShowEmergency] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/?sede=' });
  };

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Credenciales inválidas');
      setLoading(false);
    } else {
      router.push('/?sede=');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-fuchsia-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent mb-2">
            Sinergy
          </h1>
          <p className="text-slate-500">Sistema de Inventario</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Botón principal Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 px-6 bg-white border-2 border-gray-200 text-slate-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar Sesión con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">o</span>
            </div>
          </div>

          {/* Acceso de emergencia */}
          <div className="mt-6">
            <button
              onClick={() => setShowEmergency(!showEmergency)}
              className="text-sm text-slate-500 hover:text-purple-600 transition-colors"
            >
              {showEmergency ? '◀ Ocultar acceso de emergencia' : '¿Olvidaste tus datos? Acceso de Emergencia (Local)'}
            </button>

            {showEmergency && (
              <form onSubmit={handleEmergencyLogin} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="admin@sinergy.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-600 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Acceso de Emergencia'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Clínica estética Sinergy © 2024
        </p>
      </div>
    </div>
  );
}
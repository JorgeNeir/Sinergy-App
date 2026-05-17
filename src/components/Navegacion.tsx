'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Sede {
  id: string;
  nombre: string;
}

interface Props {
  sedes: Sede[];
}

export default function Navegacion({ sedes }: Props) {
  const router = useRouter();
  const [sedeActual, setSedeActual] = useState<string>('');

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const sedeCookie = cookies.find(c => c.startsWith('sedeId='));
    if (sedeCookie) {
      const id = sedeCookie.split('=')[1];
      setSedeActual(id);
    } else if (sedes.length > 0) {
      setSedeActual(sedes[0].id);
      document.cookie = `sedeId=${sedes[0].id}; path=/; max-age=31536000`;
    }
  }, [sedes]);

  const cambiarSede = (sedeId: string) => {
    setSedeActual(sedeId);
    document.cookie = `sedeId=${sedeId}; path=/; max-age=31536000`;
    router.push(`/?sede=${sedeId}`);
  };

  const enlaces = [
    { href: '/', label: 'Inicio' },
    { href: '/insumos', label: 'Insumos' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href={`/?sede=${sedeActual}`} className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
              Sinergy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Sede:</span>
            <div className="flex gap-2">
              {sedes.map((sede) => (
                <button
                  key={sede.id}
                  onClick={() => cambiarSede(sede.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    sedeActual === sede.id
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                >
                  {sede.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-8">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={`${enlace.href}?sede=${sedeActual}`}
              className="text-slate-600 font-medium hover:text-purple-600 transition-colors"
            >
              {enlace.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
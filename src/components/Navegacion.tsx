'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const navLinks = [
  { href: '/', label: 'Ventas', icon: '💰' },
  { href: '/planes', label: 'Planes', icon: '📋' },
  { href: '/almacen', label: 'Almacén', icon: '📦' },
];

const adminLinks = [
  { href: '/informes', label: 'Informes', icon: '📊' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export default function Navegacion() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const links = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent mr-4">
            Sinergy
          </span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

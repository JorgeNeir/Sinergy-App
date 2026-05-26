import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import Navegacion from '@/components/Navegacion';
import './globals.css';

export const dynamic = 'force-dynamic';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sinergy',
  description: 'Sistema de gestión · Medicina Funcional y Metabólica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 font-sans">
        <SessionProvider>
          <Navegacion />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}

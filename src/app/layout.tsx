import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSedes } from "@/actions/inventory";
import Navegacion from "@/components/Navegacion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sinergy Inventario",
  description: "Sistema de gestión de inventario para clínica estética",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sedes = await getSedes();

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-50">
        <Navegacion sedes={sedes} />
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
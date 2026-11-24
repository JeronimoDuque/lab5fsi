import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'BookHub - Librería Online & E-books con Envíos en Tiempo Real',
  description: 'Plataforma completa de comercio electrónico para la venta de libros físicos y electrónicos, gestión de stock y seguimiento de envíos en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© 2026 BookHub - Plataforma de Comercio Electrónico de Libros & E-books</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="text-indigo-600 font-semibold">WebSockets Socket.io Live</span>
                  <span>•</span>
                  <span>Gestión de Stock en Tiempo Real</span>
                  <span>•</span>
                  <span>Logística de Envíos</span>
                  <span>•</span>
                  <span>PayPal Sandbox</span>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

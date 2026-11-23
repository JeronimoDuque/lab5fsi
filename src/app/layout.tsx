import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'FastFoodUdeA - Pedidos y Reservas en Tiempo Real',
  description: 'Sistema integral de reserva y pedido de platos de restaurante para FastFoodUdeA con seguimiento Kanban y WebSockets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p>© 2026 FastFoodUdeA - Sistema de Gestión y Pedidos en Tiempo Real</p>
                <div className="flex gap-4">
                  <span className="text-orange-600 font-semibold">WebSockets Live Sync</span>
                  <span>•</span>
                  <span>MongoDB Atlas / Local</span>
                  <span>•</span>
                  <span>PayPal Integration</span>
                </div>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

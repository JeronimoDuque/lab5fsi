'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getSocket } from '@/lib/socket';
import {
  UtensilsCrossed,
  ShoppingBag,
  User,
  LogOut,
  ChefHat,
  Menu,
  X,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalCount } = useCart();
  const pathname = usePathname();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      if (socket.connected) setIsSocketConnected(true);
      socket.on('connect', () => setIsSocketConnected(true));
      socket.on('disconnect', () => setIsSocketConnected(false));
    }
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
                FastFood<span className="text-orange-600">UdeA</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                Sabor Universitario
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/menu"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/menu')
                  ? 'bg-orange-50 text-orange-600 font-semibold'
                  : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              Menú de Platos
            </Link>

            {user && (
              <Link
                href="/pedidos"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/pedidos')
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Mis Pedidos
              </Link>
            )}

            {user?.role === 'cocinero' && (
              <Link
                href="/cocinero"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/cocinero')
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                Tablero Kanban Cocina
              </Link>
            )}
          </div>

          {/* Right Section: Status, Cart, Auth */}
          <div className="flex items-center gap-3">
            {/* Live WebSocket Indicator */}
            <div
              title={isSocketConnected ? 'WebSockets en vivo conectado' : 'Reconectando WebSockets'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600"
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isSocketConnected ? 'text-emerald-500 animate-pulse' : 'text-gray-400'
                }`}
              />
              <span className="text-[11px]">
                {isSocketConnected ? 'Tiempo real' : 'Conectando'}
              </span>
            </div>

            {/* Cart Icon Button */}
            <Link
              href="/checkout"
              className="relative p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
              title="Ver Carrito y Pedido"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {totalCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-800 leading-tight">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      user.role === 'cocinero' ? 'text-amber-600' : 'text-blue-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors"
                >
                  Registro
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-orange-50"
          >
            Menú de Platos
          </Link>
          {user && (
            <Link
              href="/pedidos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-orange-50"
            >
              Mis Pedidos
            </Link>
          )}
          {user?.role === 'cocinero' && (
            <Link
              href="/cocinero"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium bg-amber-100 text-amber-900"
            >
              Tablero Cocina (Kanban)
            </Link>
          )}
          <Link
            href="/checkout"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-orange-600"
          >
            Mi Carrito ({totalCount} items)
          </Link>
        </div>
      )}
    </nav>
  );
};

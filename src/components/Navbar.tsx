'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getSocket } from '@/lib/socket';
import {
  BookOpen,
  ShoppingBag,
  Clock,
  Radio,
  LogOut,
  Menu,
  X,
  Truck,
  BookMarked,
  Layers,
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
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                Book<span className="text-indigo-600">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                Libros & E-Books
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/catalogo"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/catalogo') || isActive('/')
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
              }`}
            >
              Catálogo de Libros
            </Link>

            {user && (
              <>
                <Link
                  href="/pedidos"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/pedidos')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Mis Pedidos
                </Link>

                <Link
                  href="/biblioteca"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/biblioteca')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  <BookMarked className="w-4 h-4" />
                  Mi Biblioteca E-books
                </Link>
              </>
            )}

            {(user?.role === 'logistica' || user?.role === 'admin') && (
              <Link
                href="/logistica"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/logistica')
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                Tablero Logística en Vivo
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                href="/admin/libros"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/admin/libros')
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                Gestión Catálogo & Stock
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
              className="relative p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
              title="Ver Carrito y Finalizar Compra"
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
                      user.role === 'admin'
                        ? 'text-purple-600'
                        : user.role === 'logistica'
                        ? 'text-amber-600'
                        : 'text-indigo-600'
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
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
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
            href="/catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-indigo-50"
          >
            Catálogo de Libros
          </Link>
          {user && (
            <>
              <Link
                href="/pedidos"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-indigo-50"
              >
                Mis Pedidos
              </Link>
              <Link
                href="/biblioteca"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-indigo-50"
              >
                Mi Biblioteca E-books
              </Link>
            </>
          )}
          {(user?.role === 'logistica' || user?.role === 'admin') && (
            <Link
              href="/logistica"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium bg-amber-100 text-amber-900"
            >
              Tablero Logística (Kanban)
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              href="/admin/libros"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium bg-purple-100 text-purple-900"
            >
              Gestión Catálogo & Stock
            </Link>
          )}
          <Link
            href="/checkout"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600"
          >
            Mi Carrito ({totalCount} items)
          </Link>
        </div>
      )}
    </nav>
  );
};

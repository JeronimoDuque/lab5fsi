'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { IBook } from '@/types';
import {
  BookOpen,
  Truck,
  Download,
  CreditCard,
  Radio,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  Database,
} from 'lucide-react';

export default function HomePage() {
  const { addItem, formatPrice } = useCart();
  const [featuredBooks, setFeaturedBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const fetchFeaturedBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/books');
      const data = await res.json();
      if (res.ok && data.books) {
        setFeaturedBooks(data.books.slice(0, 4));
      }
    } catch (err) {
      console.error('Error fetching featured books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      setSeedMessage(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage('¡Datos de prueba cargados exitosamente (libros, usuarios y envíos)!');
        fetchFeaturedBooks();
      } else {
        setSeedMessage('Error al poblar base de datos: ' + (data.error || ''));
      }
    } catch (err: any) {
      setSeedMessage('Error de conexión al cargar datos de prueba.');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Seed Alert Notice */}
      {seedMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {seedMessage}
            </span>
            <button onClick={() => setSeedMessage(null)} className="text-emerald-700 font-bold hover:underline">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Librería Digital & Envíos Físicos Inteligentes
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            El Universo de las Letras en <span className="text-indigo-400">Tus Manos</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Descubre miles de obras. Compra tus libros físicos con <strong>gestión de stock y despacho en tiempo real</strong> o accede a <strong>e-books digitales con descarga inmediata</strong>.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/catalogo"
              className="px-8 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Explorar Catálogo
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-amber-400" />
              {seeding ? 'Cargando datos...' : 'Cargar Datos Demo (Seed)'}
            </button>
          </div>

          {/* Badges de características */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <Truck className="w-6 h-6 text-indigo-400 mb-2" />
              <div className="font-bold text-sm text-white">Envíos con Guía</div>
              <div className="text-xs text-slate-400">Rastreo con transportadoras</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <Download className="w-6 h-6 text-emerald-400 mb-2" />
              <div className="font-bold text-sm text-white">E-Books Inmediatos</div>
              <div className="text-xs text-slate-400">Descarga directa post-compra</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <Radio className="w-6 h-6 text-amber-400 mb-2" />
              <div className="font-bold text-sm text-white">Stock en Tiempo Real</div>
              <div className="text-xs text-slate-400">Sincronización WebSockets</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
              <CreditCard className="w-6 h-6 text-purple-400 mb-2" />
              <div className="font-bold text-sm text-white">Pagos PayPal</div>
              <div className="text-xs text-slate-400">Sandbox y Simulación</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Recomendaciones</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Libros Destacados del Mes
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            Ver todos los títulos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="w-full h-56 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">Aún no hay libros cargados en el catálogo.</p>
            <button
              onClick={handleSeedData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              Cargar Libros de Muestra (Seed)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <div
                key={book._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="relative h-60 bg-slate-100 overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {book.category}
                  </span>
                  {book.format !== 'ebook' && (
                    <span className="absolute bottom-3 right-3 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {book.stock} en bodega
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{book.title}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{book.author}</p>
                    <div className="mt-2 text-base font-black text-slate-900">
                      {formatPrice(book.price)}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href="/catalogo"
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ver en Catálogo
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Roles & Quick Access Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
              Acceso Rápido y Roles
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">
              Plataforma Multi-Rol con Tablero en Vivo
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Prueba los tres perfiles preconfigurados para experimentar el ciclo completo de compra, alistamiento, despacho y administración:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-2 font-bold text-indigo-300">
                <BookOpen className="w-5 h-5" />
                1. Rol Cliente
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Explora el catálogo, agrega libros físicos o e-books, paga con PayPal o simulador y descarga tus libros digitales.
              </p>
              <div className="text-[11px] font-mono bg-black/30 p-2 rounded-lg text-slate-300">
                cliente@bookhub.com / cliente123
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-2 font-bold text-amber-300">
                <Truck className="w-5 h-5" />
                2. Rol Operador Logística
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Visualiza el Tablero Kanban en tiempo real, asigna guías de transportadora (Servientrega, FedEx) y actualiza despachos.
              </p>
              <div className="text-[11px] font-mono bg-black/30 p-2 rounded-lg text-slate-300">
                logistica@bookhub.com / logistica123
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-2 font-bold text-purple-300">
                <Layers className="w-5 h-5" />
                3. Rol Administrador
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Crea nuevos libros, edita precios, gestiona inventario físico y supervisa todas las transacciones.
              </p>
              <div className="text-[11px] font-mono bg-black/30 p-2 rounded-lg text-slate-300">
                admin@bookhub.com / admin123
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

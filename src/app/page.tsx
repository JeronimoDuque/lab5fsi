'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleRunSeed = async () => {
    try {
      setSeeding(true);
      setSeedResult(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedResult('¡Base de datos inicializada exitosamente con usuarios, platos y pedidos de prueba!');
      } else {
        setSeedResult(`Error: ${data.error || 'No se pudo conectar a MongoDB. Asegúrate de tener MongoDB iniciado.'}`);
      }
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-orange-50/60 via-amber-50/30 to-white py-16 sm:py-24 border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold tracking-wide uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-spin" />
                FastFoodUdeA • Pedidos & Reservas
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                El mejor sabor de la UdeA, <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-amber-500">
                  en tiempo real a tu mesa.
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Explora el menú universitario, personaliza tus platos favoritos, paga de forma segura con PayPal y sigue el estado de tu pedido en tiempo real mientras nuestros cocineros lo preparan en su tablero Kanban.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/menu"
                  className="px-6 py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Ver Menú y Ordenar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/cocinero"
                  className="px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs flex items-center gap-2 transition-all"
                >
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  Panel Cocinero (Kanban)
                </Link>
              </div>

              {/* Seed Button Banner */}
              <div className="pt-4">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">¿Primera vez iniciando?</h4>
                      <p className="text-xs text-amber-700">Carga los usuarios y el menú inicial con un solo clic.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRunSeed}
                    disabled={seeding}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                    {seeding ? 'Cargando datos...' : 'Cargar Datos de Prueba (Seed)'}
                  </button>
                </div>
                {seedResult && (
                  <div
                    className={`mt-2 p-3 rounded-lg text-xs font-medium ${
                      seedResult.startsWith('Error')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {seedResult}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Card Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-linear-to-tr from-orange-500 to-amber-500 p-1 shadow-2xl shadow-orange-500/20">
                <div className="rounded-[22px] bg-slate-900 text-white p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">FastFoodUdeA</h3>
                        <p className="text-xs text-slate-400">Cuentas de Acceso Rápido</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      WebSocket Activo
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Cocinero Account Box */}
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">Rol: Cocinero</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Tablero Kanban en vivo</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">cocinero@fastfoodudea.com</p>
                      <p className="text-[11px] text-slate-400">Contraseña: <span className="text-amber-200 font-mono">cocinero123</span></p>
                    </div>

                    {/* Cliente Account Box */}
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-orange-400" />
                          <span className="text-xs font-bold text-orange-400">Rol: Cliente</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Menú + PayPal</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">cliente@fastfoodudea.com</p>
                      <p className="text-[11px] text-slate-400">Contraseña: <span className="text-orange-200 font-mono">cliente123</span></p>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    Ir a la pantalla de Login
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Arquitectura Completa y Moderna
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Diseñado con Next.js 16 App Router, MongoDB Atlas, WebSockets en tiempo real y flujo completo de compra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Menú Universitario</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filtra por categorías (Hamburguesas, Salchipapas, Pizzas, Bebidas), agrega al carrito y gestiona cantidades en tiempo real.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pagos con PayPal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integración con checkout de PayPal y modo de prueba simulada para crear la reserva y registrar el pedido automáticamente.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Tablero Kanban</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Los cocineros arrastran los pedidos entre columnas: Pendiente, En preparación, Listo y Entregado de forma fluida.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">WebSockets en Vivo</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sincronización instantánea mediante Socket.io entre la cocina y los clientes sin necesidad de recargar la página.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

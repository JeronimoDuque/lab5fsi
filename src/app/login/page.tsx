'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UtensilsCrossed, ChefHat, ShoppingBag, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (email.includes('cocinero')) {
        router.push('/cocinero');
      } else {
        router.push('/menu');
      }
    } else {
      setError(result.error || 'Credenciales inválidas');
    }
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-600 items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-2">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-500">
            Ingresa a tu cuenta de FastFoodUdeA
          </p>
        </div>

        {/* Quick Demo Accounts */}
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 space-y-2.5">
          <p className="text-xs font-bold text-orange-950 uppercase tracking-wider text-center">
            🚀 Cuentas Rápidas de Prueba
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('cocinero@fastfoodudea.com', 'cocinero123')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-amber-200 hover:bg-amber-100/60 text-amber-900 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              Cocinero
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('cliente@fastfoodudea.com', 'cliente123')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-orange-200 hover:bg-orange-100/60 text-orange-900 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              Cliente
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@udea.edu.co"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? (
              <span className="text-sm">Iniciando sesión...</span>
            ) : (
              <>
                <span className="text-sm">Entrar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-bold text-orange-600 hover:text-orange-700">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
}

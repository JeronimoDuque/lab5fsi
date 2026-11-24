'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Truck,
  Layers,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (email.includes('admin')) {
        router.push('/admin/libros');
      } else if (email.includes('logistica')) {
        router.push('/logistica');
      } else {
        router.push('/catalogo');
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
      <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-2">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-slate-500">
            Ingresa a tu cuenta de BookHub
          </p>
        </div>

        {/* Cuentas Demo Rápidas */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-2.5">
          <p className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider text-center">
            🚀 Cuentas Rápidas de Prueba (Demo)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('cliente@bookhub.com', 'cliente123')}
              className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-white border border-indigo-200 hover:bg-indigo-100/60 text-indigo-900 flex flex-col items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('logistica@bookhub.com', 'logistica123')}
              className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-white border border-amber-200 hover:bg-amber-100/60 text-amber-900 flex flex-col items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Logística</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('admin@bookhub.com', 'admin123')}
              className="px-2 py-2 rounded-xl text-[11px] font-semibold bg-white border border-purple-200 hover:bg-purple-100/60 text-purple-900 flex flex-col items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@bookhub.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all mt-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

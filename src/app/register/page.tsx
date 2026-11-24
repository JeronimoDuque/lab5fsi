'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
  BookOpen,
  Truck,
  Layers,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  AlertCircle,
  ArrowRight,
  Building,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('cliente');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await register(name, email, password, role, address, city, phone);
    setLoading(false);

    if (result.success) {
      if (role === 'admin') {
        router.push('/admin/libros');
      } else if (role === 'logistica') {
        router.push('/logistica');
      } else {
        router.push('/catalogo');
      }
    } else {
      setError(result.error || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Crear Cuenta en BookHub
          </h2>
          <p className="text-xs text-slate-500">
            Regístrate como Cliente, Operador de Logística o Administrador
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Selecciona tu Rol</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole('cliente')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                role === 'cliente'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <User className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
              <div className="text-xs font-bold">Cliente</div>
              <div className="text-[10px] text-slate-400">Comprar & Leer</div>
            </button>

            <button
              type="button"
              onClick={() => setRole('logistica')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                role === 'logistica'
                  ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Truck className="w-4 h-4 mx-auto mb-1 text-amber-600" />
              <div className="text-xs font-bold">Logística</div>
              <div className="text-[10px] text-slate-400">Despacho & Stock</div>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                role === 'admin'
                  ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Layers className="w-4 h-4 mx-auto mb-1 text-purple-600" />
              <div className="text-xs font-bold">Admin</div>
              <div className="text-[10px] text-slate-400">Control Total</div>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Laura Gómez"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="laura@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dirección</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 10 # 40-20"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Medellín"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="300 123 4567"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all mt-4"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

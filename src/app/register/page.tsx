'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { UtensilsCrossed, ChefHat, ShoppingBag, Lock, Mail, User, Phone, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cliente');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await register(name, email, password, role, address, phone);
    setLoading(false);

    if (result.success) {
      if (role === 'cocinero') {
        router.push('/cocinero');
      } else {
        router.push('/menu');
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
          <div className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-600 items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-2">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Crear Cuenta en FastFoodUdeA
          </h2>
          <p className="text-xs text-slate-500">
            Regístrate como Cliente o Cocinero del restaurante
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Selecciona tu Rol:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('cliente')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                role === 'cliente'
                  ? 'bg-orange-50 border-orange-500 text-orange-900 ring-2 ring-orange-200 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className={`w-5 h-5 ${role === 'cliente' ? 'text-orange-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">Cliente</span>
              <span className="text-[10px] text-slate-500">Pedir platos y reservas</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('cocinero')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                role === 'cocinero'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ChefHat className={`w-5 h-5 ${role === 'cocinero' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">Cocinero</span>
              <span className="text-[10px] text-slate-500">Tablero Kanban y cocina</span>
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Institucional o Personal
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@udea.edu.co"
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="300 123 4567"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección / Bloque UdeA
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bloque 19, Aula 204"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="text-sm">Registrando...</span>
            ) : (
              <>
                <span className="text-sm">Completar Registro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-bold text-orange-600 hover:text-orange-700">
            Inicia sesión aquí
          </Link>
        </div>

      </div>
    </div>
  );
}

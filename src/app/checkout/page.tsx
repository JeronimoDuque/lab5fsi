'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Phone,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, formatPrice } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'Bloque 19, Aula 204, Ciudad Universitaria');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '3001234567');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessOrder = async (isSimulated = true) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      setError('El carrito está vacío.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('La dirección de entrega es requerida.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 1. Simular o verificar pago con PayPal
      const payRes = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          simulated: isSimulated,
          paypalOrderId: isSimulated ? `PAYPAL-DEMO-${Date.now()}` : undefined,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || 'Error al procesar el pago con PayPal.');
      }

      // 2. Registrar la orden / reserva automáticamente
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            dish: i.dish._id,
            name: i.dish.name,
            price: i.dish.price,
            quantity: i.quantity,
          })),
          deliveryAddress,
          deliveryPhone,
          notes,
          paymentMethod: isSimulated ? 'paypal_simulated' : 'paypal',
          paypalOrderId: payData.transactionId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Error al registrar el pedido.');
      }

      // 3. Limpiar carrito y redirigir al seguimiento en tiempo real
      clearCart();
      router.push(`/pedidos/${orderData.order._id}`);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al procesar el pedido.');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-slate-500 text-sm mb-6">
          Aún no has agregado deliciosos platos de FastFoodUdeA a tu pedido.
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/20"
        >
          Explorar el Menú
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Resumen y Confirmación de Pedido</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Verifica tus platos, ingresa tu dirección en el campus y procesa tu pago con PayPal.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Delivery details & Items List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Order Items List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              Platos Seleccionados ({items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.dish._id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.dish.image}
                      alt={item.dish.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{item.dish.name}</h4>
                      <p className="text-xs text-orange-600 font-semibold">
                        {formatPrice(item.dish.price)} c/u
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.dish._id, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.dish._id, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-extrabold text-sm text-slate-900 w-24 text-right">
                      {formatPrice(item.dish.price * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeItem(item.dish._id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Dirección de Entrega en el Campus UdeA
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubicación exacta de entrega (Bloque, aula, piso o referencia)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ej. Bloque 19, Aula 204"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 self-center">Ejemplos:</span>
                  {[
                    'Bloque 19, Aula 204',
                    'Biblioteca Central, 2do Piso',
                    'Bloque 21 - Decanatura',
                    'Portería Calle Barranquilla',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDeliveryAddress(sug)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / Celular de contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas para la cocina o repartidor (Opcional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Sin cebolla en la hamburguesa, salsa aparte..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Financial Summary & PayPal Payment */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6 sticky top-24">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Total de la Reserva</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Entrega UdeA Gratis
              </span>
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} productos):</span>
                <span className="font-semibold text-slate-800">{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Costo de envío / servicio:</span>
                <span className="font-bold text-emerald-600">$0 COP (Gratis)</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-slate-900">Total a Pagar:</span>
                <span className="text-2xl font-black text-orange-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* PayPal Integration Container */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Pago Seguro con PayPal Sandbox</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  El pedido se convertirá automáticamente en una reserva activa y se enviará en tiempo real al tablero Kanban del cocinero.
                </p>
              </div>

              {/* Action Button: PayPal Demo / Simulated Checkout */}
              <button
                type="button"
                onClick={() => handleProcessOrder(true)}
                disabled={processing}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-slate-900 bg-[#FFC439] hover:bg-[#F4B400] shadow-md shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {/* PayPal Logo Text */}
                <span className="font-serif italic text-lg font-black tracking-tighter text-[#003087]">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </span>
                <span className="text-sm font-bold">
                  {processing ? 'Procesando Pago y Reserva...' : 'Pagar Ahora con PayPal (Simulación)'}
                </span>
              </button>

              <div className="text-center text-[10px] text-slate-400">
                Modo Sandbox activo • Transacción segura e instantánea
              </div>
            </div>

            {!user && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <p className="text-xs text-orange-800 font-medium">
                  Para registrar tu pedido a tu nombre, debes iniciar sesión.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-block text-xs font-bold text-orange-600 underline"
                >
                  Ir al Login
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

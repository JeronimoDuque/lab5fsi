'use client';

import React, { useState } from 'react';
import Script from 'next/script';
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

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: (data: unknown, actions: {
          order: {
            create: (order: {
              intent: 'CAPTURE';
              purchase_units: Array<{
                description: string;
                amount: { currency_code: 'USD'; value: string };
              }>;
            }) => Promise<string>;
          };
        }) => Promise<string>;
        onApprove: (data: { orderID: string }, actions: {
          order: {
            capture: () => Promise<{
              status: string;
              purchase_units?: Array<{
                payments?: {
                  captures?: Array<{ id: string; status: string; amount: { value: string } }>;
                };
              }>;
            }>;
          };
        }) => Promise<void>;
        onError: (error: Error) => void;
        onCancel: () => void;
        style: {
          layout: 'vertical';
          color: 'gold';
          shape: 'rect';
          label: 'paypal';
          height: 48;
        };
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, formatPrice } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || 'Bloque 19, Aula 204, Ciudad Universitaria');
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '3001234567');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalContainerReady, setPaypalContainerReady] = useState(false);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const usdAmount = (totalAmount / 4000).toFixed(2);

  const registerCapturedOrder = async (
    paypalOrderId: string,
    captureId: string,
  ) => {
    const payRes = await fetch('/api/payments/paypal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalAmount,
        simulated: false,
        paypalOrderId,
        captureId,
        amountUsd: usdAmount,
      }),
    });

    const payData = await payRes.json();
    if (!payRes.ok) {
      throw new Error(payData.error || 'PayPal no pudo confirmar el pago.');
    }

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
        paymentMethod: 'paypal',
        paypalOrderId,
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.error || 'Error al registrar el pedido.');
    }

    clearCart();
    router.push(`/pedidos/${orderData.order._id}`);
  };

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
              {paypalClientId && (
                <Script
                  src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`}
                  strategy="afterInteractive"
                  onLoad={() => setPaypalReady(true)}
                  onError={() => setError('No fue posible cargar PayPal. Revisa tu conexión e intenta nuevamente.')}
                />
              )}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Pago Seguro con PayPal</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Se cobrará el equivalente aproximado de US${usdAmount} (COP calculado a una tasa referencial de 4000 COP por USD).
                </p>
              </div>

              {paypalReady && window.paypal ? (
                <div
                  ref={(element) => {
                    if (!element || paypalContainerReady) return;
                    setPaypalContainerReady(true);
                    window.paypal?.Buttons({
                      style: {
                        layout: 'vertical',
                        color: 'gold',
                        shape: 'rect',
                        label: 'paypal',
                        height: 48,
                      },
                      createOrder: async (_data, actions) =>
                        actions.order.create({
                          intent: 'CAPTURE',
                          purchase_units: [{
                            description: 'Pedido FastFoodUdeA',
                            amount: {
                              currency_code: 'USD',
                              value: usdAmount,
                            },
                          }],
                        }),
                      onApprove: async (data, actions) => {
                        if (!deliveryAddress.trim()) {
                          setError('La dirección de entrega es requerida.');
                          return;
                        }
                        try {
                          setProcessing(true);
                          setError(null);
                          const capture = await actions.order.capture();
                          const captureId =
                            capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
                          const captureStatus =
                            capture.purchase_units?.[0]?.payments?.captures?.[0]?.status;

                          if (capture.status !== 'COMPLETED' && captureStatus !== 'COMPLETED') {
                            throw new Error('El pago no fue completado por PayPal.');
                          }
                          if (!captureId) {
                            throw new Error('PayPal no devolvió el identificador de la captura.');
                          }

                          await registerCapturedOrder(data.orderID, captureId);
                        } catch (err: any) {
                          setError(err.message || 'Error al procesar el pago con PayPal.');
                        } finally {
                          setProcessing(false);
                        }
                      },
                      onError: (paypalError) => {
                        setError(paypalError.message || 'Error durante el pago con PayPal.');
                        setProcessing(false);
                      },
                      onCancel: () => {
                        setError('El pago con PayPal fue cancelado.');
                        setProcessing(false);
                      },
                    }).render('#paypal-button-container');
                  }}
                >
                  <div id="paypal-button-container" />
                </div>
              ) : (
                <div className="w-full py-4 text-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">
                  {!paypalClientId
                    ? 'Configura NEXT_PUBLIC_PAYPAL_CLIENT_ID'
                    : 'Cargando PayPal...'}
                </div>
              )}

              <div className="text-center text-[10px] text-slate-400">
                Transacción procesada por PayPal • Sandbox
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

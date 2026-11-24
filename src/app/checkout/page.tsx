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
  Package,
  Download,
  Building,
  Truck,
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
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalAmount,
    shippingCost,
    totalAmount,
    hasPhysicalItems,
    hasEbookItems,
    formatPrice,
  } = useCart();

  const [address, setAddress] = useState(user?.address || 'Calle 67 # 53-108');
  const [city, setCity] = useState(user?.city || 'Medellín');
  const [department, setDepartment] = useState('Antioquia');
  const [phone, setPhone] = useState(user?.phone || '3001234567');
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
          book: i.book._id,
          format: i.selectedFormat,
          quantity: i.quantity,
        })),
        shippingAddress: {
          address,
          city,
          department,
          phone,
          notes,
        },
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

    if (hasPhysicalItems && (!address.trim() || !city.trim())) {
      setError('La dirección y ciudad de entrega son obligatorias para libros físicos.');
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
          paypalOrderId: isSimulated ? `PAYPAL-SIM-${Date.now()}` : undefined,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || 'Error al procesar el pago.');
      }

      // 2. Registrar la orden en el backend
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            book: i.book._id,
            format: i.selectedFormat,
            quantity: i.quantity,
          })),
          shippingAddress: {
            address,
            city,
            department,
            phone,
            notes,
          },
          paymentMethod: isSimulated ? 'paypal_simulated' : 'paypal',
          paypalOrderId: payData.transactionId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Error al registrar el pedido.');
      }

      // 3. Limpiar carrito y redirigir
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
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-slate-500 text-sm mb-6">
          Aún no has agregado libros ni e-books a tu orden de compra.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
        >
          Explorar Catálogo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {paypalClientId && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`}
          strategy="afterInteractive"
          onLoad={() => setPaypalReady(true)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Finalizar Compra</h1>
        <p className="text-slate-500 text-sm mt-1">
          Revisa tus libros, ingresa los datos de envío y completa tu pago seguro.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Items del Carrito y Formulario de Envío */}
        <div className="lg:col-span-7 space-y-6">
          {/* Items de la Orden */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              Libros en tu Carrito ({items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={`${item.book._id}-${item.selectedFormat}`} className="py-4 flex gap-4 items-center">
                  <img
                    src={item.book.coverImage}
                    alt={item.book.title}
                    className="w-16 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.selectedFormat === 'fisico'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {item.selectedFormat === 'fisico' ? 'Libro Físico' : 'E-Book (Digital)'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm truncate mt-1">{item.book.title}</h3>
                    <p className="text-xs text-slate-500">{item.book.author}</p>
                    <div className="text-sm font-extrabold text-slate-900 mt-1">
                      {formatPrice(item.book.price)}
                    </div>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.book._id, item.selectedFormat, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.book._id, item.selectedFormat, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.book._id, item.selectedFormat)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 ml-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Envíos */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Información de Despacho y Envío
            </h2>

            {hasPhysicalItems ? (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tu orden incluye libros físicos. Enviaremos con transportadora certificada y número de rastreo.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Dirección de Entrega *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej. Cra 43A # 1-50, Apto 402"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ciudad *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej. Medellín, Bogotá, Cali"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Ej. Antioquia, Cundinamarca"
                      className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="300 123 4567"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instrucciones Especiales / Notas
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones de entrega para la portería o transportadora..."
                    className="w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-sm mt-3 flex items-start gap-3">
                <Download className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">¡Compra 100% Digital (E-books)!</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    No requieres ingresar dirección física ni pagar costo de envío. Tus e-books estarán disponibles para lectura y descarga inmediata en tu biblioteca una vez completado el pago.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen de Pago y Pasarela */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Resumen de la Orden
            </h2>

            <div className="space-y-2 text-sm text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal libros</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de envío nacional</span>
                <span className="font-semibold text-slate-900">
                  {shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Equivalente aprox. USD</span>
                <span>${usdAmount} USD</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-base font-bold text-slate-900">Total a Pagar</span>
              <span className="text-2xl font-black text-indigo-600">{formatPrice(totalAmount)}</span>
            </div>

            {/* Opciones de Pago */}
            <div className="space-y-3 pt-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Selecciona Método de Pago
              </div>

              {/* Botón 1: Simulación Inmediata (Pruebas / Demo) */}
              <button
                onClick={() => handleProcessOrder(true)}
                disabled={processing}
                className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                {processing ? 'Procesando Orden...' : 'Pagar con Simulación Inmediata (Demo)'}
              </button>
              <p className="text-[11px] text-center text-slate-500">
                Ideal para pruebas rápidas y calificación académica sin requerir saldo ni tarjetas.
              </p>

              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-4 text-slate-400 text-xs font-medium uppercase">o con PayPal</span>
                <div className="grow border-t border-slate-200" />
              </div>

              {/* Botón 2: PayPal Sandbox Oficial */}
              {paypalClientId && (
                <div className="pt-1">
                  <div id="paypal-button-container" className="min-h-[48px]" />
                  {paypalReady && !paypalContainerReady && (
                    <button
                      onClick={() => {
                        if (window.paypal) {
                          setPaypalContainerReady(true);
                          window.paypal
                            .Buttons({
                              createOrder: (data, actions) => {
                                return actions.order.create({
                                  intent: 'CAPTURE',
                                  purchase_units: [
                                    {
                                      description: `BookHub Orden - ${items.length} libros`,
                                      amount: {
                                        currency_code: 'USD',
                                        value: usdAmount,
                                      },
                                    },
                                  ],
                                });
                              },
                              onApprove: async (data, actions) => {
                                const details = await actions.order.capture();
                                const captureId =
                                  details.purchase_units?.[0]?.payments?.captures?.[0]?.id || data.orderID;
                                await registerCapturedOrder(data.orderID, captureId);
                              },
                              onError: (err) => {
                                setError('Error en PayPal Sandbox.');
                              },
                              onCancel: () => {
                                setError('Transacción de PayPal cancelada.');
                              },
                              style: {
                                layout: 'vertical',
                                color: 'gold',
                                shape: 'rect',
                                label: 'paypal',
                                height: 48,
                              },
                            })
                            .render('#paypal-button-container');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-sm shadow-xs flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Activar Pasarela PayPal Sandbox
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Transacción 100% Segura con Encriptación SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

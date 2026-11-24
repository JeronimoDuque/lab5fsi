'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { IOrder, OrderStatus, IOrderItem } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  Clock,
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Radio,
  Sparkles,
  Download,
  BookOpen,
  Calendar,
} from 'lucide-react';

const steps: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'Pendiente',
    label: 'Pedido Confirmado',
    desc: 'Tu orden y pago fueron confirmados. Esperando embalaje en almacén.',
    icon: Clock,
  },
  {
    status: 'En Preparación',
    label: 'En Preparación / Empaque',
    desc: 'Tus libros están siendo separados y empacados cuidadosamente en bodega.',
    icon: Package,
  },
  {
    status: 'Despachado',
    label: 'Despachado con Transportadora',
    desc: 'Paquete en tránsito con transportadora oficial y número de guía asignado.',
    icon: Truck,
  },
  {
    status: 'Entregado',
    label: 'Entregado',
    desc: '¡Paquete entregado con éxito en tu dirección de destino!',
    icon: CheckCircle2,
  },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'No se encontró la orden');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Conectar WebSocket y unirse a la sala de la orden
    const socket = getSocket();
    if (socket) {
      socket.emit('join:order', id);
      setIsLive(true);

      const handleUpdate = (updatedOrder: IOrder) => {
        if (updatedOrder._id === id) {
          setOrder(updatedOrder);
        }
      };

      socket.on('order:status_updated', handleUpdate);

      return () => {
        socket.off('order:status_updated', handleUpdate);
      };
    }
  }, [id]);

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente':
        return 0;
      case 'En Preparación':
        return 1;
      case 'Despachado':
        return 2;
      case 'Entregado':
        return 3;
      default:
        return 0;
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-3xl mx-auto mb-4" />
        <div className="h-6 bg-slate-200 rounded-md w-60 mx-auto mb-2" />
        <div className="h-4 bg-slate-200 rounded-md w-40 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Pedido No Encontrado</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'El pedido solicitado no existe o no tienes acceso.'}</p>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const ebookItems = order.items.filter((it) => it.format === 'ebook');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar a Mis Pedidos
        </Link>

        {isLive && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Canal en vivo WebSocket conectado
          </div>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
              Comprobante de Pedido BookHub
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(order.createdAt).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Facturado</span>
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(order.totalAmount)}
            </span>
            <span className="block text-[11px] font-semibold text-emerald-600 mt-0.5">
              Pago Confirmado ({order.paymentMethod === 'paypal_simulated' ? 'Simulado' : 'PayPal'})
            </span>
          </div>
        </div>

        {/* E-books direct download banner if present */}
        {ebookItems.length > 0 && (
          <div className="p-5 bg-linear-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              ¡E-Books listos para descarga inmediata!
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ebookItems.map((ebook, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-200 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{ebook.title}</h4>
                    <span className="text-[10px] text-emerald-700 font-semibold">Formato Digital PDF / ePub</span>
                  </div>
                  <a
                    href={ebook.downloadUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <Download className="w-3 h-3" /> Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stepper en Tiempo Real */}
        <div className="pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Estado de Despacho y Logística en Tiempo Real
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={s.status}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                      : isPast
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 animate-pulse'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">Paso {idx + 1}</span>
                  </div>

                  <h3 className={`text-sm font-bold ${isCurrent ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {s.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Datos de Envío y Transportadora */}
        {order.hasPhysicalItems && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Destino del Envío
              </span>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                {order.shippingAddress.address}, {order.shippingAddress.city}
              </p>
              {order.shippingAddress.department && (
                <p className="text-xs text-slate-600">Departamento: {order.shippingAddress.department}</p>
              )}
              {order.shippingAddress.phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.shippingAddress.phone}
                </p>
              )}
            </div>

            <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                Transportadora y Guía de Rastreo
              </span>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-slate-900 text-base">
                  {order.shipment?.carrier || 'Servientrega'}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Guía:{' '}
                <span className="font-mono font-bold text-indigo-700">
                  {order.shipment?.trackingNumber || 'En asignación de guía...'}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                Entrega estimada: {order.shipment?.estimatedDelivery || '2 a 4 días hábiles'}
              </p>
            </div>
          </div>
        )}

        {/* Lista de Items */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Detalle de Libros en este Pedido</h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{item.quantity}x {item.title}</span>
                  <span className="text-slate-400 ml-2">
                    ({item.format === 'fisico' ? 'Libro Físico' : 'E-Book Digital'})
                  </span>
                </div>
                <span className="font-bold text-slate-900">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

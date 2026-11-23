'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { IOrder, OrderStatus } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Radio,
  Sparkles,
} from 'lucide-react';

const steps: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'Pendiente',
    label: 'Pedido Recibido',
    desc: 'Tu orden fue pagada y registrada en la cocina de FastFoodUdeA.',
    icon: Clock,
  },
  {
    status: 'En preparación',
    label: 'En Preparación',
    desc: 'Los cocineros están preparando tus platos en los fogones.',
    icon: ChefHat,
  },
  {
    status: 'Listo',
    label: 'Listo para Entrega',
    desc: 'Tu comida está empacada y caliente, lista para ser entregada.',
    icon: CheckCircle2,
  },
  {
    status: 'Entregado',
    label: 'Entregado',
    desc: '¡Buen provecho! Tu pedido fue entregado con éxito.',
    icon: Package,
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
      case 'En preparación':
        return 1;
      case 'Listo':
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500">Cargando seguimiento de tu pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error al consultar el pedido</h2>
        <p className="text-xs text-red-600 mb-6">{error || 'Pedido no disponible'}</p>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al historial
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          Sincronizado en tiempo real
        </div>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">
              Reserva Registrada
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Pedido {order.orderNumber}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Fecha: {new Date(order.createdAt).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Cancelado
            </span>
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(order.totalAmount)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold block mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              PayPal: {order.paypalOrderId || 'Aprobado'}
            </span>
          </div>
        </div>

        {/* Live Stepper */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            Progreso de la Orden en Cocina:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={step.status}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-200'
                      : isPast
                      ? 'bg-slate-50 border-emerald-300'
                      : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-orange-600 text-white shadow-xs animate-pulse'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dishes Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            Detalle de Platos Solicitados
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{it.name}</p>
                  <p className="text-slate-400">
                    {it.quantity} x {formatPrice(it.price)}
                  </p>
                </div>
                <span className="font-extrabold text-slate-900">
                  {formatPrice(it.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            Datos de Entrega en el Campus
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700 block">Lugar de entrega:</span>
                <span className="text-slate-600">{order.deliveryAddress}</span>
              </div>
            </div>

            {order.deliveryPhone && (
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">Teléfono de contacto:</span>
                  <span className="text-slate-600">{order.deliveryPhone}</span>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px]">
                <span className="font-bold block text-slate-700 mb-0.5">Notas del cliente:</span>
                "{order.notes}"
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

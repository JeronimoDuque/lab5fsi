'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { IOrder, OrderStatus } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  Clock,
  Package,
  CheckCircle2,
  Truck,
  ArrowRight,
  Radio,
  BookOpen,
  MapPin,
  Calendar,
  Download,
} from 'lucide-react';

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  Pendiente: {
    label: 'Pendiente de Alistamiento',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  'En Preparación': {
    label: 'En Preparación / Empaque',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Package,
  },
  Despachado: {
    label: 'Despachado / Con Guía',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: Truck,
  },
  Entregado: {
    label: 'Entregado con Éxito',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: Clock,
  },
};

export default function PedidosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchOrders();

      const socket = getSocket();
      if (socket) {
        const handleStatusUpdate = (updatedOrder: IOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
          );
        };

        const handleNewOrder = (newOrder: IOrder) => {
          if (newOrder.customer === user.id) {
            setOrders((prev) => [newOrder, ...prev]);
          }
        };

        socket.on('order:status_updated', handleStatusUpdate);
        socket.on('order:new', handleNewOrder);

        return () => {
          socket.off('order:status_updated', handleStatusUpdate);
          socket.off('order:new', handleNewOrder);
        };
      }
    }
  }, [user, authLoading]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Mis Pedidos de Libros</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Seguimiento de compras, despachos con transportadora y acceso a descargas de e-books en tiempo real.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          WebSockets Live Sync Activo
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-36" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Aún no tienes pedidos registrados</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Realiza tu primer pedido de libros físicos o e-books en BookHub y podrás seguir su despacho aquí en vivo.
          </p>
          <Link
            href="/catalogo"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md inline-flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig['Pendiente'];
            const StatusIcon = config.icon;

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Detalle de Libros */}
                  <div className="text-xs text-slate-600">
                    <div className="font-semibold text-slate-800 mb-1 flex flex-wrap gap-2">
                      {order.items.map((it, idx) => (
                        <span key={idx} className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {it.quantity}x {it.title} ({it.format === 'fisico' ? 'Físico' : 'E-Book'})
                        </span>
                      ))}
                    </div>

                    {order.shippingAddress?.address && (
                      <p className="text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Envío a: {order.shippingAddress.address}, {order.shippingAddress.city}
                      </p>
                    )}

                    {order.shipment?.trackingNumber && (
                      <p className="text-indigo-600 font-semibold flex items-center gap-1 mt-1">
                        <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        Guía: {order.shipment.carrier} - {order.shipment.trackingNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Pagado
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  <Link
                    href={`/pedidos/${order._id}`}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center gap-1.5 transition-colors"
                  >
                    Ver Seguimiento
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

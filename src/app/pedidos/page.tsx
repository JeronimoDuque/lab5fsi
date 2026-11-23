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
  ChefHat,
  ArrowRight,
  Radio,
  ShoppingBag,
  MapPin,
  Calendar,
} from 'lucide-react';

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  Pendiente: {
    label: 'Pendiente',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  'En preparación': {
    label: 'En preparación',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: ChefHat,
  },
  Listo: {
    label: 'Listo para Entrega',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  Entregado: {
    label: 'Entregado',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: Package,
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

      // Suscribirse a WebSockets para actualizaciones en tiempo real
      const socket = getSocket();
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
          <h1 className="text-3xl font-black text-slate-900">Mis Pedidos y Reservas</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Historial de pedidos con sincronización en tiempo real vía WebSockets.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          Actualizaciones en vivo activas
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
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Aún no tienes pedidos registrados</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Realiza tu primer pedido en FastFoodUdeA y podrás ver aquí cómo el cocinero lo prepara en tiempo real.
          </p>
          <Link
            href="/menu"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Explorar el Menú
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
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
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
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 mb-0.5">
                      {order.items.map((it) => `${it.quantity}x ${it.name}`).join(' • ')}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {order.deliveryAddress}
                    </p>
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
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center gap-1.5 transition-colors"
                  >
                    Seguimiento en Vivo
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

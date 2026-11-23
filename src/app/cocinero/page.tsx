'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { IOrder, OrderStatus } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Package,
  Radio,
  ArrowRight,
  ArrowLeft,
  MapPin,
  FileText,
  User,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Volume2,
  Filter,
} from 'lucide-react';

const columns: { id: OrderStatus; title: string; color: string; border: string; bg: string; badge: string; icon: any }[] = [
  {
    id: 'Pendiente',
    title: 'Pendiente',
    color: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-800',
    icon: Clock,
  },
  {
    id: 'En preparación',
    title: 'En Preparación',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-800',
    icon: ChefHat,
  },
  {
    id: 'Listo',
    title: 'Listo',
    color: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
  {
    id: 'Entregado',
    title: 'Entregado',
    color: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50/50',
    badge: 'bg-purple-100 text-purple-800',
    icon: Package,
  },
];

export default function CocineroKanbanDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  const [newOrderNotice, setNewOrderNotice] = useState<string | null>(null);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders for kitchen', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'cocinero') {
        // Redirigir si no es cocinero
        router.push('/menu');
        return;
      }
    }

    if (user && user.role === 'cocinero') {
      fetchAllOrders();

      const socket = getSocket();
      if (socket) {
        socket.emit('join:kitchen');
        if (socket.connected) setIsSocketLive(true);

        socket.on('connect', () => {
          setIsSocketLive(true);
          socket.emit('join:kitchen');
        });

        socket.on('disconnect', () => setIsSocketLive(false));

        // Escuchar nuevo pedido entrante
        const handleNewOrder = (newOrder: IOrder) => {
          setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
          setNewOrderNotice(`¡Nuevo pedido entrante! #${newOrder.orderNumber}`);
          setTimeout(() => setNewOrderNotice(null), 5000);
        };

        // Escuchar actualización de estado
        const handleStatusUpdate = (updatedOrder: IOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
          );
        };

        socket.on('order:new', handleNewOrder);
        socket.on('order:status_updated', handleStatusUpdate);

        return () => {
          socket.off('order:new', handleNewOrder);
          socket.off('order:status_updated', handleStatusUpdate);
        };
      }
    }
  }, [user, authLoading]);

  // Cambiar estado de la orden (por drag and drop o por botones)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Actualización optimista en el cliente
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
    );

    // 1. Emitir vía WebSocket directo al servidor
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('order:update_status', { orderId, status: newStatus });
    }

    // 2. Y también mediante la API REST PATCH para persistencia y redundancia
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error al persistir nuevo estado de la orden', err);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent, colId: OrderStatus) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: OrderStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      handleUpdateOrderStatus(orderId, colId);
      setDraggedOrderId(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'Pendiente') return 'En preparación';
    if (current === 'En preparación') return 'Listo';
    if (current === 'Listo') return 'Entregado';
    return null;
  };

  const getPrevStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'Entregado') return 'Listo';
    if (current === 'Listo') return 'En preparación';
    if (current === 'En preparación') return 'Pendiente';
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500">Cargando tablero de control de cocina...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <ChefHat className="w-4 h-4 text-amber-700" />
            Panel Operativo de Cocina
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Tablero Kanban de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Arrastra los pedidos entre columnas para cambiar su estado en tiempo real vía WebSockets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            {isSocketLive ? 'Cocina en Vivo (WebSockets Conectado)' : 'Reconectando WebSockets...'}
          </div>

          <button
            onClick={fetchAllOrders}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Refrescar pedidos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Order Alert Notification Banner */}
      {newOrderNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-amber-500/30 animate-bounce">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>{newOrderNotice}</span>
          </div>
          <button
            onClick={() => setNewOrderNotice(null)}
            className="text-xs px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Kanban Board Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          const ColIcon = col.icon;
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-3xl border ${col.border} ${col.bg} p-4 transition-all duration-200 flex flex-col min-h-[600px] ${
                isOver ? 'ring-2 ring-orange-500 bg-orange-50/50 scale-[1.01]' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ColIcon className={`w-4 h-4 ${col.color}`} />
                  <h3 className={`font-black text-sm ${col.color}`}>{col.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Droppable Area & Cards List */}
              <div className="flex-1 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200/80 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                    <span>Sin pedidos en esta etapa</span>
                    <span className="text-[10px] mt-1 text-slate-400">
                      Arrastra una orden aquí
                    </span>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const nextSt = getNextStatus(order.status);
                    const prevSt = getPrevStatus(order.status);

                    return (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order._id)}
                        className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-3"
                      >
                        {/* Top: Order number & time */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(order.createdAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Customer & Address */}
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {order.customerName}
                          </p>
                          <p className="text-slate-500 text-[11px] flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{order.deliveryAddress}</span>
                          </p>
                        </div>

                        {/* Dishes list preview */}
                        <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-700 space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="font-medium">
                                <span className="font-bold text-orange-600">{it.quantity}x</span> {it.name}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Special instructions */}
                        {order.notes && (
                          <div className="p-2 rounded-lg bg-amber-50 text-[10px] text-amber-900 font-medium flex items-start gap-1">
                            <FileText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">Nota: {order.notes}</span>
                          </div>
                        )}

                        {/* Price & Quick Move Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {formatPrice(order.totalAmount)}
                          </span>

                          <div className="flex items-center gap-1">
                            {prevSt && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, prevSt)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                title={`Mover atrás a ${prevSt}`}
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextSt && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, nextSt)}
                                className="px-2 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                title={`Avanzar a ${nextSt}`}
                              >
                                <span>Avanzar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

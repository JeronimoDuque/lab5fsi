'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { IOrder, OrderStatus, CarrierType, IBook } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  Truck,
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
  Download,
  Plus,
  Minus,
  Layers,
} from 'lucide-react';

const columns: {
  id: OrderStatus;
  title: string;
  color: string;
  border: string;
  bg: string;
  badge: string;
  icon: any;
}[] = [
  {
    id: 'Pendiente',
    title: 'Pendiente de Alistamiento',
    color: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
    badge: 'bg-amber-100 text-amber-800',
    icon: Clock,
  },
  {
    id: 'En Preparación',
    title: 'En Preparación / Empaque',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-800',
    icon: Package,
  },
  {
    id: 'Despachado',
    title: 'Despachado / Con Guía',
    color: 'text-indigo-700',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/50',
    badge: 'bg-indigo-100 text-indigo-800',
    icon: Truck,
  },
  {
    id: 'Entregado',
    title: 'Entregado al Destino',
    color: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
  },
];

const CARRIERS: CarrierType[] = [
  'Servientrega',
  'FedEx',
  'DHL',
  'Coordinadora',
  'Interrapidísimo',
  'Envía',
];

export default function LogisticaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modal para despacho con guía
  const [dispatchModalOrder, setDispatchModalOrder] = useState<IOrder | null>(null);
  const [carrier, setCarrier] = useState<CarrierType>('Servientrega');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('2 a 4 días hábiles');

  const fetchOrdersAndBooks = async () => {
    try {
      setLoading(true);
      const [ordersRes, booksRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/books'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(booksData.books || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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
      if (user.role !== 'logistica' && user.role !== 'admin') {
        router.push('/catalogo');
        return;
      }
    }

    if (user && (user.role === 'logistica' || user.role === 'admin')) {
      fetchOrdersAndBooks();

      const socket = getSocket();
      if (socket) {
        socket.emit('join:logistics');
        setIsLive(true);

        const handleNewOrder = (newOrder: IOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          setActiveAlert(`¡Nuevo pedido recibido: ${newOrder.orderNumber}!`);
          setTimeout(() => setActiveAlert(null), 6000);
        };

        const handleStatusUpdated = (updatedOrder: IOrder) => {
          setOrders((prev) =>
            prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
          );
        };

        const handleStockUpdated = (data: { bookId: string; newStock: number }) => {
          setBooks((prev) =>
            prev.map((b) => (b._id === data.bookId ? { ...b, stock: data.newStock } : b))
          );
        };

        socket.on('order:new', handleNewOrder);
        socket.on('order:status_updated', handleStatusUpdated);
        socket.on('stock:updated', handleStockUpdated);

        return () => {
          socket.off('order:new', handleNewOrder);
          socket.off('order:status_updated', handleStatusUpdated);
          socket.off('stock:updated', handleStockUpdated);
        };
      }
    }
  }, [user, authLoading]);

  // Actualizar estado de orden
  const handleUpdateStatus = (
    order: IOrder,
    targetStatus: OrderStatus,
    customTracking?: string,
    customCarrier?: CarrierType
  ) => {
    // Si pasa a Despachado y tiene items físicos sin guía, abrir modal de despacho
    if (
      targetStatus === 'Despachado' &&
      order.hasPhysicalItems &&
      !order.shipment?.trackingNumber &&
      !customTracking
    ) {
      setDispatchModalOrder(order);
      setTrackingNumber(`GUIA-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`);
      return;
    }

    // Actualización optimista
    setOrders((prev) =>
      prev.map((o) => (o._id === order._id ? { ...o, status: targetStatus } : o))
    );

    const socket = getSocket();
    if (socket) {
      socket.emit('order:update_status', {
        orderId: order._id,
        status: targetStatus,
        trackingNumber: customTracking || order.shipment?.trackingNumber,
        carrier: customCarrier || order.shipment?.carrier || 'Servientrega',
        estimatedDelivery,
      });
    }

    // Confirmar vía API REST
    fetch(`/api/orders/${order._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: targetStatus,
        trackingNumber: customTracking,
        carrier: customCarrier,
        estimatedDelivery,
      }),
    }).catch((err) => console.error('Error updating order:', err));
  };

  const handleConfirmDispatch = () => {
    if (!dispatchModalOrder) return;
    handleUpdateStatus(dispatchModalOrder, 'Despachado', trackingNumber, carrier);
    setDispatchModalOrder(null);
  };

  // Ajuste rápido de stock en vivo
  const handleAdjustStock = (bookId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setBooks((prev) =>
      prev.map((b) => (b._id === bookId ? { ...b, stock: newStock } : b))
    );

    const socket = getSocket();
    if (socket) {
      socket.emit('stock:update', { bookId, newStock });
    }

    fetch(`/api/books/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    }).catch((err) => console.error('Error adjusting stock:', err));
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Alert Banner */}
      {activeAlert && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-sm">{activeAlert}</span>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2 border border-amber-200">
            <Truck className="w-3.5 h-3.5" />
            Centro de Despacho y Logística
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tablero Kanban de Envíos en Tiempo Real
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona la preparación de pedidos, asignación de guías de transportadoras y control de stock físico.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrdersAndBooks}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            {isLive ? 'Socket Activo' : 'Conectando'}
          </div>
        </div>
      </div>

      {/* Mini Widget: Control Rápido de Stock en Bodega */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Inventario en Tiempo Real (Libros Físicos en Almacén)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Ajustes sincronizados en vivo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {books
            .filter((b) => b.format === 'fisico' || b.format === 'ambos')
            .slice(0, 6)
            .map((b) => (
              <div key={b._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={b.title}>
                    {b.title}
                  </h4>
                  <span className={`text-[11px] font-bold mt-1 block ${b.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {b.stock} unidades
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleAdjustStock(b._id, b.stock, -1)}
                    className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleAdjustStock(b._id, b.stock, 1)}
                    className="w-6 h-6 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center text-xs font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className={`rounded-3xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[600px] shadow-xs`}
            >
              {/* Header de Columna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ColIcon className={`w-4 h-4 ${col.color}`} />
                  <h2 className={`font-bold text-sm ${col.color}`}>{col.title}</h2>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Lista de Tarjetas */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-medium italic">
                    Sin órdenes en esta etapa
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3"
                    >
                      {/* Cabecera Tarjeta */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {order.customerName}
                          </h4>
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="truncate pr-2 font-medium">
                              {it.quantity}x {it.title}
                            </span>
                            <span
                              className={`shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                it.format === 'fisico'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {it.format === 'fisico' ? 'Físico' : 'E-Book'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Dirección / Guía */}
                      {order.hasPhysicalItems && (
                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p className="flex items-center gap-1 truncate" title={order.shippingAddress?.address}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {order.shippingAddress?.address}, {order.shippingAddress?.city}
                          </p>
                          {order.shipment?.trackingNumber && (
                            <p className="font-semibold text-indigo-700 flex items-center gap-1">
                              <Truck className="w-3 h-3 shrink-0" />
                              {order.shipment.carrier}: {order.shipment.trackingNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Botones de Cambio de Estado */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        {col.id === 'Pendiente' && (
                          <button
                            onClick={() => handleUpdateStatus(order, 'En Preparación')}
                            className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Iniciar Empaque</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {col.id === 'En Preparación' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleUpdateStatus(order, 'Pendiente')}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                              title="Regresar a Pendiente"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order, 'Despachado')}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Despachar / Guía</span>
                            </button>
                          </div>
                        )}

                        {col.id === 'Despachado' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleUpdateStatus(order, 'En Preparación')}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                              title="Regresar a Preparación"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order, 'Entregado')}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Entregado</span>
                            </button>
                          </div>
                        )}

                        {col.id === 'Entregado' && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mx-auto py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Despacho Concluido
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Asignar Transportadora y Guía */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Despachar Orden {dispatchModalOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Asigna la empresa transportadora y el número de guía para que el cliente pueda rastrear su paquete en tiempo real.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Empresa Transportadora</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value as CarrierType)}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Guía de Rastreo</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Ej. GUIA-892182"
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha Estimada de Entrega</label>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  placeholder="Ej. 2 a 3 días hábiles"
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDispatch}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Truck className="w-3.5 h-3.5" />
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

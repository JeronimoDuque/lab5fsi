import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const { id } = await context.params;
    await connectDB();

    const order = await Order.findById(id).populate('shipment');
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    }

    // Regla de autorización: Clientes solo pueden ver sus propios pedidos
    if (user.role === 'cliente' && order.customer.toString() !== user.id) {
      return NextResponse.json(
        { error: 'No tienes autorización para consultar este pedido.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('[Order GET ID Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar el detalle del pedido.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'logistica' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de logística o administración.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, trackingNumber, carrier, estimatedDelivery, notes } = body;

    await connectDB();

    const order = await Order.findById(id).populate('shipment');
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    }

    if (status) {
      order.status = status;
    }

    // Si hay datos de envío a actualizar o crear
    if (trackingNumber || carrier || estimatedDelivery || notes) {
      let shipmentDoc: any = null;
      if (order.shipment) {
        shipmentDoc = await Shipment.findById(order.shipment);
        if (shipmentDoc) {
          if (trackingNumber) shipmentDoc.trackingNumber = trackingNumber;
          if (carrier) shipmentDoc.carrier = carrier;
          if (estimatedDelivery) shipmentDoc.estimatedDelivery = estimatedDelivery;
          if (notes) shipmentDoc.notes = notes;
          if (status === 'Despachado') {
            shipmentDoc.status = 'En Tránsito';
            if (!shipmentDoc.shippedAt) shipmentDoc.shippedAt = new Date();
          } else if (status === 'Entregado') {
            shipmentDoc.status = 'Entregado';
            if (!shipmentDoc.deliveredAt) shipmentDoc.deliveredAt = new Date();
          } else if (status === 'En Preparación') {
            shipmentDoc.status = 'En Preparación';
          }
          await shipmentDoc.save();
        }
      } else if (trackingNumber) {
        shipmentDoc = await Shipment.create({
          order: order._id,
          trackingNumber,
          carrier: carrier || 'Servientrega',
          destinationAddress: order.shippingAddress.address,
          city: order.shippingAddress.city,
          department: order.shippingAddress.department,
          recipientName: order.customerName,
          recipientPhone: order.shippingAddress.phone,
          status: status === 'Entregado' ? 'Entregado' : 'En Tránsito',
          estimatedDelivery: estimatedDelivery || '2 a 4 días hábiles',
          shippedAt: new Date(),
        });
        order.shipment = shipmentDoc._id;
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(id).populate('shipment');

    // Emitir eventos por WebSocket
    try {
      const io = (globalThis as any).io;
      if (io) {
        io.to('logistics').emit('order:status_updated', updatedOrder);
        io.to(`order:${order._id}`).emit('order:status_updated', updatedOrder);
        io.emit('order:status_updated', updatedOrder);
      }
    } catch (wsErr) {
      console.warn('[WebSocket Emit Warning]:', wsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('[Order PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el pedido.' },
      { status: 500 }
    );
  }
}

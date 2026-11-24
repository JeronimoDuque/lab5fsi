import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Shipment from '@/models/Shipment';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/jwt';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'logistica' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'No autorizado. Permisos insuficientes.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { trackingNumber, carrier, status, estimatedDelivery, notes } = body;

    await connectDB();

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return NextResponse.json({ error: 'Envío no encontrado.' }, { status: 404 });
    }

    if (trackingNumber) shipment.trackingNumber = trackingNumber;
    if (carrier) shipment.carrier = carrier;
    if (status) shipment.status = status;
    if (estimatedDelivery) shipment.estimatedDelivery = estimatedDelivery;
    if (notes) shipment.notes = notes;

    if (status === 'Despachado' || status === 'En Tránsito') {
      if (!shipment.shippedAt) shipment.shippedAt = new Date();
      await Order.findByIdAndUpdate(shipment.order, { status: 'Despachado' });
    } else if (status === 'Entregado') {
      if (!shipment.deliveredAt) shipment.deliveredAt = new Date();
      await Order.findByIdAndUpdate(shipment.order, { status: 'Entregado' });
    }

    await shipment.save();

    const updatedShipment = await Shipment.findById(id).populate('order');

    try {
      const io = (globalThis as any).io;
      if (io) {
        io.to('logistics').emit('shipment:updated', updatedShipment);
        io.emit('shipment:updated', updatedShipment);
      }
    } catch (wsErr) {
      console.warn('[WebSocket Shipment Warning]:', wsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Envío actualizado correctamente',
      shipment: updatedShipment,
    });
  } catch (error: any) {
    console.error('[Shipment PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el envío.' },
      { status: 500 }
    );
  }
}

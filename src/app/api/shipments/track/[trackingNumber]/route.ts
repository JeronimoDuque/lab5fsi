import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Shipment from '@/models/Shipment';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await context.params;
    await connectDB();

    const shipment = await Shipment.findOne({ trackingNumber }).populate('order', 'orderNumber status createdAt');
    if (!shipment) {
      return NextResponse.json(
        { error: 'No se encontró ningún paquete asociado a este número de guía.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shipment: {
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        city: shipment.city,
        estimatedDelivery: shipment.estimatedDelivery,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        notes: shipment.notes,
        orderNumber: (shipment.order as any)?.orderNumber,
      },
    });
  } catch (error: any) {
    console.error('[Shipment Track Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar la guía de rastreo.' },
      { status: 500 }
    );
  }
}

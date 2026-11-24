import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Shipment from '@/models/Shipment';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'logistica' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de logística o administración.' },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const carrier = searchParams.get('carrier');

    const filter: any = {};
    if (status) filter.status = status;
    if (carrier) filter.carrier = carrier;

    const shipments = await Shipment.find(filter)
      .populate('order')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error: any) {
    console.error('[Shipments GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar los envíos.' },
      { status: 500 }
    );
  }
}

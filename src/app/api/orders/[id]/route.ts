import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Si es cliente, verificar que el pedido sea suyo
    if (user.role === 'cliente' && order.customer.toString() !== user.id) {
      return NextResponse.json({ error: 'Acceso no permitido a este pedido' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('[Order Detail GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener el pedido.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'cocinero') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo el cocinero puede cambiar el estado de los pedidos.' },
        { status: 403 }
      );
    }

    const { status } = await req.json();
    const validStatuses = ['Pendiente', 'En preparación', 'Listo', 'Entregado'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Estado no válido. Debe ser uno de: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Emitir WebSocket a todos los clientes (cocina y clientes en tiempo real)
    try {
      const io = (globalThis as any).io;
      if (io) {
        io.emit('order:status_updated', updatedOrder);
        io.to(`order:${id}`).emit('order:status_updated', updatedOrder);
        console.log(`[WebSocket] Emitido order:status_updated para ${updatedOrder.orderNumber} -> ${status}`);
      }
    } catch (wsErr) {
      console.warn('[WebSocket Emit Warning]:', wsErr);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('[Order PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el estado del pedido.' },
      { status: 500 }
    );
  }
}

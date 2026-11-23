import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    await connectDB();

    let query: any = {};
    if (user.role === 'cliente') {
      // Un cliente solo ve sus propios pedidos
      query = { customer: user.id };
    }
    // El cocinero ve todos los pedidos

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('[Orders GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar los pedidos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para realizar un pedido.' }, { status: 401 });
    }

    const body = await req.json();
    const { items, deliveryAddress, deliveryPhone, notes, paymentMethod = 'paypal_simulated', paypalOrderId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe contener al menos un plato.' }, { status: 400 });
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return NextResponse.json({ error: 'La dirección de entrega es obligatoria.' }, { status: 400 });
    }

    await connectDB();

    // Calcular totales
    let totalAmount = 0;
    const formattedItems = items.map((item: any) => {
      const price = Number(item.price);
      const qty = Number(item.quantity) || 1;
      const subtotal = price * qty;
      totalAmount += subtotal;
      return {
        dish: item.dish?._id || item.dish || undefined,
        name: item.name,
        price,
        quantity: qty,
        subtotal,
      };
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newOrder = await Order.create({
      orderNumber,
      customer: user.id,
      customerName: user.name,
      customerEmail: user.email,
      items: formattedItems,
      totalAmount,
      deliveryAddress,
      deliveryPhone: deliveryPhone || '',
      notes: notes || '',
      paymentStatus: 'completed',
      paymentMethod,
      paypalOrderId: paypalOrderId || `PAYPAL-DEMO-${Date.now()}`,
      status: 'Pendiente',
    });

    // Emitir evento por WebSocket si está disponible en globalThis
    try {
      const io = (globalThis as any).io;
      if (io) {
        io.emit('order:new', newOrder);
        io.to('kitchen').emit('order:new', newOrder);
        console.log(`[WebSocket] Emitido evento order:new para orden ${orderNumber}`);
      }
    } catch (wsErr) {
      console.warn('[WebSocket Emit Warning]:', wsErr);
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error('[Orders POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pedido.' },
      { status: 500 }
    );
  }
}

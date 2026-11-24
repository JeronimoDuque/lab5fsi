import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import Book from '@/models/Book';
import Shipment from '@/models/Shipment';
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
    // 'logistica' y 'admin' ven todas las órdenes

    const orders = await Order.find(query)
      .populate('shipment')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: orders.length, orders });
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
    const { items, shippingAddress, paymentMethod = 'paypal_simulated', paypalOrderId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe contener al menos un libro.' }, { status: 400 });
    }

    await connectDB();

    let hasPhysicalItems = false;
    let hasEbookItems = false;
    let subtotal = 0;

    const validatedItems: any[] = [];

    // Validar cada libro y verificar stock para físicos
    for (const item of items) {
      const bookId = item.book?._id || item.book || item._id;
      const bookDoc = await Book.findById(bookId);

      if (!bookDoc) {
        return NextResponse.json(
          { error: `El libro con ID ${bookId} ya no está disponible en catálogo.` },
          { status: 404 }
        );
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const format = item.format || item.selectedFormat || (bookDoc.format === 'ebook' ? 'ebook' : 'fisico');
      const itemPrice = bookDoc.price;
      const itemSubtotal = itemPrice * qty;

      if (format === 'fisico') {
        hasPhysicalItems = true;
        if (bookDoc.stock < qty) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para "${bookDoc.title}". Disponibles: ${bookDoc.stock}, solicitados: ${qty}.`,
            },
            { status: 400 }
          );
        }
      } else {
        hasEbookItems = true;
      }

      subtotal += itemSubtotal;
      validatedItems.push({
        book: bookDoc._id,
        title: bookDoc.title,
        price: itemPrice,
        quantity: qty,
        format,
        subtotal: itemSubtotal,
        downloadUrl: bookDoc.downloadUrl || '',
      });
    }

    // Costo de envío: $12.000 COP si hay libros físicos, $0 si solo son e-books
    const shippingCost = hasPhysicalItems ? 12000 : 0;
    const totalAmount = subtotal + shippingCost;

    if (hasPhysicalItems) {
      if (!shippingAddress || !shippingAddress.address?.trim() || !shippingAddress.city?.trim()) {
        return NextResponse.json(
          { error: 'Para el envío de libros físicos es obligatoria la dirección y la ciudad.' },
          { status: 400 }
        );
      }
    }

    // Reducir stock de libros físicos
    for (const item of validatedItems) {
      if (item.format === 'fisico') {
        const updatedBook = await Book.findByIdAndUpdate(
          item.book,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        try {
          const io = (globalThis as any).io;
          if (io && updatedBook) {
            io.emit('stock:updated', { bookId: updatedBook._id, newStock: updatedBook.stock });
          }
        } catch (wsErr) {
          console.warn('[WebSocket Stock Warning]:', wsErr);
        }
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BKH-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newOrder = await Order.create({
      orderNumber,
      customer: user.id,
      customerName: user.name,
      customerEmail: user.email,
      items: validatedItems,
      subtotal,
      shippingCost,
      totalAmount,
      shippingAddress: {
        address: shippingAddress?.address || '',
        city: shippingAddress?.city || '',
        department: shippingAddress?.department || '',
        phone: shippingAddress?.phone || user.phone || '',
        notes: shippingAddress?.notes || '',
      },
      paymentStatus: 'completed',
      paymentMethod,
      paypalOrderId: paypalOrderId || `PAYPAL-SIM-${Date.now()}`,
      status: 'Pendiente',
      hasPhysicalItems,
      hasEbookItems,
    });

    // Si tiene productos físicos, crear registro de envío asociado
    if (hasPhysicalItems) {
      const trackingNumber = `GUIA-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const shipment = await Shipment.create({
        order: newOrder._id,
        trackingNumber,
        carrier: 'Servientrega',
        destinationAddress: newOrder.shippingAddress.address,
        city: newOrder.shippingAddress.city,
        department: newOrder.shippingAddress.department,
        recipientName: newOrder.customerName,
        recipientPhone: newOrder.shippingAddress.phone,
        status: 'Pendiente',
        estimatedDelivery: '3 a 5 días hábiles',
      });

      newOrder.shipment = shipment._id;
      await newOrder.save();
    }

    const populatedOrder = await Order.findById(newOrder._id).populate('shipment');

    // Emitir WebSocket a sala de logística y a todos
    try {
      const io = (globalThis as any).io;
      if (io) {
        io.to('logistics').emit('order:new', populatedOrder);
        io.emit('order:new', populatedOrder);
        console.log(`[WebSocket] Emitido evento order:new para orden de libros ${orderNumber}`);
      }
    } catch (wsErr) {
      console.warn('[WebSocket Emit Warning]:', wsErr);
    }

    return NextResponse.json({ success: true, order: populatedOrder }, { status: 201 });
  } catch (error: any) {
    console.error('[Orders POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pedido de libros.' },
      { status: 500 }
    );
  }
}

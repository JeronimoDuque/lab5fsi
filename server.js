const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existen
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Mongoose Schemas para operaciones en sockets
const OrderSchema = new mongoose.Schema(
  {
    orderNumber: String,
    status: String,
    customerName: String,
    totalAmount: Number,
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  },
  { strict: false, timestamps: true }
);

const ShipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    trackingNumber: String,
    carrier: String,
    status: String,
    destinationAddress: String,
    city: String,
    recipientName: String,
    estimatedDelivery: String,
    shippedAt: Date,
    deliveredAt: Date,
  },
  { strict: false, timestamps: true }
);

const BookSchema = new mongoose.Schema(
  {
    title: String,
    stock: Number,
    price: Number,
  },
  { strict: false, timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('[Server Request Error]:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Inicializar servidor de Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT'],
    },
    transports: ['websocket', 'polling'],
  });

  // Asignar al global para que las rutas API de Next.js puedan emitir eventos
  globalThis.io = io;

  io.on('connection', (socket) => {
    console.log(`🔌 [WebSocket] Cliente conectado: ${socket.id}`);

    // Sala de logística y almacén
    socket.on('join:logistics', () => {
      socket.join('logistics');
      console.log(`📦 [WebSocket] Socket ${socket.id} se unió a la sala 'logistics'`);
    });

    // Sala para seguimiento en vivo de una orden específica (para el cliente)
    socket.on('join:order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📖 [WebSocket] Socket ${socket.id} siguiendo orden: order:${orderId}`);
      }
    });

    // Sala para catálogo y alertas de stock
    socket.on('join:catalog', () => {
      socket.join('catalog');
      console.log(`📚 [WebSocket] Socket ${socket.id} siguiendo catálogo y stock`);
    });

    // Actualización de estado de pedido y logística (desde Tablero Kanban)
    socket.on('order:update_status', async (data) => {
      try {
        const { orderId, status, trackingNumber, carrier, estimatedDelivery, notes } = data;
        console.log(`🔄 [WebSocket] Actualización logística: ${orderId} -> ${status}`);

        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea';
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(MONGODB_URI);
        }

        let updatedOrder = await Order.findById(orderId).populate('shipment');
        if (!updatedOrder) {
          socket.emit('order:error', { message: 'Orden no encontrada' });
          return;
        }

        updatedOrder.status = status;

        // Si se suministra información de envío (guía / transportadora)
        let shipmentDoc = null;
        if (trackingNumber || carrier) {
          if (updatedOrder.shipment) {
            shipmentDoc = await Shipment.findById(updatedOrder.shipment);
            if (shipmentDoc) {
              if (trackingNumber) shipmentDoc.trackingNumber = trackingNumber;
              if (carrier) shipmentDoc.carrier = carrier;
              if (estimatedDelivery) shipmentDoc.estimatedDelivery = estimatedDelivery;
              if (notes) shipmentDoc.notes = notes;
              shipmentDoc.status = status === 'Entregado' ? 'Entregado' : status === 'Despachado' ? 'En Tránsito' : 'En Preparación';
              if (status === 'Despachado' && !shipmentDoc.shippedAt) shipmentDoc.shippedAt = new Date();
              if (status === 'Entregado' && !shipmentDoc.deliveredAt) shipmentDoc.deliveredAt = new Date();
              await shipmentDoc.save();
            }
          } else if (trackingNumber) {
            shipmentDoc = await Shipment.create({
              order: updatedOrder._id,
              trackingNumber,
              carrier: carrier || 'Servientrega',
              destinationAddress: updatedOrder.shippingAddress?.address || 'Dirección de cliente',
              city: updatedOrder.shippingAddress?.city || 'Ciudad principal',
              recipientName: updatedOrder.customerName || 'Cliente',
              status: status === 'Entregado' ? 'Entregado' : 'En Tránsito',
              estimatedDelivery: estimatedDelivery || '2 a 4 días hábiles',
              shippedAt: new Date(),
            });
            updatedOrder.shipment = shipmentDoc._id;
          }
        }

        await updatedOrder.save();

        const populatedOrder = await Order.findById(orderId).populate('shipment');

        // Emitir a sala de logística y a la sala individual de la orden
        io.to('logistics').emit('order:status_updated', populatedOrder);
        io.to(`order:${orderId}`).emit('order:status_updated', populatedOrder);
        io.emit('order:status_updated', populatedOrder);

        console.log(`📢 [WebSocket] Estado de orden ${populatedOrder.orderNumber} emitido: ${status}`);
      } catch (err) {
        console.error('[WebSocket Error al actualizar orden]:', err.message);
        socket.emit('order:error', { message: 'No se pudo actualizar el estado de la orden' });
      }
    });

    // Actualización de stock en tiempo real
    socket.on('stock:update', async (data) => {
      try {
        const { bookId, newStock } = data;
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea';
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(MONGODB_URI);
        }

        const updatedBook = await Book.findByIdAndUpdate(
          bookId,
          { stock: newStock },
          { new: true }
        );

        if (updatedBook) {
          io.emit('stock:updated', { bookId, newStock: updatedBook.stock });
          console.log(`📦 [WebSocket] Stock de '${updatedBook.title}' actualizado a ${newStock}`);
        }
      } catch (err) {
        console.error('[WebSocket Error al actualizar stock]:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [WebSocket] Cliente desconectado: ${socket.id}`);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`
======================================================
📚 BookHub E-Commerce Server corriendo exitosamente!
👉 URL: http://${hostname}:${port}
📡 WebSockets: Activos en ws://${hostname}:${port}
🍃 MongoDB: ${process.env.MONGODB_URI ? 'Configurado' : 'No configurado'}
📦 Roles: cliente | logistica | admin
======================================================
    `);
  });
}).catch((err) => {
  console.error('Error al iniciar el servidor BookHub Next.js:', err);
  process.exit(1);
});

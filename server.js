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

// Schema simplificado para operaciones directas en socket si es necesario
const OrderSchema = new mongoose.Schema({
  status: String,
}, { strict: false, timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

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

    // Unirse a la sala de cocina (para cocineros)
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
      console.log(`👨‍🍳 [WebSocket] Socket ${socket.id} se unió a la sala 'kitchen'`);
    });

    // Unirse a la sala de una orden específica (para seguimiento de cliente en tiempo real)
    socket.on('join:order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`📦 [WebSocket] Socket ${socket.id} siguiendo orden: order:${orderId}`);
      }
    });

    // Evento de arrastrar/cambiar estado en tiempo real desde el tablero Kanban
    socket.on('order:update_status', async (data) => {
      try {
        const { orderId, status } = data;
        console.log(`🔄 [WebSocket] Solicitud de cambio de estado: ${orderId} -> ${status}`);
        
        // Conectar a MongoDB si no está conectado
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea';
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(MONGODB_URI);
        }

        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { status },
          { new: true }
        );

        if (updatedOrder) {
          // Emitir a todos los clientes (cocineros y clientes)
          io.emit('order:status_updated', updatedOrder);
          io.to(`order:${orderId}`).emit('order:status_updated', updatedOrder);
          console.log(`📢 [WebSocket] Estado emitido a todos: ${updatedOrder.orderNumber} es ahora ${status}`);
        }
      } catch (err) {
        console.error('[WebSocket Error al actualizar estado]:', err.message);
        socket.emit('order:error', { message: 'No se pudo actualizar el estado de la orden' });
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
🚀 FastFoodUdeA Server corriendo exitosamente!
👉 URL: http://${hostname}:${port}
📡 WebSockets: Activos en ws://${hostname}:${port}
🍃 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea'}
======================================================
    `);
  });
}).catch((err) => {
  console.error('Error al iniciar el servidor Next.js:', err);
  process.exit(1);
});

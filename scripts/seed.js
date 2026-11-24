// Standalone Seed Script para BookHub
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existen
const envPath = path.resolve(__dirname, '..', '.env.local');
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastfoodudea';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['cliente', 'logistica', 'admin'], default: 'cliente' },
    address: String,
    city: String,
    phone: String,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    format: { type: String, enum: ['fisico', 'ebook', 'ambos'], default: 'ambos' },
    stock: { type: Number, default: 0 },
    coverImage: String,
    downloadUrl: String,
    pages: Number,
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: String,
    customerEmail: String,
    items: Array,
    subtotal: Number,
    shippingCost: Number,
    totalAmount: Number,
    shippingAddress: Object,
    paymentStatus: String,
    paymentMethod: String,
    paypalOrderId: String,
    status: {
      type: String,
      enum: ['Pendiente', 'En Preparación', 'Despachado', 'Entregado', 'Cancelado'],
      default: 'Pendiente',
    },
    hasPhysicalItems: Boolean,
    hasEbookItems: Boolean,
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  },
  { timestamps: true }
);

const ShipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    trackingNumber: { type: String, required: true, unique: true },
    carrier: { type: String, default: 'Servientrega' },
    destinationAddress: String,
    city: String,
    department: String,
    recipientName: String,
    recipientPhone: String,
    status: { type: String, default: 'Pendiente' },
    estimatedDelivery: String,
    shippedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);

const books = [
  {
    title: 'Cien Años de Soledad',
    author: 'Gabriel García Márquez',
    isbn: '978-0307474728',
    description: 'La obra cumbre del realismo mágico sobre la familia Buendía en Macondo.',
    price: 55000,
    category: 'Ficción',
    format: 'ambos',
    stock: 25,
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 471,
    isAvailable: true,
  },
  {
    title: 'Clean Code: Manual de Desarrollo Ágil',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    description: 'Guía práctica para escribir código legible, testeable y mantenible.',
    price: 85000,
    category: 'Tecnología',
    format: 'ambos',
    stock: 14,
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 464,
    isAvailable: true,
  },
  {
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    isbn: '978-1524718840',
    description: 'Estrategias probadas para construir hábitos que transformen tu vida.',
    price: 48000,
    category: 'Autoayuda',
    format: 'ambos',
    stock: 30,
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 320,
    isAvailable: true,
  },
  {
    title: 'Diseñando Sistemas Distribuidos',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    description: 'Conceptos fundamentales de alta disponibilidad, consistencia y particiones.',
    price: 92000,
    category: 'Tecnología',
    format: 'ebook',
    stock: 0,
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 616,
    isAvailable: true,
  },
];

async function seed() {
  try {
    console.log('🌱 Conectando a MongoDB para poblar BookHub...');
    await mongoose.connect(MONGODB_URI);

    console.log('🧹 Limpiando colecciones...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});

    console.log('👤 Creando usuarios con roles...');
    const cliente = await User.create({
      name: 'Cliente Lector',
      email: 'cliente@bookhub.com',
      password: 'cliente123',
      role: 'cliente',
      address: 'Calle 10 # 43A-25',
      city: 'Medellín',
      phone: '3001234567',
    });

    const logistica = await User.create({
      name: 'Operador Logística',
      email: 'logistica@bookhub.com',
      password: 'logistica123',
      role: 'logistica',
      address: 'Bodega Central 4',
      city: 'Medellín',
      phone: '3109876543',
    });

    const admin = await User.create({
      name: 'Super Admin BookHub',
      email: 'admin@bookhub.com',
      password: 'admin123',
      role: 'admin',
      address: 'Sede Principal',
      city: 'Bogotá',
      phone: '3150001122',
    });

    console.log('📚 Insertando libros en catálogo...');
    const createdBooks = await Book.insertMany(books);

    console.log('🚚 Creando órdenes y envíos de prueba...');
    const order = await Order.create({
      orderNumber: 'BKH-1001',
      customer: cliente._id,
      customerName: cliente.name,
      customerEmail: cliente.email,
      items: [
        {
          book: createdBooks[0]._id,
          title: createdBooks[0].title,
          price: createdBooks[0].price,
          quantity: 1,
          format: 'fisico',
          subtotal: createdBooks[0].price,
        },
      ],
      subtotal: createdBooks[0].price,
      shippingCost: 12000,
      totalAmount: createdBooks[0].price + 12000,
      shippingAddress: {
        address: cliente.address,
        city: cliente.city,
        phone: cliente.phone,
      },
      paymentStatus: 'completed',
      paymentMethod: 'paypal_simulated',
      status: 'Pendiente',
      hasPhysicalItems: true,
      hasEbookItems: false,
    });

    const shipment = await Shipment.create({
      order: order._id,
      trackingNumber: 'GUIA-880011',
      carrier: 'Servientrega',
      destinationAddress: cliente.address,
      city: cliente.city,
      recipientName: cliente.name,
      status: 'Pendiente',
      estimatedDelivery: '2 a 3 días hábiles',
    });

    order.shipment = shipment._id;
    await order.save();

    console.log(`
✅ Base de datos poblada exitosamente!
------------------------------------------------------
👤 Cliente:    cliente@bookhub.com   / cliente123
🚚 Logística:  logistica@bookhub.com / logistica123
👑 Admin:      admin@bookhub.com     / admin123
📚 Libros creados: ${createdBooks.length}
------------------------------------------------------
    `);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error poblando base de datos:', err);
    process.exit(1);
  }
}

seed();

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Book from '@/models/Book';
import Order from '@/models/Order';
import Shipment from '@/models/Shipment';

const initialBooks = [
  {
    title: 'Cien Años de Soledad',
    author: 'Gabriel García Márquez',
    isbn: '978-0307474728',
    description: 'La obra cumbre del realismo mágico que narra la historia épica de la familia Buendía en el mítico pueblo de Macondo.',
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
    author: 'Robert C. Martin (Uncle Bob)',
    isbn: '978-0132350884',
    description: 'Una guía fundamental y práctica para escribir código legible, mantenible, modular y libre de deuda técnica.',
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
    description: 'El método comprobado paso a paso para construir hábitos positivos duraderos y eliminar las conductas destructivas.',
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
    title: 'Diseñando Sistemas Distribuidos y Escalables',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    description: 'La referencia indispensable sobre almacenamiento de datos, replicación, particionamiento y transacciones en sistemas cloud.',
    price: 92000,
    category: 'Tecnología',
    format: 'ebook',
    stock: 0,
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 616,
    isAvailable: true,
  },
  {
    title: 'Sapiens: De Animales a Dioses',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    description: 'Un recorrido fascinante por la historia biológica y cultural de la humanidad, desde los primeros homínidos hasta la era digital.',
    price: 65000,
    category: 'No Ficción',
    format: 'ambos',
    stock: 18,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 496,
    isAvailable: true,
  },
  {
    title: 'Principios: Vida y Trabajo',
    author: 'Ray Dalio',
    isbn: '978-1501124020',
    description: 'Filosofía práctica de toma de decisiones basada en la verdad radical y la meritocracia de ideas de uno de los inversores más influyentes.',
    price: 72000,
    category: 'Negocios',
    format: 'fisico',
    stock: 9,
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 592,
    isAvailable: true,
  },
  {
    title: 'El Universo en una Cáscara de Nuez',
    author: 'Stephen Hawking',
    isbn: '978-0553802023',
    description: 'Exploración visual y conceptual de la teoría de cuerdas, la relatividad general, los agujeros negros y el origen del cosmos.',
    price: 52000,
    category: 'Ciencia',
    format: 'ambos',
    stock: 12,
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 224,
    isAvailable: true,
  },
  {
    title: 'Inteligencia Artificial Moderna con Python',
    author: 'Stuart Russell & Peter Norvig',
    isbn: '978-0134610993',
    description: 'El texto estándar universitario en aprendizaje profundo, redes neuronales y agentes inteligentes autónomos.',
    price: 88000,
    category: 'Tecnología',
    format: 'ebook',
    stock: 0,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    pages: 1152,
    isAvailable: true,
  },
];

export async function POST() {
  try {
    await connectDB();

    // 1. Limpiar colecciones
    await User.deleteMany({});
    await Book.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});

    // 2. Crear usuarios con roles
    const cliente = await User.create({
      name: 'Cliente Lector',
      email: 'cliente@bookhub.com',
      password: 'cliente123',
      role: 'cliente',
      address: 'Calle 10 # 43A-25, Apto 502',
      city: 'Medellín',
      phone: '3001234567',
    });

    const logistica = await User.create({
      name: 'Operador Almacén y Envíos',
      email: 'logistica@bookhub.com',
      password: 'logistica123',
      role: 'logistica',
      address: 'Centro Logístico Bodega 4',
      city: 'Medellín',
      phone: '3109876543',
    });

    const admin = await User.create({
      name: 'Super Administrador',
      email: 'admin@bookhub.com',
      password: 'admin123',
      role: 'admin',
      address: 'Sede Principal BookHub',
      city: 'Bogotá',
      phone: '3150001122',
    });

    // 3. Crear libros
    const createdBooks = await Book.insertMany(initialBooks);

    // 4. Crear pedidos iniciales de demostración en varias etapas del Kanban
    const book1 = createdBooks[0];
    const book2 = createdBooks[1];
    const book3 = createdBooks[2];

    // Orden 1: Pendiente de Alistamiento
    const order1 = await Order.create({
      orderNumber: 'BKH-8910',
      customer: cliente._id,
      customerName: cliente.name,
      customerEmail: cliente.email,
      items: [
        {
          book: book1._id,
          title: book1.title,
          price: book1.price,
          quantity: 1,
          format: 'fisico',
          subtotal: book1.price,
        },
      ],
      subtotal: book1.price,
      shippingCost: 12000,
      totalAmount: book1.price + 12000,
      shippingAddress: {
        address: cliente.address,
        city: cliente.city,
        department: 'Antioquia',
        phone: cliente.phone,
        notes: 'Dejar en recepción si no contesto.',
      },
      paymentStatus: 'completed',
      paymentMethod: 'paypal_simulated',
      paypalOrderId: 'PAYPAL-SIM-101',
      status: 'Pendiente',
      hasPhysicalItems: true,
      hasEbookItems: false,
    });

    const shipment1 = await Shipment.create({
      order: order1._id,
      trackingNumber: 'GUIA-889101',
      carrier: 'Servientrega',
      destinationAddress: cliente.address,
      city: cliente.city,
      department: 'Antioquia',
      recipientName: cliente.name,
      recipientPhone: cliente.phone,
      status: 'Pendiente',
      estimatedDelivery: '3 a 4 días hábiles',
    });
    order1.shipment = shipment1._id;
    await order1.save();

    // Orden 2: En Preparación / Empaque
    const order2 = await Order.create({
      orderNumber: 'BKH-9214',
      customer: cliente._id,
      customerName: cliente.name,
      customerEmail: cliente.email,
      items: [
        {
          book: book2._id,
          title: book2.title,
          price: book2.price,
          quantity: 1,
          format: 'fisico',
          subtotal: book2.price,
        },
      ],
      subtotal: book2.price,
      shippingCost: 12000,
      totalAmount: book2.price + 12000,
      shippingAddress: {
        address: 'Cra 43A # 1-50, Poblado',
        city: 'Medellín',
        department: 'Antioquia',
        phone: '3012223344',
      },
      paymentStatus: 'completed',
      paymentMethod: 'paypal',
      paypalOrderId: 'PAYPAL-SBX-202',
      status: 'En Preparación',
      hasPhysicalItems: true,
      hasEbookItems: false,
    });

    const shipment2 = await Shipment.create({
      order: order2._id,
      trackingNumber: 'GUIA-992144',
      carrier: 'FedEx',
      destinationAddress: 'Cra 43A # 1-50, Poblado',
      city: 'Medellín',
      department: 'Antioquia',
      recipientName: cliente.name,
      recipientPhone: '3012223344',
      status: 'En Preparación',
      estimatedDelivery: '2 a 3 días hábiles',
    });
    order2.shipment = shipment2._id;
    await order2.save();

    // Orden 3: Despachado con Guía y Transportadora
    const order3 = await Order.create({
      orderNumber: 'BKH-7402',
      customer: cliente._id,
      customerName: cliente.name,
      customerEmail: cliente.email,
      items: [
        {
          book: book3._id,
          title: book3.title,
          price: book3.price,
          quantity: 2,
          format: 'fisico',
          subtotal: book3.price * 2,
        },
      ],
      subtotal: book3.price * 2,
      shippingCost: 12000,
      totalAmount: book3.price * 2 + 12000,
      shippingAddress: {
        address: 'Calle 72 # 10-34, Chapinero',
        city: 'Bogotá',
        department: 'Cundinamarca',
        phone: '3157778899',
      },
      paymentStatus: 'completed',
      paymentMethod: 'paypal_simulated',
      paypalOrderId: 'PAYPAL-SIM-303',
      status: 'Despachado',
      hasPhysicalItems: true,
      hasEbookItems: false,
    });

    const shipment3 = await Shipment.create({
      order: order3._id,
      trackingNumber: 'GUIA-774022',
      carrier: 'Coordinadora',
      destinationAddress: 'Calle 72 # 10-34, Chapinero',
      city: 'Bogotá',
      department: 'Cundinamarca',
      recipientName: cliente.name,
      recipientPhone: '3157778899',
      status: 'En Tránsito',
      estimatedDelivery: '1 a 2 días hábiles',
      shippedAt: new Date(),
    });
    order3.shipment = shipment3._id;
    await order3.save();

    // Orden 4: E-Book Digital (Entregado con descarga activa)
    const ebookBook = createdBooks[3];
    const order4 = await Order.create({
      orderNumber: 'BKH-3310',
      customer: cliente._id,
      customerName: cliente.name,
      customerEmail: cliente.email,
      items: [
        {
          book: ebookBook._id,
          title: ebookBook.title,
          price: ebookBook.price,
          quantity: 1,
          format: 'ebook',
          subtotal: ebookBook.price,
          downloadUrl: ebookBook.downloadUrl,
        },
      ],
      subtotal: ebookBook.price,
      shippingCost: 0,
      totalAmount: ebookBook.price,
      shippingAddress: {
        address: 'Entrega Digital Inmediata',
        city: 'Online',
      },
      paymentStatus: 'completed',
      paymentMethod: 'paypal_simulated',
      paypalOrderId: 'PAYPAL-SIM-404',
      status: 'Entregado',
      hasPhysicalItems: false,
      hasEbookItems: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Base de datos de BookHub poblada exitosamente',
      data: {
        booksCount: createdBooks.length,
        users: [cliente.email, logistica.email, admin.email],
        ordersCount: 4,
      },
    });
  } catch (error: any) {
    console.error('[Seed API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al poblar la base de datos' },
      { status: 500 }
    );
  }
}

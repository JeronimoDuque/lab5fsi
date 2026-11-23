import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Dish from '@/models/Dish';
import Order from '@/models/Order';

const initialDishes = [
  {
    name: 'Hamburguesa Especial UdeA',
    description: 'Doble carne de res 100% artesanal (240g), queso mozzarella fundido, tocineta crocante, lechuga fresca, tomate y salsa secreta de la casa en pan brioche.',
    price: 18500,
    category: 'Hamburguesas',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Hamburguesa Crispy Chicken',
    description: 'Pechuga de pollo apanada ultra crujiente, queso cheddar derretido, pepinillos dulces y mayonesa de ajo ahumado en pan artesanal.',
    price: 16000,
    category: 'Hamburguesas',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Pizza Personal Carnes Express',
    description: 'Masa fina y crocante con salsa napolitana casera, pepperoni premium, tocineta, jamón ahumado y abundante queso mozzarella fundido.',
    price: 15000,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Pizza Hawaiana Gourmet',
    description: 'Clásica combinación de jamón ahumado de cerdo, piña dulce caramelizada al horno y doble capa de queso mozzarella.',
    price: 14000,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Salchipapa Costeña Monumental',
    description: 'Montaña de papas a la francesa, salchicha manguera dorada, queso costeño rallado, tocineta picada, ripio de papa y salsas tártara y piña.',
    price: 19000,
    category: 'Salchipapas',
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Salchipapa Clásica UdeA',
    description: 'Papas fritas corte francés bien doradas con abundante salchicha especial, queso mozzarella derretido y salsa rosada.',
    price: 12000,
    category: 'Salchipapas',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Jugo Natural de Maracuyá en Leche',
    description: 'Bebida helada de 16oz elaborada con pulpa de maracuyá 100% natural batida en leche entera bien cremosa.',
    price: 6000,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Gaseosa Postobón Manzana 400ml',
    description: 'La bebida tradicional colombiana con todo el sabor refrescante a manzana, servida bien fría.',
    price: 4500,
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop',
    available: true,
  },
  {
    name: 'Brownie Caliente con Helado',
    description: 'Porción de brownie artesanal de chocolate amargo recién horneado con bola de helado de vainilla y salsa de arequipe.',
    price: 8000,
    category: 'Postres',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop',
    available: true,
  },
];

export async function POST() {
  try {
    await connectDB();

    // 1. Crear o actualizar usuarios de prueba
    let cocinero = await User.findOne({ email: 'cocinero@fastfoodudea.com' });
    if (!cocinero) {
      cocinero = await User.create({
        name: 'Chef Mario UdeA',
        email: 'cocinero@fastfoodudea.com',
        password: 'cocinero123',
        role: 'cocinero',
        phone: '3001234567',
        address: 'Cocina Central Bloque 9 UdeA',
      });
    }

    let cliente = await User.findOne({ email: 'cliente@fastfoodudea.com' });
    if (!cliente) {
      cliente = await User.create({
        name: 'Estudiante Juan UdeA',
        email: 'cliente@fastfoodudea.com',
        password: 'cliente123',
        role: 'cliente',
        phone: '3109876543',
        address: 'Bloque 19, Aula 204, Ciudad Universitaria',
      });
    }

    // 2. Limpiar y recrear platos del menú
    await Dish.deleteMany({});
    const insertedDishes = await Dish.insertMany(initialDishes);

    // 3. Crear órdenes de prueba iniciales para el tablero Kanban
    await Order.deleteMany({});
    
    const sampleOrders = [
      {
        orderNumber: 'ORD-1001',
        customer: cliente._id,
        customerName: cliente.name,
        customerEmail: cliente.email,
        items: [
          {
            dish: insertedDishes[0]._id,
            name: insertedDishes[0].name,
            price: insertedDishes[0].price,
            quantity: 2,
            subtotal: insertedDishes[0].price * 2,
          },
          {
            dish: insertedDishes[7]._id,
            name: insertedDishes[7].name,
            price: insertedDishes[7].price,
            quantity: 2,
            subtotal: insertedDishes[7].price * 2,
          },
        ],
        totalAmount: insertedDishes[0].price * 2 + insertedDishes[7].price * 2,
        deliveryAddress: 'Bloque 19, Aula 204, Ciudad Universitaria UdeA',
        deliveryPhone: '3109876543',
        notes: 'Sin cebolla en las hamburguesas por favor.',
        paymentStatus: 'completed',
        paymentMethod: 'paypal_simulated',
        paypalOrderId: 'PAYPAL-SEED-01',
        status: 'Pendiente',
      },
      {
        orderNumber: 'ORD-1002',
        customer: cliente._id,
        customerName: 'Laura Gómez (Estudiante)',
        customerEmail: 'laura@udea.edu.co',
        items: [
          {
            dish: insertedDishes[4]._id,
            name: insertedDishes[4].name,
            price: insertedDishes[4].price,
            quantity: 1,
            subtotal: insertedDishes[4].price,
          },
          {
            dish: insertedDishes[6]._id,
            name: insertedDishes[6].name,
            price: insertedDishes[6].price,
            quantity: 1,
            subtotal: insertedDishes[6].price,
          },
        ],
        totalAmount: insertedDishes[4].price + insertedDishes[6].price,
        deliveryAddress: 'Biblioteca Central UdeA, 2do Piso cubículo 8',
        deliveryPhone: '3157778899',
        notes: 'Mucha salsa tártara y cubiertos descartables.',
        paymentStatus: 'completed',
        paymentMethod: 'paypal_simulated',
        paypalOrderId: 'PAYPAL-SEED-02',
        status: 'En preparación',
      },
      {
        orderNumber: 'ORD-1003',
        customer: cliente._id,
        customerName: 'Prof. Carlos Ramírez',
        customerEmail: 'carlos.ramirez@udea.edu.co',
        items: [
          {
            dish: insertedDishes[2]._id,
            name: insertedDishes[2].name,
            price: insertedDishes[2].price,
            quantity: 1,
            subtotal: insertedDishes[2].price,
          },
        ],
        totalAmount: insertedDishes[2].price,
        deliveryAddress: 'Bloque 21 - Oficina de Docencia 302',
        deliveryPhone: '3124445566',
        notes: 'Llamar al llegar a la puerta del bloque.',
        paymentStatus: 'completed',
        paymentMethod: 'paypal_simulated',
        paypalOrderId: 'PAYPAL-SEED-03',
        status: 'Listo',
      },
      {
        orderNumber: 'ORD-1004',
        customer: cliente._id,
        customerName: 'Ana Sofía Ruiz',
        customerEmail: 'asofia@udea.edu.co',
        items: [
          {
            dish: insertedDishes[1]._id,
            name: insertedDishes[1].name,
            price: insertedDishes[1].price,
            quantity: 1,
            subtotal: insertedDishes[1].price,
          },
          {
            dish: insertedDishes[8]._id,
            name: insertedDishes[8].name,
            price: insertedDishes[8].price,
            quantity: 1,
            subtotal: insertedDishes[8].price,
          },
        ],
        totalAmount: insertedDishes[1].price + insertedDishes[8].price,
        deliveryAddress: 'Portería Calle Barranquilla',
        deliveryPhone: '3189990011',
        notes: 'Entregado a mediodía.',
        paymentStatus: 'completed',
        paymentMethod: 'paypal_simulated',
        paypalOrderId: 'PAYPAL-SEED-04',
        status: 'Entregado',
      },
    ];

    await Order.insertMany(sampleOrders);

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada exitosamente con usuarios, platos y pedidos de prueba.',
      accounts: {
        cocinero: { email: 'cocinero@fastfoodudea.com', password: 'cocinero123' },
        cliente: { email: 'cliente@fastfoodudea.com', password: 'cliente123' },
      },
      dishesCount: insertedDishes.length,
      ordersCount: sampleOrders.length,
    });
  } catch (error: any) {
    console.error('[Seed API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar seed de datos.' },
      { status: 500 }
    );
  }
}

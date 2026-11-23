import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Dish from '@/models/Dish';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: any = { available: true };

    if (category && category !== 'Todos') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const dishes = await Dish.find(filter).sort({ category: 1, name: 1 });
    return NextResponse.json({ success: true, dishes });
  } catch (error: any) {
    console.error('[Dishes GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener el menú de platos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'cocinero') {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere rol de cocinero.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, price, category, image, available = true } = body;

    if (!name || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben completarse.' },
        { status: 400 }
      );
    }

    await connectDB();
    const newDish = await Dish.create({
      name,
      description,
      price: Number(price),
      category,
      image: image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
      available,
    });

    return NextResponse.json({ success: true, dish: newDish }, { status: 201 });
  } catch (error: any) {
    console.error('[Dishes POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear el plato.' },
      { status: 500 }
    );
  }
}

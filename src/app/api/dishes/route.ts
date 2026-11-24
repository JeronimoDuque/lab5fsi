import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Book from '@/models/Book';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const books = await Book.find().sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      dishes: books.map((b) => ({
        _id: b._id,
        name: b.title,
        description: b.description,
        price: b.price,
        category: b.category,
        image: b.coverImage,
        available: b.stock > 0 || b.format !== 'fisico',
      })),
      books,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al consultar libros.' }, { status: 500 });
  }
}

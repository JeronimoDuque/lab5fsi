import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Book from '@/models/Book';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const format = searchParams.get('format');
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');

    const filter: any = {};

    if (category && category !== 'Todas') {
      filter.category = category;
    }

    if (format && format !== 'todos') {
      if (format === 'fisico') {
        filter.format = { $in: ['fisico', 'ambos'] };
      } else if (format === 'ebook') {
        filter.format = { $in: ['ebook', 'ambos'] };
      }
    }

    if (inStock === 'true') {
      filter.$or = [{ stock: { $gt: 0 } }, { format: { $in: ['ebook', 'ambos'] } }];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
        { description: searchRegex },
      ];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error: any) {
    console.error('[Books GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar el catálogo de libros.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden añadir libros.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, author, isbn, description, price, format, category, stock, coverImage, downloadUrl, pages } = body;

    if (!title || !author || !isbn || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser provistos.' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return NextResponse.json(
        { error: 'Ya existe un libro registrado con este código ISBN.' },
        { status: 409 }
      );
    }

    const newBook = await Book.create({
      title,
      author,
      isbn,
      description,
      price: Number(price),
      format: format || 'ambos',
      category,
      stock: Number(stock) || 0,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
      downloadUrl: downloadUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      pages: Number(pages) || 250,
      isAvailable: true,
    });

    try {
      const io = (globalThis as any).io;
      if (io) {
        io.emit('catalog:updated', { book: newBook });
      }
    } catch (wsErr) {
      console.warn('[WebSocket Emit Warning]:', wsErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Libro añadido exitosamente al catálogo',
        book: newBook,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Books POST Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear el libro.' },
      { status: 500 }
    );
  }
}

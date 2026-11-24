import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Book from '@/models/Book';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await connectDB();

    const book = await Book.findById(id);
    if (!book) {
      return NextResponse.json({ error: 'Libro no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error('[Book GET ID Error]:', error);
    return NextResponse.json(
      { error: 'Error al consultar el detalle del libro.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'admin' && user.role !== 'logistica')) {
      return NextResponse.json(
        { error: 'No autorizado. Permisos insuficientes.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    await connectDB();

    const updatedBook = await Book.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBook) {
      return NextResponse.json({ error: 'Libro no encontrado.' }, { status: 404 });
    }

    // Emitir WebSocket si el stock fue modificado
    if (body.stock !== undefined) {
      try {
        const io = (globalThis as any).io;
        if (io) {
          io.emit('stock:updated', { bookId: updatedBook._id, newStock: updatedBook.stock });
        }
      } catch (wsErr) {
        console.warn('[WebSocket Emit Warning]:', wsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Libro actualizado exitosamente',
      book: updatedBook,
    });
  } catch (error: any) {
    console.error('[Book PATCH Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el libro.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden eliminar libros.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    await connectDB();

    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return NextResponse.json({ error: 'Libro no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Libro eliminado del catálogo.',
    });
  } catch (error: any) {
    console.error('[Book DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el libro.' },
      { status: 500 }
    );
  }
}

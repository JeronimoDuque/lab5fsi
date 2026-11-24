'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { IBook, BookCategory, BookFormat } from '@/types';
import { getSocket } from '@/lib/socket';
import {
  Search,
  BookOpen,
  Download,
  Package,
  Check,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Filter,
} from 'lucide-react';

const CATEGORIES: (BookCategory | 'Todas')[] = [
  'Todas',
  'Ficción',
  'No Ficción',
  'Tecnología',
  'Negocios',
  'Ciencia',
  'Autoayuda',
  'Literatura',
  'Educación',
];

export default function CatalogoPage() {
  const { addItem, formatPrice } = useCart();
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedFormat, setSelectedFormat] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'Todas') params.set('category', selectedCategory);
      if (selectedFormat !== 'todos') params.set('format', selectedFormat);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/books?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, selectedFormat]);

  // Manejar búsqueda con debounce ligero
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Escuchar actualizaciones de stock en tiempo real vía WebSockets
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join:catalog');
      const handleStockUpdate = (data: { bookId: string; newStock: number }) => {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book._id === data.bookId ? { ...book, stock: data.newStock } : book
          )
        );
      };

      socket.on('stock:updated', handleStockUpdate);
      return () => {
        socket.off('stock:updated', handleStockUpdate);
      };
    }
  }, []);

  const handleAddToCart = (book: IBook, format: 'fisico' | 'ebook') => {
    const result = addItem(book, format, 1);
    if (result.success) {
      setAddedItemNotice(`¡"${book.title}" (${format === 'fisico' ? 'Libro Físico' : 'E-Book'}) agregado al carrito!`);
      setTimeout(() => setAddedItemNotice(null), 3000);
    } else {
      alert(result.message || 'No se pudo agregar al carrito');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Toast Notice */}
      {addedItemNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in border border-emerald-500">
          <Check className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{addedItemNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Catálogo Oficial BookHub
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explora Nuestro Catálogo de Libros y E-Books
        </h1>
        <p className="mt-3 text-slate-600 text-base">
          Encuentra tus títulos favoritos en formato físico con envío nacional garantizado o en formato digital para lectura y descarga instantánea.
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Barra de búsqueda */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, autor o ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Selector de formato */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Formato:
            </span>
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedFormat('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFormat === 'todos'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedFormat('fisico')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFormat === 'fisico'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Físicos
              </button>
              <button
                onClick={() => setSelectedFormat('ebook')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFormat === 'ebook'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                E-Books
              </button>
            </div>
          </div>
        </div>

        {/* Categorías (Pills) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Libros */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="w-full h-60 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              <div className="h-8 bg-slate-200 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No se encontraron libros</h3>
          <p className="text-slate-500 text-sm mt-1">
            Intenta cambiar los filtros de categoría, formato o término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => {
            const hasPhysical = book.format === 'fisico' || book.format === 'ambos';
            const hasEbook = book.format === 'ebook' || book.format === 'ambos';
            const isOutOfStock = hasPhysical && book.stock <= 0;

            return (
              <div
                key={book._id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
              >
                {/* Portada */}
                <div className="relative w-full h-64 bg-slate-100 overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Badges de Formato y Categoría */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      {book.category}
                    </span>
                    {book.format === 'ambos' && (
                      <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        Físico & E-Book
                      </span>
                    )}
                    {book.format === 'ebook' && (
                      <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Download className="w-3 h-3" /> Solo E-Book
                      </span>
                    )}
                    {book.format === 'fisico' && (
                      <span className="bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Package className="w-3 h-3" /> Solo Físico
                      </span>
                    )}
                  </div>

                  {/* Stock en Vivo para Libro Físico */}
                  {hasPhysical && (
                    <div className="absolute bottom-3 right-3">
                      {book.stock > 0 ? (
                        <span className="bg-emerald-500/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          {book.stock} en stock
                        </span>
                      ) : (
                        <span className="bg-rose-500/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          Agotado físico
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Info del Libro */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">ISBN: {book.isbn}</span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-indigo-700 font-semibold mb-2">{book.author}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  {/* Precios y Acciones */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Precio</span>
                        <div className="text-lg font-black text-slate-900">
                          {formatPrice(book.price)}
                        </div>
                      </div>
                      {book.pages && (
                        <span className="text-[11px] text-slate-500 font-medium">{book.pages} págs.</span>
                      )}
                    </div>

                    {/* Botones de Compra por Formato */}
                    <div className="grid grid-cols-1 gap-2">
                      {hasPhysical && (
                        <button
                          onClick={() => handleAddToCart(book, 'fisico')}
                          disabled={isOutOfStock}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          {isOutOfStock ? 'Físico Agotado' : 'Comprar Físico'}
                        </button>
                      )}

                      {hasEbook && (
                        <button
                          onClick={() => handleAddToCart(book, 'ebook')}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Comprar E-Book (Descarga)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

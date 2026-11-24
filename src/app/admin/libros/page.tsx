'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { IBook, BookCategory, BookFormat } from '@/types';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Search,
  Check,
  AlertCircle,
  Package,
  Download,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES: BookCategory[] = [
  'Ficción',
  'No Ficción',
  'Tecnología',
  'Negocios',
  'Ciencia',
  'Autoayuda',
  'Literatura',
  'Educación',
];

export default function AdminLibrosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(45000);
  const [format, setFormat] = useState<BookFormat>('ambos');
  const [category, setCategory] = useState<BookCategory>('Tecnología');
  const [stock, setStock] = useState(15);
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
  );
  const [downloadUrl, setDownloadUrl] = useState(
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  );
  const [pages, setPages] = useState(320);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/books');
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
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'admin') {
        router.push('/catalogo');
        return;
      }
    }

    if (user && user.role === 'admin') {
      fetchBooks();
    }
  }, [user, authLoading]);

  const handleOpenCreateModal = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setIsbn(`978-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setDescription('');
    setPrice(45000);
    setFormat('ambos');
    setCategory('Tecnología');
    setStock(20);
    setCoverImage('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800');
    setDownloadUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    setPages(280);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (book: IBook) => {
    setEditingBookId(book._id);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn);
    setDescription(book.description);
    setPrice(book.price);
    setFormat(book.format);
    setCategory(book.category);
    setStock(book.stock);
    setCoverImage(book.coverImage);
    setDownloadUrl(book.downloadUrl || '');
    setPages(book.pages || 200);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const url = editingBookId ? `/api/books/${editingBookId}` : '/api/books';
      const method = editingBookId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          isbn,
          description,
          price: Number(price),
          format,
          category,
          stock: Number(stock),
          coverImage,
          downloadUrl,
          pages: Number(pages),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el libro');
      }

      setShowModal(false);
      fetchBooks();
    } catch (err: any) {
      setFormError(err.message || 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, bookTitle: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el libro "${bookTitle}" del catálogo?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert('No fue posible eliminar el libro.');
      }
    } catch (err) {
      alert('Error de conexión al eliminar.');
    }
  };

  const handleInlineStock = async (id: string, delta: number) => {
    const book = books.find((b) => b._id === id);
    if (!book) return;

    const newStock = Math.max(0, book.stock + delta);
    setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, stock: newStock } : b)));

    await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-bold mb-2 border border-purple-200">
            <Layers className="w-3.5 h-3.5" />
            Panel de Administración de Catálogo
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gestión de Libros, E-Books e Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crea títulos, ajusta stock en bodega, define formatos disponibles y actualiza precios.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Añadir Nuevo Libro
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por título, autor o ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Tabla de Libros */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Portada & Título</th>
                <th className="px-4 py-4">Categoría</th>
                <th className="px-4 py-4">Formato</th>
                <th className="px-4 py-4">Precio</th>
                <th className="px-6 py-4">Stock Físico</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.map((book) => (
                <tr key={book._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded-md border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{book.title}</div>
                        <div className="text-[11px] text-slate-500">{book.author}</div>
                        <div className="text-[10px] font-mono text-slate-400">ISBN: {book.isbn}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      {book.category}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        book.format === 'ambos'
                          ? 'bg-indigo-100 text-indigo-800'
                          : book.format === 'fisico'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {book.format === 'ambos'
                        ? 'Físico + E-Book'
                        : book.format === 'fisico'
                        ? 'Solo Físico'
                        : 'Solo E-Book'}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-black text-slate-900">
                    {formatPrice(book.price)}
                  </td>

                  <td className="px-6 py-4">
                    {book.format !== 'ebook' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInlineStock(book._id, -1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded ${
                            book.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {book.stock} un.
                        </span>
                        <button
                          onClick={() => handleInlineStock(book._id, 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Digital (Ilimitado)</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(book)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        title="Editar Libro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book._id, book.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Eliminar Libro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear / Editar Libro */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingBookId ? 'Editar Libro en Catálogo' : 'Añadir Nuevo Libro'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título del Libro *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Cien Años de Soledad"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Autor *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ej. Gabriel García Márquez"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código ISBN *</label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-0123456789"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio (COP) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Formato Disponible</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as BookFormat)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ambos">Físico y E-Book</option>
                    <option value="fisico">Solo Libro Físico</option>
                    <option value="ebook">Solo E-Book Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Físico Inicial</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número de Páginas</label>
                  <input
                    type="number"
                    min={1}
                    value={pages}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción de la Obra *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sinopsis detallada del libro..."
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL de Portada (Imagen)</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL de Descarga E-Book (PDF)</label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
                >
                  {saving ? 'Guardando...' : editingBookId ? 'Actualizar Libro' : 'Crear Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

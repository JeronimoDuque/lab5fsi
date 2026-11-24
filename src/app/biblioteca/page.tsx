'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { IOrder, IOrderItem } from '@/types';
import {
  BookMarked,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface PurchasedEbook {
  bookId: string;
  title: string;
  price: number;
  downloadUrl: string;
  orderNumber: string;
  purchaseDate: string;
}

export default function BibliotecaPage() {
  const { user } = useAuth();
  const [ebooks, setEbooks] = useState<PurchasedEbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedEbooks = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (res.ok && data.orders) {
          const list: PurchasedEbook[] = [];
          data.orders.forEach((order: IOrder) => {
            order.items.forEach((item: IOrderItem) => {
              if (item.format === 'ebook') {
                list.push({
                  bookId: item.book,
                  title: item.title,
                  price: item.price,
                  downloadUrl: item.downloadUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  orderNumber: order.orderNumber,
                  purchaseDate: order.createdAt,
                });
              }
            });
          });
          setEbooks(list);
        }
      } catch (err) {
        console.error('Error fetching ebooks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedEbooks();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Acceso Digital Permanente
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Mi Biblioteca Digital de E-Books
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Todos tus libros electrónicos adquiridos disponibles para lectura en línea y descarga sin límites.
          </p>
        </div>

        <Link
          href="/catalogo?format=ebook"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Descubrir más E-Books
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
              <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : ebooks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Aún no tienes e-books en tu biblioteca</h3>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            Cuando adquieras libros en formato digital (E-Book), aparecerán aquí de inmediato para su descarga en formato PDF y lectura.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20"
          >
            Explorar Catálogo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks.map((ebook, idx) => (
            <div
              key={`${ebook.orderNumber}-${idx}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Licencia Activa
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Orden: {ebook.orderNumber}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2">
                  {ebook.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Adquirido el{' '}
                    {new Date(ebook.purchaseDate).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <a
                  href={ebook.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar E-Book (PDF)
                </a>

                <a
                  href={ebook.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  Abrir Lector en Línea
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

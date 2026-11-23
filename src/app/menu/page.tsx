'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { IDish, DishCategory } from '@/types';
import { useCart } from '@/context/CartContext';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';

const categories: ('Todos' | DishCategory)[] = [
  'Todos',
  'Hamburguesas',
  'Pizzas',
  'Salchipapas',
  'Bebidas',
  'Postres',
];

export default function MenuPage() {
  const [dishes, setDishes] = useState<IDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | DishCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedAnimation, setAddedAnimation] = useState<{ [key: string]: boolean }>({});
  const { addItem, totalCount, totalAmount, formatPrice } = useCart();

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/dishes', window.location.origin);
      if (selectedCategory !== 'Todos') url.searchParams.append('category', selectedCategory);
      if (searchTerm) url.searchParams.append('search', searchTerm);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.dishes) {
        setDishes(data.dishes);
      }
    } catch (err) {
      console.error('Error fetching dishes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDishes();
  };

  const handleAddToCart = (dish: IDish) => {
    addItem(dish, 1);
    setAddedAnimation((prev) => ({ ...prev, [dish._id]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [dish._id]: false }));
    }, 1200);
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      await fetch('/api/seed', { method: 'POST' });
      await fetchDishes();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-xl shadow-orange-500/15">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Menú Universitario FastFoodUdeA
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Pide lo que se te antoje
          </h1>
          <p className="text-orange-100 text-sm sm:text-base">
            Elige tus platos favoritos, confirma tu dirección y paga al instante con PayPal.
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar hamburguesa, pizza..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </form>
      </div>

      {/* Dishes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100 p-4 space-y-4">
              <div className="bg-slate-200 h-44 rounded-xl w-full" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No hay platos registrados aún</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Puedes cargar los platos y menús de prueba de FastFoodUdeA con un solo clic.
          </p>
          <button
            onClick={handleSeed}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Cargar Menú de Prueba
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => {
            const isAdded = addedAnimation[dish._id];
            return (
              <div
                key={dish._id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col group"
              >
                {/* Image & Category Tag */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-xs text-orange-700 shadow-xs">
                      {dish.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-orange-600 transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Precio
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatPrice(dish.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(dish)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white scale-105'
                          : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          ¡Agregado!
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Agregar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 max-w-2xl mx-auto px-4 z-40">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold">
                {totalCount}
              </div>
              <div>
                <p className="text-xs text-slate-400">Total de tu pedido:</p>
                <p className="text-base font-black text-white">{formatPrice(totalAmount)}</p>
              </div>
            </div>

            <Link
              href="/checkout"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              Ver Resumen y Pagar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

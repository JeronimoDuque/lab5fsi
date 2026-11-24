'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IBook, CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (book: IBook, format?: 'fisico' | 'ebook', quantity?: number) => { success: boolean; message?: string };
  removeItem: (bookId: string, format: 'fisico' | 'ebook') => void;
  updateQuantity: (bookId: string, format: 'fisico' | 'ebook', quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalCount: number;
  subtotalAmount: number;
  shippingCost: number;
  totalAmount: number;
  hasPhysicalItems: boolean;
  hasEbookItems: boolean;
  formatPrice: (amount: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito de localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bookhub_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error loading cart from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('bookhub_cart', JSON.stringify(items));
      } catch (e) {
        console.warn('Error saving cart to localStorage', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (book: IBook, format?: 'fisico' | 'ebook', quantity = 1) => {
    // Si no se especifica formato, se asume ebook si solo es ebook, de lo contrario fisico
    const selectedFormat: 'fisico' | 'ebook' =
      format || (book.format === 'ebook' ? 'ebook' : 'fisico');

    // Validación de stock para formato físico
    if (selectedFormat === 'fisico') {
      const existing = items.find(
        (i) => i.book._id === book._id && i.selectedFormat === 'fisico'
      );
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > book.stock) {
        return {
          success: false,
          message: `Stock insuficiente. Solo quedan ${book.stock} unidades físicas disponibles.`,
        };
      }
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.book._id === book._id && item.selectedFormat === selectedFormat
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { book, quantity, selectedFormat }];
    });

    return { success: true };
  };

  const removeItem = (bookId: string, format: 'fisico' | 'ebook') => {
    setItems((prev) =>
      prev.filter((item) => !(item.book._id === bookId && item.selectedFormat === format))
    );
  };

  const updateQuantity = (bookId: string, format: 'fisico' | 'ebook', quantity: number) => {
    if (quantity <= 0) {
      removeItem(bookId, format);
      return { success: true };
    }

    const item = items.find((i) => i.book._id === bookId && i.selectedFormat === format);
    if (item && format === 'fisico' && quantity > item.book.stock) {
      return {
        success: false,
        message: `Solo hay ${item.book.stock} unidades disponibles en inventario.`,
      };
    }

    setItems((prev) =>
      prev.map((i) =>
        i.book._id === bookId && i.selectedFormat === format ? { ...i, quantity } : i
      )
    );
    return { success: true };
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.book.price * item.quantity,
    0
  );

  const hasPhysicalItems = items.some((item) => item.selectedFormat === 'fisico');
  const hasEbookItems = items.some((item) => item.selectedFormat === 'ebook');

  // Si hay libros físicos se agrega costo de envío fijo de $12.000 COP, si son solo e-books es $0
  const shippingCost = hasPhysicalItems ? 12000 : 0;
  const totalAmount = subtotalAmount + shippingCost;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotalAmount,
        shippingCost,
        totalAmount,
        hasPhysicalItems,
        hasEbookItems,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};

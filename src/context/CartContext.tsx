'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IDish, CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (dish: IDish, quantity?: number) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  formatPrice: (amount: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar carrito de localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fastfood_cart');
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
        localStorage.setItem('fastfood_cart', JSON.stringify(items));
      } catch (e) {
        console.warn('Error saving cart to localStorage', e);
      }
    }
  }, [items, isLoaded]);

  const addItem = (dish: IDish, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.dish._id === dish._id);
      if (existing) {
        return prev.map((item) =>
          item.dish._id === dish._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { dish, quantity }];
    });
  };

  const removeItem = (dishId: string) => {
    setItems((prev) => prev.filter((item) => item.dish._id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(dishId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.dish._id === dishId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

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
        totalAmount,
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

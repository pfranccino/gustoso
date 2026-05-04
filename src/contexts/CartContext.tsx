'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type CartItem = {
  id: number;
  name: string;
  desc?: string;
  price: number;
  size?: string;
  note?: string;
  qty: number;
  alwaysNew?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'qty'>) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartCtx = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]   = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const idRef = useRef(0);

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'qty'>) => {
    setItems(prev => {
      if (item.alwaysNew) {
        return [...prev, { ...item, id: ++idRef.current, qty: 1 }];
      }
      const idx = prev.findIndex(p =>
        p.name === item.name &&
        (p.size  || '') === (item.size  || '') &&
        (p.note  || '') === (item.note  || '')
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { ...item, id: ++idRef.current, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: number) => setItems(prev => prev.filter(p => p.id !== id)), []);
  const updateQty  = useCallback((id: number, delta: number) =>
    setItems(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0)), []);
  const clearCart  = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, isOpen, setIsOpen }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

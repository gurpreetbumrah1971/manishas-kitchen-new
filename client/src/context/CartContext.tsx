import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'cart';
const CART_EXPIRY_STORAGE_KEY = 'cartExpiresAt';
const CART_TTL_MS = 30 * 60 * 1000;

const clearStoredCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(CART_EXPIRY_STORAGE_KEY);
};

const loadStoredCart = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    const expiresAt = Number(localStorage.getItem(CART_EXPIRY_STORAGE_KEY));
    // Carts from before the expiry policy do not have a valid deadline.
    if (!savedCart || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      clearStoredCart();
      return [];
    }
    const cart = JSON.parse(savedCart);
    return Array.isArray(cart) ? cart : [];
  } catch {
    clearStoredCart();
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(loadStoredCart);

  useEffect(() => {
    if (!cart.length) {
      clearStoredCart();
      return;
    }

    const expiresAt = Date.now() + CART_TTL_MS;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    localStorage.setItem(CART_EXPIRY_STORAGE_KEY, String(expiresAt));
    const expiryTimer = window.setTimeout(() => setCart([]), CART_TTL_MS);
    return () => window.clearTimeout(expiryTimer);
  }, [cart]);

  useEffect(() => {
    const clearExpiredCartOnReturn = () => {
      const expiresAt = Number(localStorage.getItem(CART_EXPIRY_STORAGE_KEY));
      if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) setCart([]);
    };
    window.addEventListener('pageshow', clearExpiredCartOnReturn);
    window.addEventListener('focus', clearExpiredCartOnReturn);
    return () => {
      window.removeEventListener('pageshow', clearExpiredCartOnReturn);
      window.removeEventListener('focus', clearExpiredCartOnReturn);
    };
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

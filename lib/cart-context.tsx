"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCatalogData } from "./catalog-data-context";
import type { Product } from "./types";

interface CartItem {
  productId: string;
  qty: number;
}

export interface CartLine {
  product: Product;
  qty: number;
  lineTotal: number;
}

interface CartContextValue {
  lines: CartLine[];
  totalCount: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "nutrihome_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalogData();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Reading localStorage must happen client-side only (static export has
      // no window during prerender), so this can't move out of an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (productId: string, qty = 1) => {
      const stockLimit = products.find((p) => p.id === productId)?.stockQuantity;
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        const nextQty = (existing?.qty ?? 0) + qty;
        const clampedQty = typeof stockLimit === "number" ? Math.min(nextQty, stockLimit) : nextQty;
        if (existing) {
          return prev.map((item) =>
            item.productId === productId ? { ...item, qty: clampedQty } : item
          );
        }
        return [...prev, { productId, qty: clampedQty }];
      });
      setIsOpen(true);
    },
    [products]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQty = useCallback(
    (productId: string, qty: number) => {
      const stockLimit = products.find((p) => p.id === productId)?.stockQuantity;
      const clampedQty = typeof stockLimit === "number" ? Math.min(qty, stockLimit) : qty;
      setItems((prev) => {
        if (clampedQty <= 0) return prev.filter((item) => item.productId !== productId);
        return prev.map((item) => (item.productId === productId ? { ...item, qty: clampedQty } : item));
      });
    },
    [products]
  );

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const lines = useMemo<CartLine[]>(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return { product, qty: item.qty, lineTotal: product.price * item.qty };
      })
      .filter((line): line is CartLine => line !== null);
  }, [items, products]);

  const totalCount = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);
  const totalPrice = useMemo(() => lines.reduce((sum, line) => sum + line.lineTotal, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totalCount,
      totalPrice,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQty,
      clear,
    }),
    [lines, totalCount, totalPrice, isOpen, openCart, closeCart, addItem, removeItem, updateQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

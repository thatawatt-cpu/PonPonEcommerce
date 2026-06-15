"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import { SHIPPING_FEE } from "@/lib/constants";
import { getProductById } from "@/features/products/product-service";

interface AddItemPayload {
  product: Product;
  quantity?: number;
  selectedOptions?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  addItem: (payload: AddItemPayload) => void;
  removeItem: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  /** Total quantity of all items (used for the bottom-nav badge). */
  totalItems: () => number;
  subtotal: () => number;
  shippingFee: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ product, quantity = 1, selectedOptions }) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      selectedOptions: selectedOptions ?? item.selectedOptions,
                    }
                  : item
              ),
            };
          }
          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            emoji: product.emoji,
            quantity,
            selectedOptions,
          };
          return { items: [...state.items, newItem] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      increaseQuantity: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),

      decreaseQuantity: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => {
          const currentProduct = getProductById(item.productId);
          return sum + (currentProduct?.price ?? item.price) * item.quantity;
        }, 0),

      shippingFee: () => (get().items.length > 0 ? SHIPPING_FEE : 0),

      total: () => get().subtotal() + get().shippingFee(),
    }),
    {
      name: "ponpon-cart",
      // Only persist the items; derived getters are recomputed.
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate =
        useCartStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinish =
        useCartStore.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeHydrate();
        unsubscribeFinish();
      };
    },
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}

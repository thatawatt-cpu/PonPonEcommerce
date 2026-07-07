"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import { SHIPPING_FEE } from "@/lib/constants";

interface AddItemPayload {
  product: Product;
  quantity?: number;
  selectedOptions?: Record<string, string>;
  variantId?: string | null;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (payload: AddItemPayload) => void;
  removeItem: (itemKey: string) => void;
  increaseQuantity: (itemKey: string) => void;
  decreaseQuantity: (itemKey: string) => void;
  clearCart: () => void;
  /** Total quantity of all items (used for the bottom-nav badge). */
  totalItems: () => number;
  subtotal: () => number;
  shippingFee: () => number;
  total: () => number;
}

function normalizeOptions(
  selectedOptions?: Record<string, string>
): Record<string, string> | undefined {
  if (!selectedOptions) return undefined;

  const entries = Object.entries(selectedOptions)
    .filter(([, value]) => Boolean(value))
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries);
}

export function getCartItemKey(
  item: Pick<CartItem, "productId" | "selectedOptions">
): string {
  const normalizedOptions = normalizeOptions(item.selectedOptions);
  if (!normalizedOptions) return item.productId;

  return `${item.productId}:${JSON.stringify(normalizedOptions)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: ({ product, quantity = 1, selectedOptions, variantId, imageUrl }) =>
        set((state) => {
          const normalizedOptions = normalizeOptions(selectedOptions);
          const itemKey = getCartItemKey({
            productId: product.id,
            selectedOptions: normalizedOptions,
          });
          const existing = state.items.find(
            (item) => getCartItemKey(item) === itemKey
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                getCartItemKey(item) === itemKey
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      productSlug: product.slug || item.productSlug,
                      imageUrl: imageUrl ?? item.imageUrl,
                    }
                  : item
              ),
            };
          }
          const newItem: CartItem = {
            productId: product.id,
            productSlug: product.slug,
            variantId: variantId ?? null,
            name: product.name,
            price: product.price,
            imageUrl: imageUrl ?? product.imageUrl,
            emoji: product.emoji,
            quantity,
            selectedOptions: normalizedOptions,
          };
          return { items: [...state.items, newItem] };
        }),

      removeItem: (itemKey) =>
        set((state) => ({
          items: state.items.filter((item) => getCartItemKey(item) !== itemKey),
        })),

      increaseQuantity: (itemKey) =>
        set((state) => ({
          items: state.items.map((item) =>
            getCartItemKey(item) === itemKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),

      decreaseQuantity: (itemKey) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              getCartItemKey(item) === itemKey
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
          return sum + item.price * item.quantity;
        }, 0),

      shippingFee: () => (get().items.length > 0 ? SHIPPING_FEE : 0),

      total: () => get().subtotal() + get().shippingFee(),
    }),
    {
      name: "ponpon-cart",
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as { items?: CartItem[] };
        const items = Array.isArray(state.items) ? state.items : [];

        if (version < 2) {
          return {
            items: items.filter(
              (item) =>
                !(
                  /^\d+$/.test(item.productId) &&
                  item.imageUrl.startsWith("/images/products/")
                ),
            ),
          };
        }

        return { items };
      },
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

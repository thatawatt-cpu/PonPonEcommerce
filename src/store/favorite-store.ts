"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteState {
  productIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isFavorite: (productId) => get().productIds.includes(productId),
    }),
    {
      name: "ponpon-favorites",
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
);

export function useFavoritesHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate =
        useFavoriteStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinish =
        useFavoriteStore.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeHydrate();
        unsubscribeFinish();
      };
    },
    () => useFavoriteStore.persist.hasHydrated(),
    () => false,
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTierBySpend } from "@/lib/membership";
import type {
  MembershipTier,
  PointTransaction,
} from "@/types/membership";

interface MembershipState {
  points: number;
  lifetimeSpend: number;
  transactions: PointTransaction[];
  tier: () => MembershipTier;
  creditOrder: (orderNo: string, points: number, spend: number) => void;
}

const initialTransactions: PointTransaction[] = [
  {
    id: "welcome-bonus",
    type: "bonus",
    title: "โบนัสต้อนรับสมาชิก",
    description: "ขอบคุณที่สมัครสมาชิก PonPon Official",
    points: 100,
    createdAt: "2026-06-01T09:00:00+07:00",
  },
  {
    id: "order-ord003",
    type: "earn",
    title: "คะแนนจาก ORD003",
    description: "ซื้อสินค้าครบ ฿499",
    points: 62,
    createdAt: "2026-05-31T16:45:00+07:00",
    reference: "ORD003",
  },
  {
    id: "monthly-bonus",
    type: "bonus",
    title: "โบนัสลูกค้าประจำ",
    description: "โบนัสพิเศษประจำเดือนมิถุนายน",
    points: 50,
    createdAt: "2026-06-05T10:00:00+07:00",
  },
];

export const useMembershipStore = create<MembershipState>()(
  persist(
    (set, get) => ({
      points: 1280,
      lifetimeSpend: 2750,
      transactions: initialTransactions,
      tier: () => getTierBySpend(get().lifetimeSpend).id,
      creditOrder: (orderNo, points, spend) =>
        set((state) => {
          if (
            state.transactions.some(
              (transaction) =>
                transaction.type === "earn" &&
                transaction.reference === orderNo,
            )
          ) {
            return state;
          }

          return {
            points: state.points + points,
            lifetimeSpend: state.lifetimeSpend + spend,
            transactions: [
              {
                id: `order-${orderNo.toLowerCase()}`,
                type: "earn",
                title: `คะแนนจาก ${orderNo}`,
                description: `ยอดชำระ ฿${spend.toLocaleString("th-TH")}`,
                points,
                createdAt: new Date().toISOString(),
                reference: orderNo,
              },
              ...state.transactions,
            ],
          };
        }),
    }),
    {
      name: "ponpon-membership",
      partialize: (state) => ({
        points: state.points,
        lifetimeSpend: state.lifetimeSpend,
        transactions: state.transactions,
      }),
    },
  ),
);

export function useMembershipHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate =
        useMembershipStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinish =
        useMembershipStore.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeHydrate();
        unsubscribeFinish();
      };
    },
    () => useMembershipStore.persist.hasHydrated(),
    () => false,
  );
}

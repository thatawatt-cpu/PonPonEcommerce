"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MY_REFERRAL_CODE,
  createFriendReward,
  createInviterReward,
} from "@/lib/referral";
import type { ReferralReward, ReferredFriend } from "@/types/referral";

interface ReferralState {
  referralCode: string;
  acceptedReferralCode?: string;
  rewards: ReferralReward[];
  friends: ReferredFriend[];
  acceptReferralCode: (code: string) => {
    ok: boolean;
    message: string;
  };
  markRewardUsed: (code: string) => void;
}

const initialRewards: ReferralReward[] = [
  createInviterReward("reward-mint"),
];

const initialFriends: ReferredFriend[] = [
  {
    id: "friend-mint",
    name: "Mint",
    status: "ordered",
    rewardCode: "PONTHANK50",
    joinedAt: "2026-06-04T13:20:00+07:00",
  },
  {
    id: "friend-ploy",
    name: "Ploy",
    status: "joined",
    joinedAt: "2026-06-10T09:15:00+07:00",
  },
];

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: MY_REFERRAL_CODE,
      rewards: initialRewards,
      friends: initialFriends,
      acceptReferralCode: (rawCode) => {
        const code = rawCode.trim().toUpperCase();
        if (!code) {
          return { ok: false, message: "กรุณากรอกรหัสแนะนำเพื่อน" };
        }
        if (code === get().referralCode) {
          return { ok: false, message: "ใช้รหัสของตัวเองไม่ได้" };
        }
        if (get().acceptedReferralCode) {
          return {
            ok: false,
            message: "บัญชีนี้ใช้รหัสแนะนำเพื่อนแล้ว",
          };
        }

        const friendReward = createFriendReward();
        set((state) => ({
          acceptedReferralCode: code,
          rewards: state.rewards.some(
            (reward) => reward.code === friendReward.code,
          )
            ? state.rewards
            : [friendReward, ...state.rewards],
        }));

        return {
          ok: true,
          message: `รับคูปอง ${friendReward.code} เรียบร้อย`,
        };
      },
      markRewardUsed: (code) =>
        set((state) => ({
          rewards: state.rewards.map((reward) =>
            reward.code === code ? { ...reward, status: "used" } : reward,
          ),
        })),
    }),
    {
      name: "ponpon-referral",
      partialize: (state) => ({
        referralCode: state.referralCode,
        acceptedReferralCode: state.acceptedReferralCode,
        rewards: state.rewards,
        friends: state.friends,
      }),
    },
  ),
);

export function useReferralHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate =
        useReferralStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinish =
        useReferralStore.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeHydrate();
        unsubscribeFinish();
      };
    },
    () => useReferralStore.persist.hasHydrated(),
    () => false,
  );
}

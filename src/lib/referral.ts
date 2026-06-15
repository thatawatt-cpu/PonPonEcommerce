import type { ReferralReward } from "@/types/referral";

export const MY_REFERRAL_CODE = "PONPON128";
export const FRIEND_REWARD_CODE = "PONFRIEND50";
export const INVITER_REWARD_CODE = "PONTHANK50";

export function createFriendReward(): ReferralReward {
  return {
    id: "friend-welcome-reward",
    title: "คูปองเพื่อนใหม่",
    description: "รับส่วนลด ฿50 เมื่อสั่งซื้อครบ ฿299",
    code: FRIEND_REWARD_CODE,
    value: "฿50",
    status: "available",
    createdAt: new Date().toISOString(),
  };
}

export function createInviterReward(id: string): ReferralReward {
  return {
    id,
    title: "รางวัลแนะนำเพื่อน",
    description: "เพื่อนสั่งซื้อแล้ว รับส่วนลด ฿50",
    code: INVITER_REWARD_CODE,
    value: "฿50",
    status: "available",
    createdAt: new Date().toISOString(),
  };
}

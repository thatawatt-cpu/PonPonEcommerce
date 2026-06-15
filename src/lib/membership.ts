import type {
  MembershipTier,
  TierDefinition,
} from "@/types/membership";

export const MEMBERSHIP_TIERS: TierDefinition[] = [
  {
    id: "silver",
    name: "Silver",
    minimumSpend: 0,
    pointMultiplier: 1,
    benefits: ["รับ 1 คะแนนทุก ฿10", "คูปองวันเกิด", "รับข่าวโปรโมชันก่อนใคร"],
  },
  {
    id: "gold",
    name: "Gold",
    minimumSpend: 1500,
    pointMultiplier: 1.25,
    benefits: ["รับคะแนน x1.25", "คูปองส่งฟรีรายเดือน", "สิทธิ์ซื้อดีลสมาชิก"],
  },
  {
    id: "platinum",
    name: "Platinum",
    minimumSpend: 5000,
    pointMultiplier: 1.5,
    benefits: ["รับคะแนน x1.5", "ส่งฟรีแบบไม่มีขั้นต่ำ", "ของขวัญพิเศษประจำปี"],
  },
];

export function getTierBySpend(lifetimeSpend: number): TierDefinition {
  return [...MEMBERSHIP_TIERS]
    .reverse()
    .find((tier) => lifetimeSpend >= tier.minimumSpend) ?? MEMBERSHIP_TIERS[0];
}

export function getNextTier(
  currentTier: MembershipTier,
): TierDefinition | undefined {
  const index = MEMBERSHIP_TIERS.findIndex((tier) => tier.id === currentTier);
  return MEMBERSHIP_TIERS[index + 1];
}

export function calculateEarnedPoints(
  amount: number,
  tier: MembershipTier,
): number {
  const multiplier =
    MEMBERSHIP_TIERS.find((item) => item.id === tier)?.pointMultiplier ?? 1;
  return Math.floor((Math.max(amount, 0) / 10) * multiplier);
}

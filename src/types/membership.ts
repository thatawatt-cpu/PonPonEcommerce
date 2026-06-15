export type MembershipTier = "silver" | "gold" | "platinum";

export type PointTransactionType = "earn" | "bonus" | "redeem";

export interface PointTransaction {
  id: string;
  type: PointTransactionType;
  title: string;
  description: string;
  points: number;
  createdAt: string;
  reference?: string;
}

export interface TierDefinition {
  id: MembershipTier;
  name: string;
  minimumSpend: number;
  pointMultiplier: number;
  benefits: string[];
}

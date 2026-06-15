export type ReferralRewardStatus = "available" | "used";

export interface ReferralReward {
  id: string;
  title: string;
  description: string;
  code: string;
  value: string;
  status: ReferralRewardStatus;
  createdAt: string;
}

export interface ReferredFriend {
  id: string;
  name: string;
  status: "joined" | "ordered";
  rewardCode?: string;
  joinedAt: string;
}

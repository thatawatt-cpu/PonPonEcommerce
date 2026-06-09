import type { CustomerProfile } from "./customer";

export type LiffProfile = CustomerProfile;

export interface LiffState {
  isLoggedIn: boolean;
  profile: LiffProfile | null;
}

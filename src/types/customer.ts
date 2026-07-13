export interface CustomerProfile {
  displayName: string;
  lineUserId: string;
  pictureUrl: string;
}

export interface PonPonMeResponse {
  id: string;
  userType: "Customer" | string;
  displayName: string;
  email: string | null;
  pictureUrl?: string | null;
  roles: string[];
  wishlistCount?: number | null;
  couponCount?: number | null;
  recentlyViewedCount?: number | null;
}

export interface ShippingInfo {
  customerName: string;
  phone: string;
  address: string;
  note?: string;
}

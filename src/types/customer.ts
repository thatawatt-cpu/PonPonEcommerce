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
}

export interface ShippingInfo {
  customerName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface CustomerProfile {
  displayName: string;
  lineUserId: string;
  pictureUrl: string;
}

export interface ShippingInfo {
  customerName: string;
  phone: string;
  address: string;
  note?: string;
}

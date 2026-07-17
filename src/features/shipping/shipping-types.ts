export interface ShippingRateRequest {
  toName: string;
  toPhone: string;
  toEmail: string;
  toAddress: string;
  toDistrict: string;
  toState: string;
  toProvince: string;
  toPostcode: string;
  parcelName: string;
  weightKg: number;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
}

export interface ShippingRateOption {
  courierCode: string;
  courierName: string;
  serviceName: string;
  serviceCode: string;
  price: number;
  estimateTime?: string | null;
}

export interface CustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
  country: string;
  label: string | null;
  isDefault: boolean;
  fullAddress: string;
}

export interface CustomerAddressCreateRequest {
  recipientName: string;
  phone: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
  country?: string;
  label?: string | null;
  isDefault?: boolean;
}

export interface SavedAddress extends CustomerAddress {
  email: string;
  addressLine2: string;
  label: string;
  customerName: string;
  address: string;
  note: string;
}

export type AddressFormState = Omit<
  CustomerAddressCreateRequest,
  "country" | "isDefault"
> & {
  country: string;
  isDefault: boolean;
};

const SELECTED_ADDRESS_STORAGE_KEY = "ponpon.selectedAddressId";

export const initialAddresses: SavedAddress[] = [
  toSavedAddress({
    id: "office",
    recipientName: "Pon Pon Customer",
    phone: "0895550123",
    email: "",
    addressLine1: "88 อาคาร PonPon ชั้น 12 ถ.พระราม 9",
    addressLine2: "ส่งที่เคาน์เตอร์ประชาสัมพันธ์",
    subdistrict: "ห้วยขวาง",
    district: "ห้วยขวาง",
    province: "กรุงเทพมหานคร",
    postcode: "10310",
    country: "TH",
    label: "บ้าน",
    isDefault: true,
    fullAddress:
      "88 อาคาร PonPon ชั้น 12 ถ.พระราม 9 ส่งที่เคาน์เตอร์ประชาสัมพันธ์ ห้วยขวาง ห้วยขวาง กรุงเทพมหานคร 10310",
  }),
];

export function buildFullAddress(address: {
  addressLine1: string;
  addressLine2?: string | null;
  subdistrict: string;
  district: string;
  province: string;
  postcode: string;
}): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.subdistrict,
    address.district,
    address.province,
    address.postcode,
  ]
    .filter(Boolean)
    .join(" ");
}

export function toSavedAddress(address: CustomerAddress): SavedAddress {
  return {
    ...address,
    email: address.email ?? "",
    addressLine2: address.addressLine2 ?? "",
    country: address.country || "TH",
    label: address.label || "ที่อยู่",
    fullAddress:
      address.fullAddress ||
      buildFullAddress({
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        subdistrict: address.subdistrict,
        district: address.district,
        province: address.province,
        postcode: address.postcode,
      }),
    customerName: address.recipientName,
    address:
      address.fullAddress ||
      buildFullAddress({
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        subdistrict: address.subdistrict,
        district: address.district,
        province: address.province,
        postcode: address.postcode,
      }),
    note: address.addressLine2 ?? "",
  };
}

export function createAddressPayload(
  form: AddressFormState
): CustomerAddressCreateRequest {
  return {
    recipientName: form.recipientName.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || null,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2?.trim() || null,
    subdistrict: form.subdistrict.trim(),
    district: form.district.trim(),
    province: form.province.trim(),
    postcode: form.postcode.trim(),
    country: form.country.trim() || "TH",
    label: form.label?.trim() || null,
    isDefault: form.isDefault,
  };
}

export function getSelectedAddressId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_ADDRESS_STORAGE_KEY);
}

export function setSelectedAddressId(addressId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_ADDRESS_STORAGE_KEY, addressId);
}

export function clearSelectedAddressId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SELECTED_ADDRESS_STORAGE_KEY);
}

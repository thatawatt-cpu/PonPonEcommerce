export interface SavedAddress {
  id: string;
  label: string;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  isDefault: boolean;
}

export const ADDRESS_STORAGE_KEY = "ponpon-addresses";

export const initialAddresses: SavedAddress[] = [
  {
    id: "home",
    label: "บ้าน",
    customerName: "Pon Pon Customer",
    phone: "081-234-5678",
    address:
      "123/45 หมู่บ้านน่ารัก ถ.สุขใจ แขวงป๋องป๋อง เขตยิ้มแย้ม กรุงเทพฯ 10110",
    note: "ฝากวางไว้หน้าบ้านได้เลยค่ะ",
    isDefault: true,
  },
  {
    id: "office",
    label: "ที่ทำงาน",
    customerName: "Pon Pon Customer",
    phone: "089-555-0123",
    address:
      "88 อาคาร PonPon ชั้น 12 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    note: "ส่งที่เคาน์เตอร์ประชาสัมพันธ์",
    isDefault: false,
  },
];

export function loadSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return initialAddresses;

  const stored = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
  if (!stored) return initialAddresses;

  try {
    const parsed = JSON.parse(stored) as SavedAddress[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : initialAddresses;
  } catch {
    window.localStorage.removeItem(ADDRESS_STORAGE_KEY);
    return initialAddresses;
  }
}

export function saveAddresses(addresses: SavedAddress[]) {
  window.localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
}

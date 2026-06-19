export interface ApiProductListItem {
  id: string;
  zortProductId: number;
  name: string;
  baseSku: string;
  sku: string;
  slug: string | null;
  sellPrice: number;
  stock: number;
  availableStock: number;
  imageUrl: string | null;
  categoryName: string | null;
  isActiveFromZort: boolean;
  isVisibleOnLiff: boolean;
  variantCount: number;
  source: string;
  status: string;
}

export interface ApiProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ApiProductVariant {
  id: string;
  zortProductId: number;
  zortVariationId: number | null;
  sku: string;
  variantCode: string;
  barcode: string | null;
  sellPrice: number;
  stock: number;
  availableStock: number;
  unitText: string;
  imageUrl: string | null;
  isActiveFromZort: boolean;
  status: string;
}

export interface ApiProductDetail extends ApiProductListItem {
  productType: number;
  description: string | null;
  barcode: string | null;
  sellVatStatus: number;
  purchasePrice: number;
  purchaseVatStatus: number;
  unitText: string;
  weight: number;
  height: number;
  length: number;
  width: number;
  zortCategoryId: number | null;
  zortSubCategoryId: number | null;
  subCategoryName: string | null;
  zortVariationId: number | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOnHomepage: boolean;
  slug: string | null;
  originalPrice: number | null;
  promotionBadge: string | null;
  highlights: string | null;
  richDescription: string | null;
  lastSyncedAt: string;
  missingFromZortAt: string | null;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
}

export interface ApiCategory {
  id: string;
  zortCategoryId: number;
  name: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface ApiCreateOrderItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface ApiCreateOrderRequest {
  clientRequestId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  customerAddress: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingChannel: string | null;
  shippingAmount: number;
  description: string | null;
  items: ApiCreateOrderItem[];
}

export interface ApiCreateOrderResponse {
  id: string;
  zortOrderId: number;
  number: string;
  status: string;
  paymentStatus: string;
  amount: number;
}

export interface ApiOrderListItem {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  amount: number;
  paymentAmount: number;
  shippingChannel: string | null;
  trackingNo: string | null;
  orderDate: string | null;
}

export interface ApiOrderDetailItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitText: string | null;
  pricePerUnit: number;
  discount: string | null;
  discountAmount: number;
  totalPrice: number;
}

export interface ApiOrderPayment {
  id: string;
  name: string;
  amount: number;
  paymentDateTime: string | null;
}

// ─── Home Slides ─────────────────────────────────────────────────────────────

export interface ApiHomeSlide {
  id: string;
  image: string;
  badge: string | null;
  title: string;
  description: string | null;
  linkUrl: string;
  status: 0 | 1 | 2; // Draft=0, Active=1, Inactive=2
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ApiHomeSlideReorderItem {
  id: string;
  sortOrder: number;
}

export interface ApiHomeSlideReorderRequest {
  slides: ApiHomeSlideReorderItem[];
}

// ─── Flash Sales ─────────────────────────────────────────────────────────────

export interface ApiFlashSaleProduct {
  productId: string;
  salePrice: number;
  productName: string;
  originalPrice: number;
  imageUrl: string | null;
}

export interface ApiFlashSale {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  slots: string[];
  status: "upcoming" | "active" | "ended";
  products: ApiFlashSaleProduct[];
}

export interface ApiFlashSaleCreateRequest {
  name: string;
  startDate: string;
  endDate: string;
  slots: string[];
  products: { productId: string; salePrice: number }[];
}

export interface ApiOrderDetail {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  amount: number;
  vatAmount: number;
  shippingAmount: number;
  paymentAmount: number;
  discountAmount: number;
  shippingChannel: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingPhone: string | null;
  trackingNo: string | null;
  orderDate: string | null;
  shippingDate: string | null;
  reference: string | null;
  description: string | null;
  isCod: boolean;
  currency: string | null;
  items: ApiOrderDetailItem[];
  payments: ApiOrderPayment[];
}

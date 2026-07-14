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
  soldCount: number;
  source: string;
  status: string;
}

export interface ApiShopProductListItem {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  sellPrice: number;
  displayPrice: number;
  displayOriginalPrice: number | null;
  priceSource: "base" | "flash_sale" | string;
  activeFlashSaleId: string | null;
  soldCount: number;
  rating: number | null;
  reviewCount: number;
  badges: string[];
  sku?: string | null;
  baseSku?: string | null;
  availableStock?: number | null;
  stock?: number | null;
  categoryName?: string | null;
  isFeatured?: boolean | null;
  isBestSeller?: boolean | null;
}

export interface ApiShopHomeResponse {
  slides: ApiHomeSlide[];
  flashSale: ApiFlashSale | null;
  featuredProducts: ApiShopProductListItem[];
  availableCoupons: ApiCouponListItem[];
}

export interface ApiCustomerWishlistResponse {
  productIds: string[];
  products: ApiShopProductListItem[];
}

export interface ApiRecentlyViewedItem {
  productId: string;
  viewedAtUtc: string;
}

export interface ApiRecentlyViewedResponse {
  items: ApiRecentlyViewedItem[];
  products: ApiShopProductListItem[];
}

export interface ApiResolvedProductPrice {
  displayPrice: number;
  displayOriginalPrice: number | null;
  priceSource: "base" | "flash_sale" | string;
  activeFlashSaleId: string | null;
}

export interface ApiShopProductDetailResponse {
  product: ApiProductDetail;
  availableCoupons: ApiCouponListItem[];
  relatedProducts: ApiShopProductListItem[];
  resolvedPrice: ApiResolvedProductPrice;
}

export interface ApiProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ApiProductVariantOption {
  name: string;
  value: string;
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
  status: string | number;
  options: ApiProductVariantOption[];
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
  displayPrice?: number | null;
  displayOriginalPrice?: number | null;
  priceSource?: "base" | "flash_sale" | string | null;
  activeFlashSaleId?: string | null;
  promotionBadge: string | null;
  highlights: string | null;
  richDescription: string | null;
  lastSyncedAt: string;
  missingFromZortAt: string | null;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  options: ApiProductVariantOption[];
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
  quoteId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  customerAddress: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingChannel: string | null;
  shippingAmount: number;
  paymentMethod: string;
  couponCodes?: string[];
  couponCode?: string;
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
  shippingAmount: number;
  discountAmount: number;
  paymentExpiresAt: string;
}

export type ApiSubmitPaymentRequest =
  | {
      method: "promptpay";
    }
  | {
      method: "mobile_banking";
      bankType: ApiMobileBankingType;
      returnUri: string;
    }
  | {
      method: "card";
      tokenId: string;
      returnUri: string;
    };

export interface ApiSubmitOrderRequest {
  order: Omit<
    ApiCreateOrderRequest,
    "paymentMethod" | "shippingAmount" | "couponCodes"
  > & {
    paymentMethod: "promptpay" | "mobile_banking" | "card";
    couponCode?: string | null;
    couponCodes?: string[];
  };
  payment: ApiSubmitPaymentRequest;
}

export interface ApiSubmitOrderResponse {
  order?: ApiCreateOrderResponse;
  payment?:
    | ApiPromptPayPaymentResponse
    | ApiMobileBankingPaymentResponse
    | ApiCreditCardPaymentResponse
    | null;
}

export interface ApiPricingPreviewRequest {
  customerEmail: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingChannel: string | null;
  couponCodes?: string[];
  couponCode?: string;
  items: ApiCreateOrderItem[];
}

export interface ApiPricingPreviewLine {
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  discountAmount?: number;
  [key: string]: unknown;
}

export interface ApiAppliedCoupon {
  couponId: string;
  code: string;
  name: string;
  type: "fixed" | "percentage" | "free_shipping" | string;
  discountAmount: number;
}

export interface ApiCouponListItem {
  id: string;
  code: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  type?: "fixed" | "percentage" | "free_shipping" | string | null;
  discountType?: "fixed" | "percentage" | "free_shipping" | string | null;
  discountAmount?: number | null;
  discountValue?: number | null;
  value?: number | string | null;
  maxDiscountAmount?: number | null;
  maximumDiscount?: number | null;
  minimumSpend?: number | string | null;
  minimumSubtotal?: number | null;
  minimumOrderAmount?: number | null;
  minOrderAmount?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
  expiresAt?: string | null;
  remainingTotalUses?: number | null;
  remainingCustomerUses?: number | null;
  isClaimed?: boolean | null;
  canClaim?: boolean | null;
  canUse?: boolean | null;
  isExpired?: boolean | null;
  isQuotaExhausted?: boolean | null;
  unavailableReasonCode?: string | null;
  unavailableReason?: string | null;
  claimedAtUtc?: string | null;
  scopeLabels?: string[];
  conditionLabels?: string[];
  status?: string | null;
  isActive?: boolean | null;
  usageCount?: number | null;
  usedCount?: number | null;
  [key: string]: unknown;
}

export interface ApiPricingAdjustment {
  type?: string;
  label?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface ApiPricingPreviewPackage {
  boxCode: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  weightKg: number;
  itemCount: number;
}

export interface ApiPricingPreviewResponse {
  quoteId?: string | null;
  expiresAt?: string | null;
  isFinal?: boolean;
  calculationStatus?: "partial" | "final" | "manual_shipping_required" | string;
  shippingFinalized?: boolean;
  packages?: ApiPricingPreviewPackage[];
  lines: ApiPricingPreviewLine[];
  itemSubtotal: number;
  shippingAmount: number;
  shippingDiscountAmount: number;
  couponDiscountAmount: number;
  promotionDiscountAmount: number;
  orderDiscountAmount: number;
  vatAmount: number;
  grandTotal: number;
  appliedCoupons: ApiAppliedCoupon[];
  adjustments: ApiPricingAdjustment[];
}

export interface ApiOrderPreviewItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  reviewId?: string | null;
  isReviewed?: boolean;
  sku: string;
  name: string;
  quantity: number;
  totalPrice: number;
  imageUrl: string | null;
  options: ApiProductVariantOption[];
}

export interface ApiOrderListItem {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  receivedAtUtc?: string | null;
  omiseRefundStatus?: string | null;
  amount: number;
  paymentAmount: number;
  shippingChannel: string | null;
  trackingNo: string | null;
  orderDate: string | null;
  itemsCount: number;
  itemsPreview: ApiOrderPreviewItem[];
}

export interface ApiOrderListResponse {
  items: ApiOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface ApiOrderDetailItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  reviewId?: string | null;
  isReviewed?: boolean;
  sku: string;
  name: string;
  quantity: number;
  unitText: string | null;
  pricePerUnit: number;
  discount: string | null;
  discountAmount: number;
  totalPrice: number;
  imageUrl: string | null;
  options: ApiProductVariantOption[];
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
  receivedAtUtc?: string | null;
  omiseRefundStatus?: string | null;
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

// ─── Payments ────────────────────────────────────────────────────────────────

export type ApiMobileBankingType =
  | "mobile_banking_kbank"
  | "mobile_banking_scb"
  | "mobile_banking_bbl"
  | "mobile_banking_ktb"
  | "mobile_banking_bay";

export type ApiPaymentChargeStatus =
  | "pending"
  | "successful"
  | "failed"
  | "expired";

export interface ApiPromptPayPaymentRequest {
  orderId: string;
}

export interface ApiOmiseConfigResponse {
  publicKey: string;
}

export interface ApiPromptPayPaymentResponse {
  chargeId: string;
  qrCodeUrl: string;
  amount: number;
  currency: "THB";
  expiresAt: string;
}

export interface ApiMobileBankingPaymentRequest {
  orderId: string;
  bankType: ApiMobileBankingType;
  returnUri: string;
}

export interface ApiMobileBankingPaymentResponse {
  chargeId: string;
  status: ApiPaymentChargeStatus;
  authorizeUri: string;
}

export interface ApiCreditCardPaymentRequest {
  orderId: string;
  tokenId: string;
  amount: number;
  currency: "THB";
  description: string;
  returnUri: string;
}

export interface ApiCreditCardPaymentResponse {
  chargeId: string;
  status: ApiPaymentChargeStatus;
  authorizeUri: string | null;
}

export interface ApiPaymentStatusResponse {
  chargeId: string;
  status: ApiPaymentChargeStatus;
  paid: boolean;
  paidAt: string | null;
  failureCode: string | null;
  failureMessage: string | null;
}

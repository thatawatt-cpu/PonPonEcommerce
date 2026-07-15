"use client";

import type React from "react";
import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Play,
  QrCode,
  RotateCcw,
  Star,
  Store,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/product/product-image";
import {
  fetchOrderById,
  cancelOrder,
  confirmOrderReceived,
  createReturnRequest,
} from "@/features/orders/order-api";
import {
  createOrderItemReview,
  updateReview,
} from "@/features/reviews/review-api";
import { isStoredOrderPaid } from "@/features/payments/payment-api";
import {
  formatShippingLine,
  getCarrierName,
} from "@/features/shipping/shipping-utils";
import { buildTimeline } from "@/features/orders/order-utils";
import {
  getManualRefundLabel,
  getReturnRefundText,
  normalizeOmiseRefundStatus,
} from "@/features/orders/refund-status";
import { dispatchShopNotificationToast } from "@/lib/shop-notification-toast";
import { openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";
import { formatBaht, formatDateTime } from "@/lib/format";
import type {
  ApiOrderDetail,
  ApiOrderDetailItem,
  ApiProductDetail,
  ApiProductListItem,
  ApiProductVariantOption,
} from "@/types/api";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { CartItem } from "@/types/cart";
import type { ProductReview } from "@/types/review";

const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "waiting"];
const REFUNDABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  "paid",
  "partial_payment",
  "excess_payment",
];
const CANCEL_REASON_OPTIONS = [
  "ต้องการเปลี่ยนที่อยู่หรือข้อมูลจัดส่ง",
  "สั่งสินค้าผิดหรือต้องการสั่งใหม่",
  "ไม่ต้องการสินค้าแล้ว",
  "อื่น ๆ",
];
const RETURN_REASON_OPTIONS = [
  "สินค้าเสียหายหรือใช้งานไม่ได้",
  "ได้รับสินค้าไม่ตรงกับที่สั่ง",
  "สินค้าไม่ครบหรือมีชิ้นส่วนหาย",
  "เปลี่ยนใจหรือสินค้าไม่เหมาะสม",
  "อื่น ๆ",
];

type OrderRefundFields = {
  omiseRefundStatus?: unknown;
  OmiseRefundStatus?: unknown;
  omise_refund_status?: unknown;
  refundStatus?: unknown;
  RefundStatus?: unknown;
  manualRefundStatus?: unknown;
  ManualRefundStatus?: unknown;
  returnRequestStatus?: unknown;
  ReturnRequestStatus?: unknown;
  return_request_status?: unknown;
};

function getApiOmiseRefundStatus(order: ApiOrderDetail): unknown {
  const source = order as ApiOrderDetail & OrderRefundFields;
  return (
    source.omiseRefundStatus ??
    source.OmiseRefundStatus ??
    source.omise_refund_status ??
    source.refundStatus ??
    source.RefundStatus ??
    source.manualRefundStatus ??
    source.ManualRefundStatus
  );
}

function getApiReturnRequestStatus(order: ApiOrderDetail): unknown {
  const source = order as ApiOrderDetail & OrderRefundFields;
  return (
    source.returnRequestStatus ??
    source.ReturnRequestStatus ??
    source.return_request_status
  );
}

const MAX_RETURN_IMAGES = 5;
const MAX_RETURN_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_RETURN_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const REVIEW_MEDIA_SLOTS = 5;
const MAX_REVIEW_IMAGES = 5;
const MAX_REVIEW_VIDEOS = 3;
const MAX_REVIEW_VIDEO_DURATION_SEC = 60;
const ALLOWED_REVIEW_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

interface ReturnImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ReviewFile {
  id: string;
  file: File;
  previewUrl: string;
  thumbnailUrl: string | null;
  type: "image" | "video";
  durationSec: number | null;
}

interface ReviewUploadStatus {
  phase: "uploading" | "saving";
  current: number;
  total: number;
  fileName?: string;
  fileType?: "image" | "video";
}

interface ReviewTarget {
  item: ApiOrderDetailItem;
  existingReview?: ProductReview | null;
}

interface ReviewVideoPreview {
  src: string;
  poster: string | null;
  name: string;
}

function mapStatus(status: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    "0": "pending",
    "1": "success",
    "2": "voided",
    "3": "waiting",
    "4": "returned",
    "5": "packed",
    "6": "shipping",
    "7": "failed_shipment",
    pending: "pending",
    success: "success",
    voided: "voided",
    cancelled: "voided",
    canceled: "voided",
    waiting: "waiting",
    returned: "returned",
    packed: "packed",
    shipping: "shipping",
    failed_shipment: "failed_shipment",
    "failed shipment": "failed_shipment",
  };
  return map[String(status).toLowerCase()] ?? "pending";
}

function normalizeStatusValue(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function mapPaymentStatus(status: unknown): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    "0": "pending",
    "1": "paid",
    "2": "voided",
    "3": "partial_payment",
    "4": "excess_payment",
    pending: "pending",
    unpaid: "pending",
    awaiting_payment: "pending",
    waiting_payment: "pending",
    paid: "paid",
    success: "paid",
    successful: "paid",
    completed: "paid",
    fully_paid: "paid",
    voided: "voided",
    cancelled: "voided",
    canceled: "voided",
    partial_payment: "partial_payment",
    partial: "partial_payment",
    excess_payment: "excess_payment",
    overpaid: "excess_payment",
  };
  return map[normalizeStatusValue(status)] ?? "pending";
}

function getApiPaidAmount(api: ApiOrderDetail): number {
  const paymentAmount = Number(api.paymentAmount);
  const paymentsAmount =
    api.payments?.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0) ?? 0;

  return Math.max(
    Number.isFinite(paymentAmount) ? paymentAmount : 0,
    paymentsAmount
  );
}

function getPaymentStatusFromAmount(api: ApiOrderDetail): PaymentStatus | null {
  const paidAmount = getApiPaidAmount(api);
  if (paidAmount <= 0) return null;

  const orderAmount = Number(api.amount);
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) return "paid";

  const tolerance = 0.01;
  if (paidAmount + tolerance < orderAmount) return "partial_payment";
  if (paidAmount > orderAmount + tolerance) return "excess_payment";
  return "paid";
}

function resolvePaymentStatus(api: ApiOrderDetail): PaymentStatus {
  const status = mapPaymentStatus(api.paymentStatus);
  const amountStatus = getPaymentStatusFromAmount(api);
  const locallyPaid = isStoredOrderPaid({
    orderId: api.id,
    orderNo: api.number,
  });

  if (!amountStatus || status === "voided" || status === "excess_payment") {
    return locallyPaid && status === "pending" ? "paid" : status;
  }

  if (status === "pending" || status === "partial_payment") {
    return locallyPaid ? "paid" : amountStatus;
  }

  return status;
}

function resolveOrderStatus(
  api: ApiOrderDetail,
  paymentStatus: PaymentStatus
): OrderStatus {
  const orderStatus = mapStatus(api.status);
  const hasReceivedPayment =
    paymentStatus === "paid" ||
    paymentStatus === "partial_payment" ||
    paymentStatus === "excess_payment";

  if (orderStatus === "pending" && hasReceivedPayment) {
    return "waiting";
  }

  return orderStatus;
}

interface OrderItemFallback {
  imageUrl: string | null;
  options: ApiProductVariantOption[];
}

function getPrimaryProductImage(product: ApiProductDetail): string | null {
  const sortedImages =
    product.images?.slice().sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  return (
    sortedImages.find((image) => image.isPrimary)?.url ??
    sortedImages[0]?.url ??
    product.imageUrl ??
    null
  );
}

function getBaseSku(sku: string): string {
  return sku.split("-")[0] || sku;
}

function shouldHydrateOrderItem(item: ApiOrderDetailItem): boolean {
  return !item.imageUrl || (item.options?.length ?? 0) === 0;
}

function putFallback(
  lookup: Map<string, OrderItemFallback>,
  key: string | null | undefined,
  fallback: OrderItemFallback
) {
  if (!key) return;
  lookup.set(key, fallback);
}

async function fetchProductDetail(
  productId: string
): Promise<ApiProductDetail | null> {
  const response = await fetch(`/api/products/${productId}`, {
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as ApiProductDetail;
}

async function fetchProductList(): Promise<ApiProductListItem[]> {
  const response = await fetch("/api/products?page=1&pageSize=100", {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as
    | ApiProductListItem[]
    | { items?: ApiProductListItem[] };
  return Array.isArray(data) ? data : data.items ?? [];
}

async function buildOrderItemFallbacks(
  items: ApiOrderDetailItem[]
): Promise<Map<string, OrderItemFallback>> {
  const missingItems = items.filter(shouldHydrateOrderItem);
  const lookup = new Map<string, OrderItemFallback>();

  if (missingItems.length === 0) return lookup;

  const productIds = [
    ...new Set(
      missingItems
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  let products = (
    await Promise.all(productIds.map((productId) => fetchProductDetail(productId)))
  ).filter((product): product is ApiProductDetail => Boolean(product));

  const foundBaseSkus = new Set(products.map((product) => product.baseSku));
  const missingBaseSkus = new Set(
    missingItems
      .map((item) => getBaseSku(item.sku))
      .filter((baseSku) => !foundBaseSkus.has(baseSku))
  );

  if (missingBaseSkus.size > 0) {
    const productList = await fetchProductList();
    const fallbackDetails = await Promise.all(
      productList
        .filter((product) => missingBaseSkus.has(product.baseSku))
        .map((product) => fetchProductDetail(product.id))
    );

    products = products.concat(
      fallbackDetails.filter(
        (product): product is ApiProductDetail => Boolean(product)
      )
    );
  }

  for (const product of products) {
    const productImage = getPrimaryProductImage(product);
    const productFallback = {
      imageUrl: productImage,
      options: product.options ?? [],
    };

    putFallback(lookup, product.id, productFallback);
    putFallback(lookup, product.baseSku, productFallback);
    putFallback(lookup, product.sku, productFallback);

    for (const variant of product.variants ?? []) {
      const variantFallback = {
        imageUrl: variant.imageUrl ?? productImage,
        options: variant.options ?? product.options ?? [],
      };

      putFallback(lookup, variant.id, variantFallback);
      putFallback(lookup, variant.sku, variantFallback);
      putFallback(lookup, variant.variantCode, variantFallback);
    }
  }

  return lookup;
}

function getOrderItemFallback(
  item: ApiOrderDetailItem,
  lookup: Map<string, OrderItemFallback>
): OrderItemFallback | undefined {
  return (
    lookup.get(item.variantId ?? "") ??
    lookup.get(item.sku) ??
    lookup.get(item.productId ?? "") ??
    lookup.get(getBaseSku(item.sku))
  );
}

function mapApiOrderToOrder(
  api: ApiOrderDetail,
  fallbackLookup = new Map<string, OrderItemFallback>()
): Order {
  const paymentStatus = resolvePaymentStatus(api);
  const orderStatus = resolveOrderStatus(api, paymentStatus);
  const items: CartItem[] = api.items.map((item) => {
    const fallback = getOrderItemFallback(item, fallbackLookup);
    const options =
      item.options && item.options.length > 0
        ? item.options
        : fallback?.options ?? [];

    return {
      productId: item.productId ?? item.id,
      variantId: item.variantId,
      name: item.name,
      price: item.pricePerUnit,
      imageUrl: item.imageUrl ?? fallback?.imageUrl ?? "",
      emoji: "📦",
      quantity: Math.round(item.quantity),
      selectedOptions: Object.fromEntries(
        options.map((option) => [option.name, option.value])
      ),
    };
  });

  return {
    id: api.id,
    orderNo: api.number,
    customerName: api.shippingName ?? "",
    phone: api.shippingPhone ?? "",
    address: api.shippingAddress ?? "",
    items,
    subtotal: api.amount - api.shippingAmount + api.discountAmount,
    shippingFee: api.shippingAmount,
    discountAmount: api.discountAmount,
    total: api.amount,
    paymentMethod: api.isCod ? "cod" : "promptpay",
    paymentStatus,
    orderStatus,
    timeline: buildTimeline(orderStatus),
    createdAt: api.orderDate ?? new Date().toISOString(),
  };
}

function getStatusTitle(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "รอชำระเงินเพื่อยืนยันออเดอร์",
    waiting: "ร้านกำลังเตรียมสินค้า",
    packed: "แพ็กสินค้าแล้ว",
    shipping: "กำลังจัดส่ง",
    success: "คำสั่งซื้อของคุณสำเร็จแล้ว",
    voided: "ออเดอร์นี้ถูกยกเลิก",
    returned: "มีการคืนสินค้า",
    failed_shipment: "จัดส่งไม่สำเร็จ",
  };
  return map[status];
}

function getStatusDescription(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "กรุณาชำระเงินเพื่อให้ร้านเริ่มเตรียมสินค้า",
    waiting: "ร้านได้รับยอดชำระแล้วและกำลังเตรียมสินค้า",
    packed: "ร้านแพ็กสินค้าเรียบร้อยแล้ว",
    shipping: "พัสดุออกเดินทางแล้ว โปรดติดตามเลขพัสดุ",
    success: "ขอบคุณที่อุดหนุน PonPon Official",
    voided: "หากต้องการสั่งซื้ออีกครั้ง สามารถเลือกสินค้าใหม่ได้",
    returned: "โปรดติดต่อร้านหากต้องการข้อมูลเพิ่มเติม",
    failed_shipment: "โปรดติดต่อร้านเพื่อช่วยตรวจสอบการจัดส่ง",
  };
  return map[status];
}

function getLatestTimelineText(order: Order): string {
  const active =
    order.timeline.find((step) => step.state === "active") ??
    [...order.timeline].reverse().find((step) => step.state === "completed");
  return active?.label ?? getStatusTitle(order.orderStatus);
}

function formatOptions(options: Record<string, string> | undefined): string {
  if (!options) return "";
  return Object.entries(options)
    .map(([name, value]) => `${name}: ${value}`)
    .join(" · ");
}

function getOrderItemReviewId(item: ApiOrderDetailItem): string | null {
  const source = item as ApiOrderDetailItem & {
    reviewId?: string | null;
    isReviewed?: boolean | null;
  };

  if (source.isReviewed !== true) return null;
  return source.reviewId?.trim() || null;
}

function getExistingReview(item: ApiOrderDetailItem): ProductReview | null {
  const source = item as ApiOrderDetailItem & {
    review?: ProductReview | null;
    reviewId?: string | null;
    reviewRating?: number | null;
    reviewComment?: string | null;
    isReviewed?: boolean | null;
  };
  const reviewId = getOrderItemReviewId(item);

  if (!reviewId) return null;
  if (source.review?.id === reviewId) return source.review;

  return {
    id: reviewId,
    orderItemId: item.id,
    productId: item.productId,
    variantId: item.variantId,
    rating: Number(source.reviewRating ?? 0),
    comment: source.reviewComment ?? "",
    media: [],
    createdAt: new Date().toISOString(),
  };
}

function isOrderDetailItemReviewed(item: ApiOrderDetailItem): boolean {
  const source = item as ApiOrderDetailItem & {
    reviewId?: string | null;
    isReviewed?: boolean | null;
  };

  if (source.isReviewed === false) return false;
  return Boolean(source.isReviewed === true || source.reviewId?.trim());
}

function hasPendingOrderReview(order: ApiOrderDetail): boolean {
  if (!order.receivedAtUtc) return false;
  return order.items.some((item) => !isOrderDetailItemReviewed(item));
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.ceil(video.duration) : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("อ่านความยาววิดีโอไม่สำเร็จ"));
    };
    video.src = url;
  });
}

function createVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const cleanup = () => URL.revokeObjectURL(sourceUrl);
    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to generate video thumbnail"));
    };
    video.onloadeddata = () => {
      const seekTo = Math.min(0.5, Math.max(video.duration / 2, 0));
      if (seekTo === 0) {
        video.onseeked?.(new Event("seeked"));
        return;
      }
      video.currentTime = seekTo;
    };
    video.onseeked = () => {
      const width = Math.min(video.videoWidth || 240, 360);
      const height = Math.max(
        1,
        Math.round(width / Math.max(video.videoWidth / (video.videoHeight || 1), 1))
      );
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
      cleanup();
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    video.src = sourceUrl;
  });
}

function OrderProductCard({
  apiOrder,
  order,
  onReviewItem,
}: {
  apiOrder: ApiOrderDetail;
  order: Order;
  onReviewItem: (target: ReviewTarget) => void;
}) {
  return (
    <Card className="overflow-hidden bg-white">
      <div className="flex items-center gap-2 border-b border-black/[0.05] px-4 py-3">
        <Store className="h-4 w-4 text-ink-soft" />
        <p className="text-sm font-extrabold text-ink">PonPon Official</p>
        <ChevronRight className="h-4 w-4 text-ink-soft" />
      </div>

      <div className="divide-y divide-black/[0.05]">
        {order.items.map((item, index) => {
          const apiItem = apiOrder.items[index];
          const existingReview = apiItem ? getExistingReview(apiItem) : null;
          const canReview =
            Boolean(apiOrder.receivedAtUtc) &&
            Boolean(apiItem) &&
            !isOrderDetailItemReviewed(apiItem!);
          const optionText = formatOptions(item.selectedOptions);
          return (
            <div key={`${item.productId}-${optionText}`} className="flex gap-3 px-4 py-3">
              <ProductImage
                imageUrl={item.imageUrl || undefined}
                emoji={item.emoji}
                size="sm"
                className="h-20 w-20 shrink-0 rounded-xl bg-surface-muted"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-ink">
                    {item.name}
                  </p>
                  <span className="shrink-0 text-xs font-bold text-ink-soft">
                    x{item.quantity}
                  </span>
                </div>
                {optionText && (
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink-soft">
                    {optionText}
                  </p>
                )}
                <p className="mt-3 text-right text-sm font-extrabold text-brand">
                  {formatBaht(item.price * item.quantity)}
                </p>
                {canReview && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onReviewItem({
                          item: apiItem!,
                          existingReview,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand transition active:scale-95"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {existingReview ? "แก้ไขรีวิว" : "เขียนรีวิว"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-black/[0.05] px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-soft">
            รวมค่าสินค้า
          </span>
          <span className="font-extrabold text-ink">
            {formatBaht(order.subtotal)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-soft">ค่าจัดส่ง</span>
          <span className="font-bold text-ink">{formatBaht(order.shippingFee)}</span>
        </div>
        {order.discountAmount ? (
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-soft">ส่วนลด</span>
            <span className="font-bold text-success">
              -{formatBaht(order.discountAmount)}
            </span>
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-black/[0.05] pt-3">
          <span className="text-sm font-semibold text-ink">รวมคำสั่งซื้อ:</span>
          <span className="text-lg font-extrabold text-brand">
            {formatBaht(order.total)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function OrderMetaCard({ apiOrder, order }: { apiOrder: ApiOrderDetail; order: Order }) {
  const [copied, setCopied] = useState(false);

  const copyOrderNo = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm font-bold text-ink">หมายเลขคำสั่งซื้อ</span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-soft">
            {order.orderNo}
          </span>
          <button
            type="button"
            onClick={copyOrderNo}
            className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-xs font-bold text-ink"
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        </div>
      </div>

      <div className="divide-y divide-black/[0.05] border-t border-black/[0.05] px-4 text-sm">
        <div className="flex justify-between gap-4 py-3">
          <span className="text-ink-soft">ชำระผ่าน</span>
          <span className="text-right font-semibold text-ink">
            {order.paymentMethod === "cod" ? "เก็บเงินปลายทาง" : "PromptPay"}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <span className="text-ink-soft">สถานะชำระเงิน</span>
          <span className="text-right font-semibold text-ink">
            {order.paymentStatus === "pending"
              ? "รอชำระเงิน"
              : order.paymentStatus === "paid"
                ? "ชำระแล้ว"
                : order.paymentStatus === "partial_payment"
                  ? "ชำระบางส่วน"
                  : order.paymentStatus === "excess_payment"
                    ? "ชำระเกิน"
                    : "ยกเลิกการชำระ"}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <span className="text-ink-soft">เวลาที่สั่งซื้อ</span>
          <span className="text-right font-semibold text-ink">
            {apiOrder.orderDate ? formatDateTime(apiOrder.orderDate) : "-"}
          </span>
        </div>
        {apiOrder.shippingDate && (
          <div className="flex justify-between gap-4 py-3">
            <span className="text-ink-soft">เวลาที่จัดส่งสินค้า</span>
            <span className="text-right font-semibold text-ink">
              {formatDateTime(apiOrder.shippingDate)}
            </span>
          </div>
        )}
        {apiOrder.trackingNo && (
          <div className="flex justify-between gap-4 py-3">
            <span className="text-ink-soft">เลขพัสดุ</span>
            <span className="text-right font-semibold text-ink">
              {apiOrder.trackingNo}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4 py-3">
          <span className="text-ink-soft">ขนส่ง</span>
          <span className="text-right font-semibold text-ink">
            {getCarrierName(apiOrder.shippingChannel)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function OrderTrackingPage({
  params,
  forceReview = false,
}: {
  params: Promise<{ orderNo: string }>;
  forceReview?: boolean;
}) {
  const { orderNo: id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenReview = forceReview || searchParams.get("review") === "1";
  const requestedReviewRating = Number(searchParams.get("rating"));
  const initialReviewRating =
    Number.isInteger(requestedReviewRating) &&
    requestedReviewRating >= 1 &&
    requestedReviewRating <= 5
      ? requestedReviewRating
      : undefined;
  const autoReviewOpenedRef = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [apiOrder, setApiOrder] = useState<ApiOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonDetail, setCancelReasonDetail] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [confirmReceiveError, setConfirmReceiveError] = useState<string | null>(
    null
  );
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonDetail, setReturnReasonDetail] = useState("");
  const [returnImages, setReturnImages] = useState<ReturnImage[]>([]);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnInfo, setReturnInfo] = useState<string | null>(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewIsAnonymous, setReviewIsAnonymous] = useState(false);
  const [reviewFiles, setReviewFiles] = useState<ReviewFile[]>([]);
  const [reviewVideoPreview, setReviewVideoPreview] =
    useState<ReviewVideoPreview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewInfo, setReviewInfo] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewUploadStatus, setReviewUploadStatus] =
    useState<ReviewUploadStatus | null>(null);
  const [reviewPreparingMediaText, setReviewPreparingMediaText] =
    useState<string | null>(null);

  useEffect(() => {
    fetchOrderById(id)
      .then(async (data) => {
        const fallbackLookup = await buildOrderItemFallbacks(data.items);
        setApiOrder(data);
        setOrder(mapApiOrderToOrder(data, fallbackLookup));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "โหลดออเดอร์ไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelConfirm = async () => {
    if (cancelling) return;
    if (!cancelReason) {
      setCancelError("กรุณาเลือกเหตุผลในการยกเลิกออเดอร์");
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const cancelResult = await cancelOrder(id, {
        reason: cancelReason,
        detail: cancelReasonDetail.trim() || undefined,
      });
      setShowCancelDialog(false);

      const shouldHandleRefund = order
        ? REFUNDABLE_PAYMENT_STATUSES.includes(order.paymentStatus)
        : false;
      const refreshedOrder = await fetchOrderById(id).catch(() => null);
      const refundStatus = shouldHandleRefund
        ? normalizeOmiseRefundStatus(
            refreshedOrder?.omiseRefundStatus ??
              cancelResult.omiseRefundStatus ??
              cancelResult.order?.omiseRefundStatus
          )
        : null;

      if (refundStatus) {
        if (refreshedOrder) {
          const fallbackLookup = await buildOrderItemFallbacks(
            refreshedOrder.items
          );
          setApiOrder({
            ...refreshedOrder,
            omiseRefundStatus: refundStatus,
          });
          setOrder(mapApiOrderToOrder(refreshedOrder, fallbackLookup));
        } else {
          setApiOrder((prev) =>
            prev ? { ...prev, omiseRefundStatus: refundStatus } : prev
          );
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  orderStatus: "voided",
                  timeline: buildTimeline("voided"),
                }
              : prev
          );
        }
        dispatchShopNotificationToast({
          type: "refund_requested",
          orderId: id,
          orderNumber: order?.orderNo,
          message:
            "ได้รับคำขอคืนเงินแล้ว ร้านค้าจะตรวจสอบและดำเนินการคืนเงินให้ภายหลัง",
          createdAtUtc: new Date().toISOString(),
        });
        setCancelling(false);
        return;
      }

      if (refreshedOrder) {
        const fallbackLookup = await buildOrderItemFallbacks(
          refreshedOrder.items
        );
        setApiOrder({
          ...refreshedOrder,
          omiseRefundStatus: null,
        });
        setOrder(mapApiOrderToOrder(refreshedOrder, fallbackLookup));
      }
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: "voided",
              timeline: buildTimeline("voided"),
            }
              : prev
      );
      dispatchShopNotificationToast({
        type: "order_cancelled",
        orderId: id,
        orderNumber: order?.orderNo,
        message: "ยกเลิกคำสั่งซื้อของคุณเรียบร้อยแล้ว",
        createdAtUtc: new Date().toISOString(),
      });
      setCancelling(false);
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "ยกเลิกออเดอร์ไม่สำเร็จ"
      );
      setCancelling(false);
    }
  };

  const handleOpenCancel = () => {
    setCancelReason("");
    setCancelReasonDetail("");
    setCancelError(null);
    setShowCancelDialog(true);
  };

  const handleConfirmReceived = async () => {
    if (confirmingReceived || !apiOrder) return;

    setConfirmingReceived(true);
    setConfirmReceiveError(null);

    try {
      await confirmOrderReceived(apiOrder.id);
      const refreshedOrder = await fetchOrderById(id);
      const fallbackLookup = await buildOrderItemFallbacks(refreshedOrder.items);
      setApiOrder(refreshedOrder);
      setOrder(mapApiOrderToOrder(refreshedOrder, fallbackLookup));
    } catch (error) {
      setConfirmReceiveError(
        error instanceof Error
          ? error.message
          : "ยืนยันรับสินค้าไม่สำเร็จ กรุณาลองใหม่"
      );
    } finally {
      setConfirmingReceived(false);
    }
  };

  const handleOpenReview = (
    target: ReviewTarget,
    initialRating?: number
  ) => {
    setReviewTarget(target);
    setReviewRating(target.existingReview?.rating ?? initialRating ?? 0);
    setReviewComment(target.existingReview?.comment ?? "");
    setReviewIsAnonymous(target.existingReview?.isAnonymous ?? false);
    setReviewFiles([]);
    setReviewVideoPreview(null);
    setReviewError(null);
    setReviewInfo(null);
    setReviewUploadStatus(null);
    setReviewPreparingMediaText(null);
  };

  useEffect(() => {
    if (!shouldOpenReview || autoReviewOpenedRef.current || !apiOrder || !order) {
      return;
    }
    if (!apiOrder.receivedAtUtc) return;
    if (!hasPendingOrderReview(apiOrder)) return;

    const targetItem =
      apiOrder.items.find((item) => !isOrderDetailItemReviewed(item)) ??
      apiOrder.items[0];
    if (!targetItem) return;

    autoReviewOpenedRef.current = true;
    void Promise.resolve().then(() => {
      handleOpenReview(
        {
          item: targetItem,
          existingReview: getExistingReview(targetItem),
        },
        initialReviewRating
      );
    });
  }, [apiOrder, initialReviewRating, order, shouldOpenReview]);

  const handleCloseReview = () => {
    if (reviewSubmitting) return;
    reviewFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    setReviewTarget(null);
    setReviewFiles([]);
    setReviewVideoPreview(null);
    setReviewError(null);
    setReviewInfo(null);
    setReviewUploadStatus(null);
    setReviewPreparingMediaText(null);
    if (forceReview) {
      router.replace("/orders");
    }
  };

  const handleReviewFilesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    setReviewError(null);
    setReviewInfo(null);

    if (selectedFiles.length === 0) return;
    if (!reviewTarget?.item.id) {
      setReviewError("ไม่พบรายการสินค้าที่ต้องการรีวิว");
      return;
    }
    const selectedHasVideo = selectedFiles.some((file) =>
      file.type.startsWith("video/")
    );
    setReviewPreparingMediaText(
      selectedHasVideo ? "กำลังตรวจสอบวิดีโอ..." : "กำลังเตรียมรูป..."
    );
    const existingMediaCount = reviewTarget?.existingReview?.media?.length ?? 0;
    if (existingMediaCount + reviewFiles.length >= REVIEW_MEDIA_SLOTS) {
      setReviewPreparingMediaText(null);
      setReviewError(`แนบสื่อได้สูงสุด ${REVIEW_MEDIA_SLOTS} ไฟล์`);
      return;
    }

    const unsupportedFile = selectedFiles.find(
      (file) => !ALLOWED_REVIEW_MEDIA_TYPES.includes(file.type)
    );
    if (unsupportedFile) {
      setReviewPreparingMediaText(null);
      setReviewError("รองรับเฉพาะ JPEG, PNG, WebP, MP4, MOV และ WebM");
      return;
    }

    const existingImages =
      reviewTarget?.existingReview?.media?.filter((media) => media.type === "image")
        .length ?? 0;
    const existingVideos =
      reviewTarget?.existingReview?.media?.filter((media) => media.type === "video")
        .length ?? 0;
    const currentImages =
      existingImages + reviewFiles.filter((file) => file.type === "image").length;
    const currentVideos =
      existingVideos + reviewFiles.filter((file) => file.type === "video").length;
    const nextFiles: ReviewFile[] = [];

    for (const file of selectedFiles) {
      if (existingMediaCount + reviewFiles.length + nextFiles.length >= REVIEW_MEDIA_SLOTS) break;

      const type = file.type.startsWith("video/") ? "video" : "image";
      const nextImageCount =
        currentImages + nextFiles.filter((item) => item.type === "image").length;
      const nextVideoCount =
        currentVideos + nextFiles.filter((item) => item.type === "video").length;

      if (type === "image" && nextImageCount >= MAX_REVIEW_IMAGES) {
        setReviewInfo(`รูปภาพสูงสุด ${MAX_REVIEW_IMAGES} รูป`);
        continue;
      }
      if (type === "video" && nextVideoCount >= MAX_REVIEW_VIDEOS) {
        setReviewInfo(`วิดีโอสูงสุด ${MAX_REVIEW_VIDEOS} คลิป`);
        continue;
      }

      let durationSec: number | null = null;
      let thumbnailUrl: string | null = null;
      if (type === "video") {
        try {
          durationSec = await readVideoDuration(file);
          thumbnailUrl = await createVideoThumbnail(file).catch(() => null);
        } catch {
          setReviewError("อ่านความยาววิดีโอไม่สำเร็จ กรุณาลองเลือกใหม่");
          continue;
        }
      }
      if (
        durationSec != null &&
        durationSec > MAX_REVIEW_VIDEO_DURATION_SEC
      ) {
        setReviewError(
          `วิดีโอต้องยาวไม่เกิน ${MAX_REVIEW_VIDEO_DURATION_SEC} วินาที`
        );
        continue;
      }

      nextFiles.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        thumbnailUrl,
        type,
        durationSec,
      });
    }

    setReviewFiles((current) => [...current, ...nextFiles]);
    setReviewPreparingMediaText(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget || reviewSubmitting) return;

    const comment = reviewComment.trim();
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("กรุณาเลือกคะแนน 1-5 ดาว");
      return;
    }
    if (comment.length < 10 || comment.length > 1000) {
      setReviewError("รีวิวต้องมีความยาว 10-1000 ตัวอักษร");
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewInfo(null);
    try {
      setReviewUploadStatus({
        phase: "saving",
        current: reviewFiles.length,
        total: reviewFiles.length,
      });
      const sortOrderOffset = reviewTarget.existingReview?.media?.length ?? 0;
      const payload = {
        rating: reviewRating,
        comment,
        isAnonymous: reviewIsAnonymous,
        media: reviewFiles.map((file, index) => ({
          file: file.file,
          type: file.type,
          durationSec: file.durationSec,
          sortOrder: sortOrderOffset + index,
        })),
      };

      const existingReviewId = getOrderItemReviewId(reviewTarget.item);
      if (existingReviewId) {
        await updateReview(existingReviewId, payload);
      } else {
        await createOrderItemReview(reviewTarget.item.id, payload);
      }

      setReviewInfo("ส่งรีวิวเรียบร้อยแล้ว");
      reviewFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      setReviewTarget(null);
      setReviewFiles([]);
      setReviewError(null);
      setReviewUploadStatus(null);
      window.sessionStorage.setItem("ponpon.review.thank-you", "1");
      router.push("/orders");
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "ส่งรีวิวไม่สำเร็จ กรุณาลองใหม่"
      );
    } finally {
      setReviewSubmitting(false);
      setReviewUploadStatus(null);
    }
  };

  const handleReturnImagesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    setReturnError(null);
    setReturnInfo(null);

    if (selectedFiles.length === 0) return;

    const availableSlots = MAX_RETURN_IMAGES - returnImages.length;
    if (availableSlots <= 0) {
      setReturnError(`แนบรูปได้สูงสุด ${MAX_RETURN_IMAGES} รูป`);
      return;
    }

    const unsupportedFile = selectedFiles.find(
      (file) => !ALLOWED_RETURN_IMAGE_TYPES.includes(file.type)
    );
    if (unsupportedFile) {
      setReturnError("รองรับเฉพาะไฟล์ JPEG, PNG และ WebP เท่านั้น");
      return;
    }

    const validFiles = selectedFiles.slice(0, availableSlots);
    const oversizedFile = validFiles.find(
      (file) => file.size > MAX_RETURN_IMAGE_SIZE
    );

    if (oversizedFile) {
      setReturnError("รูปแต่ละไฟล์ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }

    const images = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise<ReturnImage>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
                file,
                previewUrl: String(reader.result),
              });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    ).catch(() => null);

    if (!images) {
      setReturnError("อ่านไฟล์รูปไม่สำเร็จ กรุณาลองใหม่");
      return;
    }

    setReturnImages((current) => [...current, ...images]);
    if (selectedFiles.length > availableSlots) {
      setReturnInfo(`เลือกได้สูงสุด ${MAX_RETURN_IMAGES} รูป`);
    }
  };

  const handleSubmitReturn = async () => {
    if (returnSubmitting) return;
    if (!returnReason) {
      setReturnError("กรุณาเลือกเหตุผลในการขอคืนสินค้า");
      return;
    }
    if (!apiOrder?.receivedAtUtc && order?.orderStatus !== "success") {
      setReturnError("ขอคืนสินค้าได้หลังออเดอร์สำเร็จแล้วเท่านั้น");
      return;
    }
    if (returnImages.length === 0) {
      setReturnError("กรุณาแนบรูปประกอบอย่างน้อย 1 รูป");
      return;
    }

    setReturnSubmitting(true);
    setReturnError(null);
    setReturnInfo(null);

    const reason = returnReasonDetail.trim()
      ? `${returnReason} - ${returnReasonDetail.trim()}`
      : returnReason;

    try {
      await createReturnRequest(id, {
        reason,
        photos: returnImages.map((image) => image.file),
      });
      setReturnInfo("ส่งคำขอคืนสินค้าเรียบร้อยแล้ว");
      setReturnImages([]);
      setReturnReason("");
      setReturnReasonDetail("");
    } catch (error) {
      setReturnError(
        error instanceof Error
          ? error.message
          : "ส่งคำขอคืนสินค้าไม่สำเร็จ กรุณาลองใหม่"
      );
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="ติดตามออเดอร์" showBack />
        <PageContainer className="flex items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-semibold">กำลังโหลดออเดอร์...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !order || !apiOrder) {
    return (
      <>
        <AppHeader title="ติดตามออเดอร์" showBack />
        <PageContainer className="pt-4">
          <EmptyState
            emoji="⚠️"
            title="โหลดออเดอร์ไม่สำเร็จ"
            description={error ?? "ไม่พบออเดอร์นี้"}
            action={
              <Link href="/orders">
                <Button>ดูออเดอร์ทั้งหมด</Button>
              </Link>
            }
          />
        </PageContainer>
      </>
    );
  }

  const hasRefundablePaymentStatus = REFUNDABLE_PAYMENT_STATUSES.includes(
    order.paymentStatus
  );
  const hasPaidAmount = getApiPaidAmount(apiOrder) > 0;
  const omiseRefundStatus = getApiOmiseRefundStatus(apiOrder);
  const returnRequestStatus = getApiReturnRequestStatus(apiOrder);
  const manualRefundLabel =
    hasRefundablePaymentStatus || hasPaidAmount
      ? getManualRefundLabel(omiseRefundStatus)
      : null;
  const returnRefundText = getReturnRefundText({
    omiseRefundStatus,
    returnRequestStatus,
    assumeReturnRefund:
      Boolean(manualRefundLabel) ||
      order.orderStatus === "returned" ||
      order.orderStatus === "failed_shipment",
  });
  const returnRefundStatusText = returnRefundText ?? manualRefundLabel;
  const cancellable =
    !manualRefundLabel && CANCELLABLE_STATUSES.includes(order.orderStatus);
  const cancellationNeedsRefund =
    cancellable &&
    REFUNDABLE_PAYMENT_STATUSES.includes(order.paymentStatus);
  const canPayNow =
    order.paymentStatus === "pending" && order.paymentMethod !== "cod";
  const canConfirmReceived =
    order.orderStatus === "success" && !apiOrder.receivedAtUtc;
  const hasShippingAddress = Boolean(order.address.trim());
  const pendingReviewItem =
    apiOrder.receivedAtUtc
      ? apiOrder.items.find((item) => !isOrderDetailItemReviewed(item))
      : undefined;
  const canReviewOrder = Boolean(pendingReviewItem);
  const orderReviewed = Boolean(
    apiOrder.receivedAtUtc && apiOrder.items.length > 0 && !pendingReviewItem
  );
  const canRequestReturn =
    Boolean(apiOrder.receivedAtUtc || order.orderStatus === "success") &&
    !manualRefundLabel &&
    !["voided", "returned", "failed_shipment"].includes(order.orderStatus);
  const reviewRouteBlockedMessage = orderReviewed
    ? "ออเดอร์นี้รีวิวแล้ว"
    : !apiOrder.receivedAtUtc
      ? "ออเดอร์นี้ยังไม่พร้อมให้รีวิว"
    : apiOrder.items.length === 0
      ? "ไม่พบสินค้าที่สามารถรีวิวได้"
      : null;
  const canSubmitReview =
    !reviewSubmitting &&
    !reviewPreparingMediaText;
  const reviewUploadText =
    reviewPreparingMediaText
      ? reviewPreparingMediaText
      : reviewUploadStatus?.phase === "saving"
        ? "กำลังบันทึกรีวิว..."
        : null;
  const paymentHref = `/payment?orderId=${encodeURIComponent(
    order.id
  )}&orderNo=${encodeURIComponent(order.orderNo)}&amount=${encodeURIComponent(
    String(order.total)
  )}`;
  const handleOpenReturn = () => {
    setReturnReason("");
    setReturnReasonDetail("");
    setReturnImages([]);
    setReturnError(null);
    setReturnInfo(null);
    setShowReturnDialog(true);
  };

  return (
    <>
      <AppHeader title={forceReview ? "เขียนรีวิว" : "รายละเอียดคำสั่งซื้อ"} showBack />
      {forceReview ? (
        <PageContainer className="space-y-3 pt-4 pb-36 md:max-w-md">
          {!reviewTarget && reviewRouteBlockedMessage ? (
            <EmptyState
              emoji="⭐"
              title={reviewRouteBlockedMessage}
              description="กลับไปดูรายการออเดอร์ทั้งหมดได้เลย"
              action={
                <Link href="/orders">
                  <Button>ดูออเดอร์ทั้งหมด</Button>
                </Link>
              }
            />
          ) : !reviewTarget ? (
            <Card className="flex min-h-64 items-center justify-center bg-white p-6 text-center">
              <div className="flex flex-col items-center gap-3 text-ink-soft">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="text-sm font-bold">กำลังเปิดหน้ารีวิว...</p>
              </div>
            </Card>
          ) : null}
        </PageContainer>
      ) : (
      <PageContainer className="space-y-3 pt-4 pb-36 md:max-w-5xl md:px-8 xl:max-w-6xl">
        {confirmReceiveError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-relaxed text-red-600"
          >
            {confirmReceiveError}
          </div>
        )}
        <section className="overflow-hidden rounded-card bg-white app-panel-shadow ring-1 ring-black/[0.04]">
          <div className="bg-brand px-4 py-5 text-white">
            <p className="text-xs font-bold text-white/75">สถานะคำสั่งซื้อ</p>
            <h1 className="mt-1 text-xl font-extrabold leading-tight">
              {returnRefundStatusText ?? getStatusTitle(order.orderStatus)}
            </h1>
            <p className="mt-1 text-sm font-semibold text-white/85">
              {returnRefundStatusText
                ? returnRefundStatusText
                : getStatusDescription(order.orderStatus)}
            </p>
          </div>

          <div className="space-y-3 px-4 py-4">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-ink">
                    ข้อมูลการจัดส่ง
                  </p>
                  <ChevronRight className="h-4 w-4 text-ink-soft" />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  ส่งโดย {formatShippingLine(apiOrder)}
                </p>
                <div className="mt-3 rounded-2xl bg-brand-soft px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-brand" />
                    <p className="text-sm font-extrabold text-brand">
                      {getLatestTimelineText(order)}
                    </p>
                  </div>
                  <p className="mt-1 pl-6 text-xs font-semibold text-ink-soft">
                    {apiOrder.shippingDate
                      ? formatDateTime(apiOrder.shippingDate)
                      : apiOrder.orderDate
                        ? formatDateTime(apiOrder.orderDate)
                        : "รอร้านอัปเดตเวลา"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-black/[0.05] pt-3">
              {hasShippingAddress ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-ink">
                      ที่อยู่ในการจัดส่ง
                    </p>
                    <p className="mt-2 text-sm font-bold text-ink">
                      {order.customerName || "-"}{" "}
                      <span className="font-semibold text-ink-soft">
                        {order.phone}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                      {order.address}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/addresses"
                  className="group flex items-center gap-3 rounded-2xl border border-dashed border-brand/25 bg-brand-soft/55 p-3 transition active:scale-[0.99] hover:border-brand/40 hover:bg-brand-soft"
                  aria-label="เพิ่มหรือจัดการที่อยู่จัดส่ง"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-brand/10">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-ink">
                      ยังไม่มีที่อยู่จัดส่ง
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-ink-soft">
                      เพิ่มชื่อผู้รับ เบอร์โทร และที่อยู่สำหรับจัดส่ง
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-brand">
                    จัดการ
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>

        <OrderProductCard
          apiOrder={apiOrder}
          order={order}
          onReviewItem={handleOpenReview}
        />

        <OrderMetaCard apiOrder={apiOrder} order={order} />

        {canPayNow && (
          <Link href={paymentHref} className="block">
            <Button size="lg" fullWidth>
              <QrCode className="h-5 w-5" />
              ชำระเงิน
            </Button>
          </Link>
        )}

        {canReviewOrder && pendingReviewItem && (
          <button
            type="button"
            onClick={() =>
              handleOpenReview({
                item: pendingReviewItem,
                existingReview: getExistingReview(pendingReviewItem),
              })
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(237,23,28,0.18)] transition active:scale-[0.98]"
          >
            <Star className="h-4 w-4" />
            เขียนรีวิว
          </button>
        )}

        {canRequestReturn && (
          <button
            type="button"
            onClick={handleOpenReturn}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-brand/25 bg-brand-soft py-3 text-sm font-bold text-brand transition active:scale-[0.98] hover:bg-brand-soft/80"
          >
            <RotateCcw className="h-4 w-4" />
            ขอคืนเงิน/คืนสินค้า
          </button>
        )}

        <Link href="/orders" className="block">
          <Button variant="ghost" fullWidth>
            ดูออเดอร์ทั้งหมด
          </Button>
        </Link>

        {cancellable && (
          <button
            type="button"
            onClick={handleOpenCancel}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition active:scale-[0.98] hover:bg-red-100"
          >
            <XCircle className="h-4 w-4" />
            {cancellationNeedsRefund
              ? "ยกเลิกและขอคืนเงิน"
              : "ยกเลิกออเดอร์"}
          </button>
        )}
      </PageContainer>
      )}

      {!forceReview && (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 md:max-w-5xl md:px-8 xl:max-w-6xl">
          <Link
            href="/products"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/12 bg-white text-sm font-extrabold text-ink transition active:scale-[0.97]"
          >
            <RotateCcw className="h-4 w-4" />
            ซื้ออีกครั้ง
          </Link>
          {canPayNow ? (
            <Link
              href={paymentHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(237,23,28,0.22)] transition active:scale-[0.97]"
            >
              <QrCode className="h-4 w-4" />
              ชำระเงิน
            </Link>
          ) : canConfirmReceived ? (
            <button
              type="button"
              onClick={handleConfirmReceived}
              disabled={confirmingReceived}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(237,23,28,0.22)] transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmingReceived ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="h-4 w-4" />
              )}
              {confirmingReceived ? "กำลังยืนยัน..." : "ได้รับสินค้าแล้ว"}
            </button>
          ) : canReviewOrder && pendingReviewItem ? (
            <button
              type="button"
              onClick={() =>
                handleOpenReview({
                  item: pendingReviewItem,
                  existingReview: getExistingReview(pendingReviewItem),
                })
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(237,23,28,0.22)] transition active:scale-[0.97]"
            >
              <Star className="h-4 w-4" />
              เขียนรีวิว
            </button>
          ) : canRequestReturn ? (
            <button
              type="button"
              onClick={handleOpenReturn}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(237,23,28,0.22)] transition active:scale-[0.97]"
            >
              <RotateCcw className="h-4 w-4" />
              คืนสินค้า
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openExternalWindow(LINE_OA_URL)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-brand bg-white text-sm font-extrabold text-brand transition active:scale-[0.97]"
            >
              <MessageCircle className="h-4 w-4" />
              ติดต่อร้าน
            </button>
          )}
        </div>
      </div>
      )}

      {/* Review bottom sheet */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleCloseReview}
        >
          <div
            className="flex max-h-[calc(100dvh-10px)] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] bg-white px-4 pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  {reviewTarget.existingReview ? "แก้ไขรีวิว" : "เขียนรีวิว"}
                </h2>
                <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink-soft">
                  {reviewTarget.item.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                disabled={reviewSubmitting}
                aria-label="ปิด"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-soft transition active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <div className="mb-3">
              <p className="mb-1.5 text-sm font-extrabold text-ink">ให้คะแนนสินค้า</p>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setReviewRating(value);
                        setReviewError(null);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-amber-500 transition active:scale-95"
                      aria-label={`${value} ดาว`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          value <= reviewRating
                            ? "fill-amber-400 text-amber-500"
                            : "fill-white text-ink-soft/40"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-extrabold text-ink">
                รีวิวสินค้า
              </span>
              <textarea
                value={reviewComment}
                onChange={(event) => {
                  setReviewComment(event.target.value);
                  setReviewError(null);
                }}
                maxLength={1000}
                rows={3}
                placeholder="บอกความรู้สึกหลังได้รับสินค้า"
                className="min-h-20 w-full resize-none rounded-2xl border border-black/10 bg-surface-muted/50 px-3 py-2.5 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brand focus:bg-white"
              />
              <span className="mt-1 block text-right text-xs font-semibold text-ink-soft">
                {reviewComment.trim().length}/1000
              </span>
            </label>

            <label
              className={`mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition active:scale-[0.99] ${
                reviewIsAnonymous
                  ? "border-brand/35 bg-brand-soft ring-1 ring-brand/10"
                  : "border-black/10 bg-surface-muted/45"
              }`}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-black/[0.06]">
                <Image
                  src="/images/review-anonymous.png"
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">
                  โพสต์แบบไม่ระบุตัวตน
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-ink-soft">
                  {reviewIsAnonymous
                    ? "จะแสดงชื่อว่า “ผู้ใช้ไม่ระบุตัวตน”"
                    : "จะแสดงชื่อและรูปโปรไฟล์ LINE ของคุณ"}
                </span>
              </span>
              <span
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  reviewIsAnonymous ? "bg-brand" : "bg-black/15"
                }`}
              >
                <input
                  type="checkbox"
                  checked={reviewIsAnonymous}
                  onChange={(event) => setReviewIsAnonymous(event.target.checked)}
                  aria-label="โพสต์แบบไม่ระบุตัวตน"
                  className="peer sr-only"
                />
                <span className="h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </span>
            </label>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-ink">รูป/วิดีโอ</p>
                <span className="text-xs font-semibold text-ink-soft">
                  {(reviewTarget.existingReview?.media?.length ?? 0) + reviewFiles.length}/
                  {REVIEW_MEDIA_SLOTS}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {reviewTarget.existingReview?.media?.map((media, index) => (
                  <div
                    key={`${media.url}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-black/[0.06]"
                  >
                    {media.type === "video" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewVideoPreview({
                            src: media.url,
                            poster: media.thumbnailUrl ?? null,
                            name: "วิดีโอรีวิว",
                          })
                        }
                        className="relative h-full w-full"
                        aria-label="เล่นวิดีโอรีวิว"
                      >
                        <video
                          src={media.url}
                          poster={media.thumbnailUrl ?? undefined}
                          preload="metadata"
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand shadow-sm">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                        </span>
                      </button>
                    ) : (
                      <img
                        src={media.thumbnailUrl ?? media.url}
                        alt="สื่อรีวิวเดิม"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
                {reviewFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-black/[0.06]"
                  >
                    {file.type === "video" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewVideoPreview({
                            src: file.previewUrl,
                            poster: file.thumbnailUrl,
                            name: file.file.name,
                          })
                        }
                        className="relative h-full w-full"
                        aria-label={`เล่น ${file.file.name}`}
                      >
                        <video
                          src={file.previewUrl}
                          poster={file.thumbnailUrl ?? undefined}
                          preload="metadata"
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-brand shadow-sm">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                        </span>
                      </button>
                    ) : (
                      <img
                        src={file.previewUrl}
                        alt={file.file.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-sm">
                      พร้อมส่ง
                    </span>
                    <button
                      type="button"
                      disabled={reviewSubmitting}
                      onClick={() => {
                        URL.revokeObjectURL(file.previewUrl);
                        setReviewFiles((current) =>
                          current.filter((item) => item.id !== file.id)
                        );
                      }}
                      aria-label={`ลบ ${file.file.name}`}
                      className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {reviewPreparingMediaText && (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-brand/20 bg-brand-soft/70 px-2 text-center text-brand ring-1 ring-brand/10">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-[11px] font-extrabold leading-tight">
                      {reviewPreparingMediaText}
                    </span>
                  </div>
                )}
                {!reviewSubmitting &&
                  !reviewPreparingMediaText &&
                  (reviewTarget.existingReview?.media?.length ?? 0) +
                  reviewFiles.length <
                  REVIEW_MEDIA_SLOTS && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand/40 bg-brand-soft/60 text-brand transition active:scale-95">
                    <ImagePlus className="h-6 w-6" />
                    <span className="mt-1 text-xs font-bold">เพิ่มสื่อ</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                      multiple
                      onChange={handleReviewFilesChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-ink-soft">
                รวมสูงสุด 5 ช่อง, รูปไม่เกิน 5, วิดีโอไม่เกิน 3 คลิป และแต่ละคลิปไม่เกิน 60 วินาที
              </p>
              {reviewUploadText && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-brand/15 bg-brand-soft px-3 py-2 text-xs font-extrabold text-brand">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="min-w-0 flex-1 truncate">
                    {reviewUploadText}
                  </span>
                </div>
              )}
            </div>

            {reviewError && (
              <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {reviewError}
              </p>
            )}
            {reviewInfo && (
              <p className="mt-4 rounded-2xl border border-brand/15 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
                {reviewInfo}
              </p>
            )}
            </div>

            <div className="-mx-4 flex shrink-0 gap-2 border-t border-black/[0.06] bg-white px-4 py-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleCloseReview}
                disabled={reviewSubmitting}
                className="h-11"
              >
                ยกเลิก
              </Button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={!canSubmitReview}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-extrabold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reviewSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {reviewUploadText ?? "กำลังส่ง..."}
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    ส่งรีวิว
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewVideoPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setReviewVideoPreview(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-white px-4 py-3">
              <p className="min-w-0 truncate text-sm font-extrabold text-ink">
                {reviewVideoPreview.name}
              </p>
              <button
                type="button"
                onClick={() => setReviewVideoPreview(null)}
                aria-label="ปิดวิดีโอ"
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src={reviewVideoPreview.src}
              poster={reviewVideoPreview.poster ?? undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[70dvh] w-full bg-black object-contain"
            />
          </div>
        </div>
      )}

      {/* Cancel confirmation bottom sheet */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            if (!cancelling) setShowCancelDialog(false);
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10" />

            <div className="mb-5 flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-ink">
                {cancellationNeedsRefund
                  ? "ยืนยันยกเลิกและขอคืนเงิน?"
                  : "ยืนยันยกเลิกออเดอร์?"}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                ออเดอร์{" "}
                <span className="font-bold text-ink">{order.orderNo}</span>{" "}
                {cancellationNeedsRefund
                  ? "จะถูกยกเลิกและส่งคำขอคืนเงินให้ร้านตรวจสอบ"
                  : "จะถูกยกเลิกและไม่สามารถเปิดใหม่ได้"}
              </p>
            </div>

            <fieldset className="mb-4">
              <legend className="mb-2 text-sm font-extrabold text-ink">
                เหตุผลที่ยกเลิก
              </legend>
              <div className="space-y-2">
                {CANCEL_REASON_OPTIONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
                      cancelReason === reason
                        ? "border-brand bg-brand-soft"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={() => {
                        setCancelReason(reason);
                        setCancelError(null);
                      }}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="text-sm font-semibold text-ink">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-extrabold text-ink">
                รายละเอียดเพิ่มเติม{" "}
                <span className="font-semibold text-ink-soft">(ถ้ามี)</span>
              </span>
              <textarea
                value={cancelReasonDetail}
                onChange={(event) => setCancelReasonDetail(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="บอกรายละเอียดเพิ่มเติมให้ร้านทราบ"
                className="w-full resize-none rounded-2xl border border-black/10 bg-surface-muted/50 px-4 py-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brand focus:bg-white"
              />
            </label>

            {cancelError && (
              <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                {cancelError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
              >
                ไม่ยกเลิก
              </Button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-base font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {cancellationNeedsRefund
                      ? "กำลังส่งคำขอ..."
                      : "กำลังยกเลิก..."}
                  </>
                ) : (
                  cancellationNeedsRefund
                    ? "ยกเลิกและขอคืนเงิน"
                    : "ยืนยันยกเลิก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return/refund request bottom sheet */}
      {showReturnDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            if (!returnSubmitting) setShowReturnDialog(false);
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10" />

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">
                  ขอคืนเงิน/คืนสินค้า
                </h2>
                <p className="mt-1 text-sm font-semibold text-ink-soft">
                  ออเดอร์ {order.orderNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnDialog(false)}
                disabled={returnSubmitting}
                aria-label="ปิด"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-soft transition active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-extrabold text-ink">
                เหตุผลที่ขอคืนสินค้า
              </legend>
              <div className="space-y-2">
                {RETURN_REASON_OPTIONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
                      returnReason === reason
                        ? "border-brand bg-brand-soft"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="return-reason"
                      value={reason}
                      checked={returnReason === reason}
                      onChange={() => {
                        setReturnReason(reason);
                        setReturnError(null);
                        setReturnInfo(null);
                      }}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="text-sm font-semibold text-ink">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-extrabold text-ink">
                รายละเอียดเพิ่มเติม{" "}
                <span className="font-semibold text-ink-soft">(ถ้ามี)</span>
              </span>
              <textarea
                value={returnReasonDetail}
                onChange={(event) => setReturnReasonDetail(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="อธิบายปัญหาที่พบ"
                className="w-full resize-none rounded-2xl border border-black/10 bg-surface-muted/50 px-4 py-3 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brand focus:bg-white"
              />
            </label>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-ink">รูปประกอบ</p>
                <span className="text-xs font-semibold text-ink-soft">
                  {returnImages.length}/{MAX_RETURN_IMAGES} รูป
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {returnImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-black/[0.06]"
                  >
                    <Image
                      src={image.previewUrl}
                      alt={`รูปประกอบ ${image.file.name}`}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReturnImages((current) =>
                          current.filter((item) => item.id !== image.id)
                        )
                      }
                      aria-label={`ลบรูป ${image.file.name}`}
                      className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {returnImages.length < MAX_RETURN_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand/40 bg-brand-soft/60 text-brand transition active:scale-95">
                    <ImagePlus className="h-6 w-6" />
                    <span className="mt-1 text-xs font-bold">เพิ่มรูป</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleReturnImagesChange}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold text-ink-soft">
                รองรับ JPEG, PNG, WebP สูงสุด 10 MB ต่อรูป และต้องแนบอย่างน้อย 1 รูป
              </p>
            </div>

            {returnError && (
              <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {returnError}
              </p>
            )}
            {returnInfo && (
              <p className="mt-4 rounded-2xl border border-brand/15 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">
                {returnInfo}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setShowReturnDialog(false)}
                disabled={returnSubmitting}
              >
                ยกเลิก
              </Button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                disabled={returnSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-extrabold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {returnSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    ส่งคำขอ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Loader2,
  PackageCheck,
  PackageSearch,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { ProductImage } from "@/components/product/product-image";
import { confirmOrderReceived, fetchOrders } from "@/features/orders/order-api";
import { storeCartSelectionCheckout } from "@/features/checkout/cart-selection-checkout";
import {
  getManualRefundLabel,
  getReturnRefundText,
  normalizeReturnRequestStatus,
  normalizeOmiseRefundStatus,
} from "@/features/orders/refund-status";
import { formatBaht, formatDate } from "@/lib/format";
import { getCartItemKey, useCartStore } from "@/store/cart-store";
import type {
  ApiOrderDetail,
  ApiOrderListItem,
  ApiOrderPreviewItem,
} from "@/types/api";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import type { OrderStatus } from "@/types/order";

type OrderFilter =
  | "all"
  | "pending_payment"
  | "preparing"
  | "awaiting_receive"
  | "awaiting_review"
  | "completed"
  | "cancelled"
  | "return_refund";

const orderTabs: {
  value: OrderFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "ทั้งหมด",
  },
  {
    value: "pending_payment",
    label: "รอชำระ",
  },
  {
    value: "preparing",
    label: "เตรียมสินค้า",
  },
  {
    value: "awaiting_receive",
    label: "ที่ต้องได้รับ",
  },
  {
    value: "completed",
    label: "สำเร็จ",
  },
  {
    value: "awaiting_review",
    label: "รอรีวิว",
  },
  {
    value: "cancelled",
    label: "ยกเลิก",
  },
  {
    value: "return_refund",
    label: "คืนเงิน/คืนสินค้า",
  },
];

const progressByStatus: Record<OrderStatus, number> = {
  pending: 10,
  waiting: 28,
  packed: 55,
  shipping: 78,
  success: 100,
  voided: 0,
  returned: 0,
  failed_shipment: 0,
};

const helperByStatus: Record<OrderStatus, string> = {
  pending: "กรุณาชำระเงินเพื่อยืนยันออเดอร์",
  waiting: "ร้านกำลังเตรียมสินค้า",
  packed: "แพ็กสินค้าแล้ว",
  shipping: "กำลังจัดส่ง",
  success: "จัดส่งสำเร็จ ขอบคุณที่อุดหนุน",
  voided: "ออเดอร์นี้ถูกยกเลิก",
  returned: "สินค้าถูกส่งคืน",
  failed_shipment: "การจัดส่งไม่สำเร็จ กรุณาติดต่อร้านค้า",
};

const ORDER_PAGE_CONTAINER_CLASS = "pt-4 md:max-w-5xl md:px-8 xl:max-w-6xl";
const ORDER_PAGE_SIZE = 10;
const EMPTY_ORDERS: ApiOrderListItem[] = [];
const FALLBACK_ORDER_PAGE_SIZE = 100;
const ORDER_NOTIFICATION_FILTERS: OrderFilter[] = [
  "pending_payment",
  "preparing",
  "awaiting_receive",
  "return_refund",
];
const ORDER_NOTIFICATION_COUNTS_KEY = "ponpon.orders.notificationCounts";
const ORDER_NOTIFICATION_SEEN_KEY = "ponpon.orders.notificationSeenCounts";
const LIVE_ORDER_FILTERS: OrderFilter[] = [
  "awaiting_receive",
  "completed",
  "cancelled",
  "return_refund",
  "awaiting_review",
];

const orderFilterFallbackRules: Record<
  OrderFilter,
  { status: string[] | null; paymentstatus: string[] | null }
> = {
  all: { status: null, paymentstatus: null },
  pending_payment: { status: ["0"], paymentstatus: ["0"] },
  preparing: { status: ["3", "5"], paymentstatus: ["1"] },
  awaiting_receive: { status: ["6"], paymentstatus: ["1"] },
  completed: { status: ["1"], paymentstatus: ["1"] },
  awaiting_review: { status: ["1"], paymentstatus: ["1"] },
  cancelled: { status: ["2"], paymentstatus: null },
  return_refund: { status: ["2", "4", "7"], paymentstatus: null },
};

const orderFilterValues = new Set<OrderFilter>(
  orderTabs.map((filter) => filter.value)
);

function parseOrderFilter(value: string | null): OrderFilter {
  if (value === "payment") return "pending_payment";
  if (value === "canceled") return "cancelled";
  return value && orderFilterValues.has(value as OrderFilter)
    ? (value as OrderFilter)
    : "all";
}

function isPageReload(): boolean {
  if (typeof window === "undefined") return false;

  const navigation = window.performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === "reload";
}

function sanitizeOrderNotificationCounts(
  data: Partial<Record<OrderFilter, unknown>>
): Partial<Record<OrderFilter, number>> {
  return ORDER_NOTIFICATION_FILTERS.reduce<Partial<Record<OrderFilter, number>>>(
    (counts, filter) => {
      const value = data[filter];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        counts[filter] = value;
      }
      return counts;
    },
    {}
  );
}

function readOrderNotificationStorage(
  key: string
): Partial<Record<OrderFilter, number>> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return sanitizeOrderNotificationCounts(
      JSON.parse(raw) as Partial<Record<OrderFilter, unknown>>
    );
  } catch {
    return {};
  }
}

function writeOrderNotificationStorage(
  key: string,
  counts: Partial<Record<OrderFilter, number>>
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(counts));
  } catch {
    // Ignore storage failures; the dots still work for the current session.
  }
}

function readOrderNotificationCounts(): Partial<Record<OrderFilter, number>> {
  return readOrderNotificationStorage(ORDER_NOTIFICATION_COUNTS_KEY);
}

function writeOrderNotificationCounts(
  counts: Partial<Record<OrderFilter, number>>
): void {
  writeOrderNotificationStorage(ORDER_NOTIFICATION_COUNTS_KEY, counts);
}

function readOrderNotificationSeenCounts(): Partial<Record<OrderFilter, number>> {
  return readOrderNotificationStorage(ORDER_NOTIFICATION_SEEN_KEY);
}

function writeOrderNotificationSeenCounts(
  counts: Partial<Record<OrderFilter, number>>
): void {
  writeOrderNotificationStorage(ORDER_NOTIFICATION_SEEN_KEY, counts);
}

function getOrderNotificationTotal(
  counts: Partial<Record<OrderFilter, number>>
): number {
  return ORDER_NOTIFICATION_FILTERS.reduce(
    (total, filter) => total + (counts[filter] ?? 0),
    0
  );
}

function shouldReloadOrderFilter(filter: OrderFilter): boolean {
  return LIVE_ORDER_FILTERS.includes(filter);
}

interface OrderPreviewItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  name: string;
  quantity: number;
  totalPrice: number;
  imageUrl?: string | null;
  optionLabels: string[];
  isReviewed: boolean;
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

function getOrderOmiseRefundStatus(
  order: ApiOrderListItem | ApiOrderDetail
): unknown {
  const source = order as (ApiOrderListItem | ApiOrderDetail) &
    OrderRefundFields;
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

function getOrderReturnRequestStatus(
  order: ApiOrderListItem | ApiOrderDetail
): unknown {
  const source = order as (ApiOrderListItem | ApiOrderDetail) &
    OrderRefundFields;
  return (
    source.returnRequestStatus ??
    source.ReturnRequestStatus ??
    source.return_request_status
  );
}

function getOrderStatusCode(status: unknown): string {
  const normalized = normalizeStatusValue(status);
  const map: Record<string, string> = {
    pending: "0",
    success: "1",
    voided: "2",
    cancelled: "2",
    canceled: "2",
    waiting: "3",
    returned: "4",
    packed: "5",
    shipping: "6",
    failed_shipment: "7",
  };

  return map[normalized] ?? normalized;
}

function getPaymentStatusCode(status: unknown): string {
  const normalized = normalizeStatusValue(status);
  const map: Record<string, string> = {
    pending: "0",
    unpaid: "0",
    awaiting_payment: "0",
    waiting_payment: "0",
    paid: "1",
    success: "1",
    successful: "1",
    completed: "1",
    fully_paid: "1",
    voided: "2",
    cancelled: "2",
    canceled: "2",
    partial_payment: "3",
    partial: "3",
    excess_payment: "4",
    overpaid: "4",
  };

  return map[normalized] ?? normalized;
}

function getOrderPaymentStatusValue(order: ApiOrderListItem): unknown {
  const paymentStatus =
    (order as ApiOrderListItem & { paymentstatus?: unknown }).paymentstatus ??
    order.paymentStatus;

  if (paymentStatus != null && String(paymentStatus).trim()) {
    return paymentStatus;
  }

  const paymentAmount = Number(order.paymentAmount);
  return Number.isFinite(paymentAmount) && paymentAmount > 0 ? "1" : paymentStatus;
}

function hasOrderPaymentAmount(order: ApiOrderListItem): boolean {
  const paymentAmount = Number(order.paymentAmount);
  return Number.isFinite(paymentAmount) && paymentAmount > 0;
}

function isRefundablePaymentStatus(status: unknown): boolean {
  return ["1", "3", "4"].includes(getPaymentStatusCode(status));
}

function hasManualRefundStatus(order: ApiOrderListItem): boolean {
  return (
    normalizeOmiseRefundStatus(getOrderOmiseRefundStatus(order)) != null &&
    (isRefundablePaymentStatus(getOrderPaymentStatusValue(order)) ||
      hasOrderPaymentAmount(order))
  );
}

function hasReturnRequestStatus(order: ApiOrderListItem): boolean {
  return normalizeReturnRequestStatus(getOrderReturnRequestStatus(order)) != null;
}

function isReturnRefundOrder(order: ApiOrderListItem): boolean {
  const orderStatus = getOrderStatusCode(order.status);
  return (
    orderStatus === "4" ||
    orderStatus === "7" ||
    hasReturnRequestStatus(order) ||
    (orderStatus === "2" && hasManualRefundStatus(order))
  );
}

function matchesOrderFilter(
  order: ApiOrderListItem,
  filterName: OrderFilter,
  filter: { status: string[] | null; paymentstatus: string[] | null }
): boolean {
  const orderStatus = getOrderStatusCode(order.status);
  const paymentStatus = getPaymentStatusCode(getOrderPaymentStatusValue(order));

  return (
    (!filter.status || filter.status.includes(orderStatus)) &&
    (!filter.paymentstatus || filter.paymentstatus.includes(paymentStatus)) &&
    (filterName !== "awaiting_receive" || isAwaitingReceive(order)) &&
    (filterName !== "completed" || Boolean(order.receivedAtUtc)) &&
    (filterName !== "awaiting_review" || hasPendingReview(order)) &&
    (filterName !== "cancelled" || !hasManualRefundStatus(order)) &&
    (filterName !== "return_refund" || isReturnRefundOrder(order))
  );
}

async function fetchOrdersWithClientFallback(
  filter: OrderFilter,
  nextPage: number,
  pageSize: number
) {
  const filterParams = orderFilterFallbackRules[filter];
  const response = await fetchOrders({
    filter: filter === "all" ? undefined : filter,
    page: nextPage,
    pageSize,
  });

  if (filter === "all" || response.items.length > 0 || nextPage !== 1) {
    return response;
  }

  const fallbackResponse = await fetchOrders({
    page: 1,
    pageSize: FALLBACK_ORDER_PAGE_SIZE,
  });
  const fallbackItems = fallbackResponse.items.filter((order) =>
    matchesOrderFilter(order, filter, filterParams)
  );

  return {
    items: fallbackItems.slice(0, pageSize),
    page: 1,
    pageSize,
    total: fallbackItems.length,
    hasMore: fallbackItems.length > pageSize,
  };
}

async function fetchOrderNotificationCounts(): Promise<
  Partial<Record<OrderFilter, number>>
> {
  const entries = await Promise.all(
    ORDER_NOTIFICATION_FILTERS.map(async (filter) => {
      const response = await fetchOrdersWithClientFallback(filter, 1, 1);
      const count = Number.isFinite(response.total)
        ? response.total
        : response.items.length;
      return [filter, count] as const;
    })
  );

  return Object.fromEntries(entries) as Partial<Record<OrderFilter, number>>;
}

function formatVariantOptions(
  options?: { name: string; value: string }[]
): string[] {
  return (
    options
    ?.filter((option) => option.value)
    .map((option) => `${option.name}: ${option.value}`)
      ?? []
  );
}

function isOrderPreviewItemReviewed(item: ApiOrderPreviewItem): boolean {
  const source = item as ApiOrderPreviewItem & {
    reviewId?: string | null;
    isReviewed?: boolean | null;
  };

  if (source.isReviewed === false) return false;
  return Boolean(source.isReviewed === true || source.reviewId?.trim());
}

function isOrderReviewed(order: ApiOrderListItem): boolean {
  const source = order as ApiOrderListItem & {
    reviewId?: string | null;
    isReviewed?: boolean | null;
  };

  return Boolean(
    source.reviewId?.trim() ||
      source.isReviewed === true ||
      (order.itemsPreview ?? []).some(isOrderPreviewItemReviewed)
  );
}

function hasPendingReview(order: ApiOrderListItem): boolean {
  if (!order.receivedAtUtc) return false;
  const source = order as ApiOrderListItem & {
    hasPendingReview?: boolean | null;
    pendingReviewCount?: number | null;
    isReviewed?: boolean | null;
  };

  if (typeof source.hasPendingReview === "boolean") {
    return source.hasPendingReview;
  }
  if (
    typeof source.pendingReviewCount === "number" &&
    Number.isFinite(source.pendingReviewCount)
  ) {
    return source.pendingReviewCount > 0;
  }

  const items = order.itemsPreview ?? [];
  if (items.length > 0) {
    return items.some((item) => !isOrderPreviewItemReviewed(item));
  }

  if (source.isReviewed === false && (order.itemsCount ?? 0) > 0) {
    return true;
  }

  if (isOrderReviewed(order)) return false;
  return false;
}

function isAwaitingReceive(order: ApiOrderListItem): boolean {
  const status = getOrderStatusCode(order.status);
  return ["6", "1"].includes(status) && !order.receivedAtUtc;
}

function canConfirmOrderReceived(order: ApiOrderListItem): boolean {
  return getOrderStatusCode(order.status) === "1" && !order.receivedAtUtc;
}

function mapOrderItemToPreview(item: ApiOrderPreviewItem): OrderPreviewItem {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    name: item.name,
    quantity: Math.round(item.quantity),
    totalPrice: item.totalPrice,
    imageUrl: item.imageUrl,
    optionLabels: formatVariantOptions(item.options),
    isReviewed: isOrderPreviewItemReviewed(item),
  };
}

function mapPreviewItemToCartItem(item: OrderPreviewItem): CartItem | null {
  if (!item.productId || !item.name) return null;

  const quantity = Math.max(1, Math.round(item.quantity || 1));
  const selectedOptions =
    item.optionLabels.length > 0
      ? Object.fromEntries(
          item.optionLabels.map((label) => {
            const [name, ...valueParts] = label.split(":");
            return [name.trim(), valueParts.join(":").trim()];
          })
        )
      : undefined;

  return {
    productId: item.productId,
    variantId: item.variantId,
    productSlug: null,
    name: item.name,
    price: item.totalPrice / quantity,
    imageUrl: item.imageUrl ?? "",
    emoji: "📦",
    quantity,
    selectedOptions,
  };
}

function cartItemToProduct(item: CartItem): Product {
  return {
    id: item.productId,
    slug: item.productSlug ?? "",
    name: item.name,
    description: "",
    price: item.price,
    imageUrl: item.imageUrl,
    emoji: item.emoji,
    categoryId: "",
    categoryName: "",
    badges: [],
    stock: 0,
    isFeatured: false,
    isBestSeller: false,
  };
}

function OrderCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-brand-soft/80" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 animate-pulse rounded-full bg-black/[0.07]" />
            <div className="h-2.5 w-16 animate-pulse rounded-full bg-black/[0.05]" />
          </div>
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-black/[0.06]" />
      </div>

      <div className="px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-brand-soft/70" />
          <div className="min-w-0 flex-1 space-y-2.5 pt-1">
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-black/[0.07]" />
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-black/[0.05]" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-black/[0.07]" />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="h-2.5 w-2/5 animate-pulse rounded-full bg-black/[0.05]" />
          <div className="h-1.5 w-full animate-pulse rounded-full bg-brand-soft/60" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/[0.05] bg-surface-muted/45 px-4 py-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-black/[0.05]" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-black/[0.07]" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-brand-soft/70" />
      </div>
    </Card>
  );
}

function OrderCard({
  order,
  activeFilter,
  previewItems = [],
  isPreviewLoading = false,
  itemsCount,
}: {
  order: ApiOrderListItem;
  activeFilter: OrderFilter;
  previewItems?: OrderPreviewItem[];
  isPreviewLoading?: boolean;
  itemsCount: number;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [confirmReceiveError, setConfirmReceiveError] = useState<string | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [selectedPromptRating, setSelectedPromptRating] = useState(0);
  const ratingPromptTimerRef = useRef<number | null>(null);
  const orderStatus = mapStatus(order.status);
  const omiseRefundStatus = getOrderOmiseRefundStatus(order);
  const returnRequestStatus = getOrderReturnRequestStatus(order);
  const canShowManualRefund = Boolean(
    normalizeOmiseRefundStatus(omiseRefundStatus) &&
      (isRefundablePaymentStatus(getOrderPaymentStatusValue(order)) ||
        hasOrderPaymentAmount(order))
  );
  const normalizedRefundStatus = normalizeOmiseRefundStatus(omiseRefundStatus);
  const manualRefundStatus = canShowManualRefund
    ? normalizedRefundStatus
    : null;
  const manualRefundLabel = canShowManualRefund
    ? getManualRefundLabel(omiseRefundStatus)
    : null;
  const backendReturnRefundText = order.returnRefundText?.trim() || null;
  const backendReturnRefundStatusText =
    order.returnRefundStatus === "completed"
      ? "สำเร็จ"
      : order.returnRefundStatus === "pending"
        ? "รอพิจารณา"
        : null;
  const returnRefundText = backendReturnRefundText ??
    backendReturnRefundStatusText ??
    getReturnRefundText({
    omiseRefundStatus,
    returnRequestStatus,
    assumeReturnRefund:
      activeFilter === "return_refund" || isReturnRefundOrder(order),
  });
  const returnRefundBadgeText = returnRefundText ?? manualRefundLabel;
  const manualRefundBadgeClass =
    returnRefundText?.endsWith("สำเร็จ") ||
    manualRefundStatus === "manual_refunded"
      ? "bg-success-soft text-success"
      : "bg-warning-soft text-warning";
  const progress = progressByStatus[orderStatus];
  const isShipped = orderStatus === "shipping";
  const visiblePreviewItems = itemsExpanded ? previewItems : previewItems.slice(0, 1);
  const hiddenPreviewCount = Math.max(itemsCount - visiblePreviewItems.length, 0);
  const previewHiddenCount = Math.max(previewItems.length - visiblePreviewItems.length, 0);
  const hasMoreItems = Math.max(itemsCount, previewItems.length) > 1;
  const awaitingReceive = isAwaitingReceive(order);
  const canConfirmReceived = canConfirmOrderReceived(order);
  const isAwaitingReview = hasPendingReview(order);
  const orderHref = isAwaitingReview
    ? `/orders/${order.id}/review`
    : `/orders/${order.id}`;
  const actionLabel = isAwaitingReview
    ? "เขียนรีวิว"
    : canConfirmReceived
      ? "ได้รับสินค้าแล้ว"
    : awaitingReceive
      ? "ติดตามออเดอร์"
    : order.receivedAtUtc
      ? "ดูรายละเอียด"
      : "ติดตามออเดอร์";
  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) return;
    router.push(orderHref);
  };

  const handleConfirmReceived = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (confirmingReceived) return;

    setConfirmingReceived(true);
    setConfirmReceiveError(null);

    try {
      await confirmOrderReceived(order.id);
      setSelectedPromptRating(0);
      setShowRatingPrompt(true);
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
  const handleReviewRatingSelect = (rating: number) => {
    if (ratingPromptTimerRef.current) return;

    setSelectedPromptRating(rating);
    ratingPromptTimerRef.current = window.setTimeout(() => {
      router.push(`/orders/${order.id}/review?rating=${rating}`);
    }, 650);
  };
  const handleCloseRatingPrompt = () => {
    if (ratingPromptTimerRef.current) {
      window.clearTimeout(ratingPromptTimerRef.current);
      ratingPromptTimerRef.current = null;
    }
    setSelectedPromptRating(0);
    setShowRatingPrompt(false);
  };

  useEffect(() => {
    return () => {
      if (ratingPromptTimerRef.current) {
        window.clearTimeout(ratingPromptTimerRef.current);
      }
    };
  }, []);
  const getReorderItems = () =>
    previewItems
      .map(mapPreviewItemToCartItem)
      .filter((item): item is CartItem => Boolean(item));
  const addReorderItemsToCart = () => {
    const cartItems = getReorderItems();

    cartItems.forEach((item) => {
      addItem({
        product: cartItemToProduct(item),
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        variantId: item.variantId,
        imageUrl: item.imageUrl,
      });
    });

    return cartItems;
  };
  const handleAddReorderToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    addReorderItemsToCart();
  };
  const handleBuyAgain = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const cartItems = addReorderItemsToCart();
    if (cartItems.length === 0) return;

    storeCartSelectionCheckout(
      cartItems.map((item) => ({
        key: getCartItemKey(item),
        item,
      }))
    );
    router.push("/checkout?mode=cart-selection");
  };
  const handleWriteReview = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    router.push(`/orders/${order.id}/review`);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className="group relative touch-pan-y cursor-pointer overflow-hidden bg-white transition hover:-translate-y-0.5 hover:shadow-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              {isShipped ? (
                <PackageCheck className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-extrabold text-ink">
                PonPon Official
              </p>
              <p className="line-clamp-1 text-[10px] font-semibold text-ink-soft">
                {order.orderDate ? formatDate(order.orderDate) : "—"}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            {returnRefundBadgeText ? (
              <span
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold leading-none shadow-sm ring-1 ring-current/10 ${manualRefundBadgeClass}`}
              >
                <span className="block translate-y-px">
                  {returnRefundBadgeText}
                </span>
              </span>
            ) : (
              <OrderStatusBadge status={orderStatus} />
            )}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="space-y-3">
              {isPreviewLoading ? (
                <div className="flex min-w-0 items-start gap-3">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-brand-soft/80 sm:h-24 sm:w-24" />
                  <div className="min-w-0 flex-1 space-y-2.5 pt-1">
                    <div className="h-4 w-4/5 animate-pulse rounded-full bg-black/[0.06]" />
                    <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-black/[0.05]" />
                    <div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-black/[0.06]" />
                  </div>
                </div>
              ) : visiblePreviewItems.length > 0 ? (
                <>
                  {visiblePreviewItems.map((item) => (
                    <div key={item.id} className="flex min-w-0 items-start gap-3">
                      {item.imageUrl ? (
                        <ProductImage
                          imageUrl={item.imageUrl}
                          emoji="📦"
                          size="sm"
                          className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-muted text-ink-soft ring-1 ring-black/[0.04] sm:h-24 sm:w-24">
                          <ShoppingBag className="h-5 w-5" />
                          <span className="mt-1 text-[10px] font-bold">ไม่มีรูป</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-ink sm:text-[15px]">
                            {item.name}
                          </p>
                          <p className="shrink-0 text-xs font-bold text-ink-soft">
                            x{item.quantity}
                          </p>
                        </div>
                        {item.optionLabels.length > 0 && (
                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-ink-soft">
                            {item.optionLabels.join(" · ")}
                          </p>
                        )}
                        <div className="mt-3 text-right">
                          <span className="text-sm font-extrabold text-brand">
                            {formatBaht(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMoreItems && (
                    <button
                      type="button"
                      onClick={() => setItemsExpanded((value) => !value)}
                      className="relative z-20 flex w-full items-center justify-center gap-1.5 border-t border-black/[0.05] pt-2 text-sm font-bold text-ink-soft transition hover:text-brand active:scale-[0.99]"
                    >
                      {itemsExpanded ? "ย่อรายการ" : "ดูเพิ่มเติม"}
                      {!itemsExpanded && hiddenPreviewCount > 0 && (
                        <span className="text-xs font-semibold">
                          ({hiddenPreviewCount} รายการ)
                        </span>
                      )}
                      <ChevronRight
                        className={`h-4 w-4 transition ${
                          itemsExpanded ? "-rotate-90" : "rotate-90"
                        }`}
                      />
                    </button>
                  )}
                  {itemsExpanded && hiddenPreviewCount > previewHiddenCount && (
                    <p className="text-center text-xs font-bold text-brand">
                      + อีก {hiddenPreviewCount - previewHiddenCount} รายการในรายละเอียด
                    </p>
                  )}
                </>
              ) : (
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand sm:h-24 sm:w-24">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold text-ink">ออเดอร์ {order.number}</p>
                    {order.trackingNo && (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        เลขพัสดุ: {order.trackingNo}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="truncate text-[11px] font-semibold text-ink-soft">
                {returnRefundBadgeText ?? helperByStatus[orderStatus]}
              </p>
              <span className="shrink-0 text-[10px] font-bold text-brand">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-soft">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ff5457,#ed171c)] shadow-[0_0_8px_rgba(237,23,28,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.05] bg-surface-muted/45 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-soft">
              {isPreviewLoading
                ? "กำลังโหลดรายการสินค้า"
                : `สินค้ารวม ${itemsCount || previewItems.length || 1} รายการ`}
            </p>
            <p className="text-base font-extrabold text-ink">
              รวม {formatBaht(order.amount)}
            </p>
            {confirmReceiveError && (
              <p className="mt-1 text-xs font-bold text-red-600">
                {confirmReceiveError}
              </p>
            )}
          </div>
          {canConfirmReceived ? (
            <button
              type="button"
              onClick={handleConfirmReceived}
              disabled={confirmingReceived}
              className="flex shrink-0 items-center gap-1 rounded-full border border-brand bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(237,23,28,0.18)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmingReceived ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PackageCheck className="h-3.5 w-3.5" />
              )}
              {confirmingReceived ? "กำลังยืนยัน..." : actionLabel}
            </button>
          ) : order.receivedAtUtc && !isAwaitingReview ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleAddReorderToCart}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand bg-white text-brand transition active:scale-95"
                aria-label="เพิ่มลงตะกร้า"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleBuyAgain}
                className="flex items-center gap-1 rounded-full border border-brand bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(237,23,28,0.18)] transition active:scale-95"
              >
                ซื้ออีกครั้ง
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : isAwaitingReview ? (
            <button
              type="button"
              onClick={handleWriteReview}
              className="flex shrink-0 items-center gap-1 rounded-full border border-brand bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(237,23,28,0.18)] transition active:scale-95"
            >
              <Star className="h-3.5 w-3.5" />
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={orderHref}
              className="flex shrink-0 items-center gap-1 rounded-full border border-brand bg-white px-4 py-2 text-xs font-extrabold text-brand transition active:scale-95"
            >
              {actionLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Card>
      {showRatingPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={handleCloseRatingPrompt}
        >
          <div
            className="relative w-full max-w-sm rounded-[1.75rem] bg-white px-5 pb-6 pt-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseRatingPrompt}
              aria-label="ปิด"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-ink-soft transition active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <PackageCheck className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-extrabold text-ink">
              ได้รับสินค้าแล้ว
            </h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink-soft">
              ให้คะแนนสินค้าเพื่อเริ่มเขียนรีวิว
            </p>
            <div className="mt-5 flex justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => {
                const rating = index + 1;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleReviewRatingSelect(rating)}
                    disabled={selectedPromptRating > 0}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft transition hover:scale-105 active:scale-95 disabled:cursor-wait"
                    aria-label={`${rating} ดาว`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        rating <= selectedPromptRating
                          ? "fill-amber-400 text-amber-500"
                          : "fill-white text-ink-soft/45"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type TabPagination = { page: number; hasMore: boolean };

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = useMemo(() => {
    if (isPageReload()) return "all";
    return parseOrderFilter(searchParams.get("filter"));
  }, [searchParams]);
  const initialNotificationCounts = useMemo(
    () => readOrderNotificationCounts(),
    []
  );
  const initialNotificationSeenCounts = useMemo(
    () => readOrderNotificationSeenCounts(),
    []
  );
  const hasInitialNotificationCounts =
    Object.keys(initialNotificationCounts).length > 0;
  const [ordersCache, setOrdersCache] = useState<Partial<Record<OrderFilter, ApiOrderListItem[]>>>({});
  const [paginationCache, setPaginationCache] = useState<Partial<Record<OrderFilter, TabPagination>>>({});
  const [loadingTab, setLoadingTab] = useState<OrderFilter | null>(initialFilter);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(
    hasInitialNotificationCounts
      ? getOrderNotificationTotal(initialNotificationCounts)
      : null
  );
  const [orderNotificationCounts, setOrderNotificationCounts] = useState<
    Partial<Record<OrderFilter, number>>
  >(initialNotificationCounts);
  const [orderNotificationSeenCounts, setOrderNotificationSeenCounts] =
    useState<Partial<Record<OrderFilter, number>>>(
      initialNotificationSeenCounts
    );
  const [activeFilter, setActiveFilter] = useState<OrderFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [showReviewThankYou, setShowReviewThankYou] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<OrderFilter>>(
    () => new Set()
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRefs = useRef<Partial<Record<OrderFilter, HTMLButtonElement>>>(
    {}
  );
  const fetchingRef = useRef(false);
  const loadedTabsRef = useRef<Set<OrderFilter>>(new Set());
  const reloadUrlResetRef = useRef(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("ponpon.review.thank-you") !== "1") return;

    window.sessionStorage.removeItem("ponpon.review.thank-you");
    const timer = window.setTimeout(() => setShowReviewThankYou(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reloadUrlResetRef.current) return;
    if (!isPageReload() || !searchParams.has("filter")) return;

    reloadUrlResetRef.current = true;
    router.replace("/orders", { scroll: false });
  }, [router, searchParams]);

  const orders = ordersCache[activeFilter] ?? EMPTY_ORDERS;
  const { page = 0, hasMore = true } = paginationCache[activeFilter] ?? {};
  const loading = loadingTab === activeFilter;
  const activeTabLoaded = loadedTabs.has(activeFilter);
  const shouldShowInitialLoading =
    loading || (!activeTabLoaded && orders.length === 0);

  const loadOrdersPage = useCallback(
    async (filter: OrderFilter, nextPage: number, mode: "replace" | "append" = "append") => {
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      setLoadMoreError(null);
      if (mode === "replace") {
        setError(null);
        setLoadingTab(filter);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetchOrdersWithClientFallback(
          filter,
          nextPage,
          ORDER_PAGE_SIZE
        );

        setOrdersCache((prev) => {
          const current = prev[filter] ?? [];
          const items =
            mode === "replace"
              ? response.items
              : (() => {
                  const seen = new Set(current.map((o) => o.id));
                  return [...current, ...response.items.filter((o) => !seen.has(o.id))];
                })();
          return { ...prev, [filter]: items };
        });
        setPaginationCache((prev) => ({
          ...prev,
          [filter]: { page: response.page, hasMore: response.hasMore },
        }));
        loadedTabsRef.current.add(filter);
        setLoadedTabs((prev) => new Set(prev).add(filter));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "โหลดรายการออเดอร์ไม่สำเร็จ";
        if (mode === "replace") {
          setError(message);
        } else {
          setLoadMoreError(message);
        }
      } finally {
        fetchingRef.current = false;
        setLoadingTab(null);
        setLoadingMore(false);
      }
    },
    [
      setError,
      setLoadMoreError,
      setLoadingMore,
      setLoadingTab,
      setLoadedTabs,
      setOrdersCache,
      setPaginationCache,
    ]
  );

  useEffect(() => {
    if (loadedTabs.has(activeFilter)) return;

    const timer = window.setTimeout(() => {
      fetchingRef.current = false;
      void loadOrdersPage(activeFilter, 1, "replace");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeFilter, loadOrdersPage, loadedTabs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      filterButtonRefs.current[activeFilter]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeFilter]);

  useEffect(() => {
    let cancelled = false;

    void fetchOrderNotificationCounts()
      .then((counts) => {
        if (cancelled) return;
        setOrderNotificationCounts(counts);
        writeOrderNotificationCounts(counts);
        setActiveOrderCount(getOrderNotificationTotal(counts));
        const storedSeenCounts = readOrderNotificationSeenCounts();
        setOrderNotificationSeenCounts(() => {
          const next = { ...storedSeenCounts };
          for (const filter of ORDER_NOTIFICATION_FILTERS) {
            const seenCount = next[filter] ?? 0;
            const currentCount = counts[filter] ?? 0;
            if (seenCount > currentCount) next[filter] = currentCount;
          }
          writeOrderNotificationSeenCounts(next);
          return next;
        });
      })
      .catch((countError: unknown) => {
        console.error("[orders] Failed to load active order count", countError);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || shouldShowInitialLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fetchingRef.current) {
          void loadOrdersPage(activeFilter, page + 1);
        }
      },
      { rootMargin: "480px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeFilter, hasMore, loadOrdersPage, page, shouldShowInitialLoading]);

  const normalizedQuery = query.trim().toLocaleLowerCase("th");

  const markOrderNotificationSeen = (filter: OrderFilter) => {
    if (!ORDER_NOTIFICATION_FILTERS.includes(filter)) return;

    setOrderNotificationSeenCounts((current) => {
      const next = {
        ...current,
        [filter]: orderNotificationCounts[filter] ?? 0,
      };
      writeOrderNotificationSeenCounts(next);
      return next;
    });
  };

  const handleFilterChange = (filter: OrderFilter) => {
    const filterLoaded = loadedTabs.has(filter);
    markOrderNotificationSeen(filter);
    setActiveFilter(filter);
    if (shouldReloadOrderFilter(filter)) {
      setLoadingTab(filter);
      setOrdersCache((prev) => ({ ...prev, [filter]: [] }));
      setPaginationCache((prev) => ({
        ...prev,
        [filter]: { page: 0, hasMore: true },
      }));
      loadedTabsRef.current.delete(filter);
      setLoadedTabs((prev) => {
        const next = new Set(prev);
        next.delete(filter);
        return next;
      });
      return;
    }
    if (!filterLoaded && (ordersCache[filter]?.length ?? 0) === 0) {
      setLoadingTab(filter);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      return (
        !normalizedQuery ||
        order.number.toLocaleLowerCase("th").includes(normalizedQuery) ||
        order.id.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, orders]);


  if (error) {
    return (
      <>
        <AppHeader title="ออเดอร์ของฉัน" />
        <PageContainer className={ORDER_PAGE_CONTAINER_CLASS}>
          <EmptyState
            emoji="⚠️"
            title="โหลดออเดอร์ไม่สำเร็จ"
            description={error}
            action={
              <Button onClick={() => window.location.reload()}>ลองใหม่</Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <AppHeader title="ออเดอร์ของฉัน" />
      <PageContainer className={ORDER_PAGE_CONTAINER_CLASS}>
        {activeFilter === "all" && orders.length === 0 && !shouldShowInitialLoading ? (
          <EmptyState
            emoji="📦"
            title="ยังไม่มีคำสั่งซื้อ"
            description="เริ่มช้อปกับ Pon Pon ได้เลย"
            action={
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            }
          />
        ) : (
          <>
            <section className="mb-4 overflow-hidden rounded-card bg-brand px-4 py-4 text-white shadow-[0_12px_28px_rgba(190,9,14,0.2)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/75">
                    สถานะการสั่งซื้อ
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold">
                    {activeOrderCount === null ? (
                      <span
                        className="inline-block h-7 w-48 animate-pulse rounded-lg bg-white/20 align-middle"
                        aria-label="กำลังโหลดยอดออเดอร์"
                      />
                    ) : (
                      `${activeOrderCount} ออเดอร์กำลังดำเนินการ`
                    )}
                  </h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16">
                  <ShoppingBag className="h-6 w-6" />
                </span>
              </div>
              <Link
                href="/products"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/90"
              >
                ช้อปต่อ
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="mb-4 overflow-hidden rounded-card bg-white shadow-[0_9px_26px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]">
              <div className="no-scrollbar flex overflow-x-auto border-b border-black/[0.05] px-2 pt-1">
                {orderTabs.map((filter) => {
                  const isActive = activeFilter === filter.value;
                  const hasNotification =
                    (orderNotificationCounts[filter.value] ?? 0) >
                    (orderNotificationSeenCounts[filter.value] ?? 0);
                  return (
                    <button
                      key={filter.value}
                      ref={(node) => {
                        if (node) {
                          filterButtonRefs.current[filter.value] = node;
                        } else {
                          delete filterButtonRefs.current[filter.value];
                        }
                      }}
                      type="button"
                      onClick={() => handleFilterChange(filter.value)}
                      className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-bold transition ${
                        isActive ? "text-brand" : "text-ink-soft"
                      }`}
                    >
                      {filter.label}
                      {hasNotification && (
                        <span
                          className="absolute right-1.5 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white"
                          aria-label="มีรายการที่ต้องติดตาม"
                        />
                      )}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-brand" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative m-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  type="search"
                  aria-label="ค้นหาประวัติคำสั่งซื้อ"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาเลขออเดอร์"
                  className="w-full rounded-2xl border border-black/[0.06] bg-surface-muted/70 py-3 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-ink-soft/65 focus:border-brand/30 focus:bg-white focus:ring-3 focus:ring-brand/10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </section>

            {shouldShowInitialLoading ? (
              <div className="space-y-3">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    activeFilter={activeFilter}
                    previewItems={(order.itemsPreview ?? []).map(mapOrderItemToPreview)}
                    itemsCount={order.itemsCount ?? order.itemsPreview?.length ?? 0}
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-card bg-white shadow-sm ring-1 ring-black/[0.04]">
                <EmptyState
                  emoji="🗂️"
                  title="ไม่มีออเดอร์ในหมวดนี้"
                  description="ยังไม่มีออเดอร์ที่ตรงกับสถานะนี้"
                  action={
                    <button
                      type="button"
                      onClick={() => handleFilterChange("all")}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand"
                    >
                      <PackageSearch className="h-4 w-4" />
                      ดูออเดอร์ทั้งหมด
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="rounded-card bg-white shadow-sm ring-1 ring-black/[0.04]">
                <EmptyState
                  emoji=""
                  title="ไม่พบประวัติที่ค้นหา"
                  description="ลองเปลี่ยนสถานะ หรือตรวจสอบเลขออเดอร์อีกครั้ง"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        handleFilterChange("all");
                        setQuery("");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand"
                    >
                      <PackageSearch className="h-4 w-4" />
                      ดูออเดอร์ทั้งหมด
                    </button>
                  }
                />
              </div>
            )}

            <div ref={loadMoreRef} className="min-h-12">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                  กำลังโหลดออเดอร์เพิ่ม...
                </div>
              )}
              {loadMoreError && (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <p className="text-xs font-semibold text-ink-soft">
                    {loadMoreError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadOrdersPage(activeFilter, page + 1)}
                    className="rounded-full bg-brand-soft px-4 py-2 text-xs font-extrabold text-brand"
                  >
                    ลองโหลดเพิ่มอีกครั้ง
                  </button>
                </div>
              )}
              {!hasMore && orders.length > 0 && !loadingMore && !loadMoreError && (
                <p className="py-4 text-center text-xs font-semibold text-ink-soft">
                  แสดงครบแล้ว
                </p>
              )}
            </div>
          </>
        )}
      </PageContainer>
      {showReviewThankYou && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm"
          onClick={() => setShowReviewThankYou(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-thank-you-title"
            className="w-full max-w-sm rounded-card bg-white p-5 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowReviewThankYou(false)}
                aria-label="ปิด"
                className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-ink-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mx-auto -mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
              <PackageCheck className="h-8 w-8" />
            </div>
            <h2 id="review-thank-you-title" className="mt-4 text-lg font-extrabold text-ink">
              ขอบคุณสำหรับรีวิว
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-ink-soft">
              ขอขอบคุณแสดงความคิดเห็นในการสั่งซื้อ
            </p>
            <button
              type="button"
              onClick={() => setShowReviewThankYou(false)}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand px-4 text-sm font-extrabold text-white transition active:scale-[0.97]"
            >
              ดูคำสั่งซื้อทั้งหมด
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersPageContent />
    </Suspense>
  );
}

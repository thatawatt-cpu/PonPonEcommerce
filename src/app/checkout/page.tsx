"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Coins,
  Loader2,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Store,
  TicketPercent,
  Truck,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PromoCodeField } from "@/components/checkout/promo-code-field";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { ProductImage } from "@/components/product/product-image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { getCartItemKey } from "@/store/cart-store";
import {
  clearBuyNowCheckout,
  getStoredBuyNowCheckout,
} from "@/features/checkout/buy-now-checkout";
import {
  clearCartSelectionCheckout,
  getStoredCartSelectionCheckout,
  type CartSelectionCheckoutItem,
} from "@/features/checkout/cart-selection-checkout";
import { fetchCustomerAddresses } from "@/features/customer-addresses/customer-address-api";
import {
  ApiRequestError,
  createOrder,
  fetchPricingPreview,
} from "@/features/orders/order-api";
import { fetchShippingRates } from "@/features/shipping/shipping-api";
import {
  bahtToSatang,
  createCreditCardPayment,
  createMobileBankingPayment,
  createPromptPayPayment,
  satangToBaht,
  storePromptPayCharge,
} from "@/features/payments/payment-api";
import { tokenizeCard } from "@/features/payments/omise-card";
import {
  getSelectedAddressId,
  setSelectedAddressId as rememberSelectedAddressId,
  toSavedAddress,
  type SavedAddress,
} from "@/lib/address-storage";
import { calculateEarnedPoints, getTierBySpend } from "@/lib/membership";
import { formatBaht } from "@/lib/format";
import { SHIPPING_FEE } from "@/lib/constants";
import { consumePendingCouponCode } from "@/features/coupons/pending-coupon";
import {
  useMembershipHydrated,
  useMembershipStore,
} from "@/store/membership-store";
import type { ShippingInfo } from "@/types/customer";
import type { PaymentMethod } from "@/types/order";
import type { CartItem } from "@/types/cart";
import type {
  ApiMobileBankingType,
  ApiPricingPreviewResponse,
} from "@/types/api";
import type { ShippingRateOption, ShippingRateRequest } from "@/features/shipping/shipping-types";

interface CreditCardFormState {
  name: string;
  number: string;
  expiry: string;
  securityCode: string;
}

const PENDING_PAYMENT_STORAGE_KEY = "ponpon.pendingPayment";
const CHECKOUT_COUPON_SECTION_ID = "checkout-coupon-section";

const emptyCardForm: CreditCardFormState = {
  name: "",
  number: "",
  expiry: "",
  securityCode: "",
};

const emptyShippingInfo: ShippingInfo = {
  customerName: "",
  phone: "",
  address: "",
  note: "",
};

function SummaryLine({
  label,
  value,
  strong = false,
  tone = "default",
  loading = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "default" | "discount" | "brand";
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={strong ? "font-bold text-ink" : "text-ink-soft"}>
        {label}
      </span>
      <span
        aria-busy={loading}
        aria-live="polite"
        className={`min-w-20 text-right tabular-nums transition-colors ${
          tone === "discount"
            ? "font-bold text-success"
            : tone === "brand"
              ? "text-lg font-extrabold text-brand"
              : strong
                ? "font-extrabold text-ink"
                : "font-semibold text-ink"
        }`}
      >
        {loading ? (
          <span className="ml-auto flex min-w-20 justify-end">
            <Loader2
              aria-label="กำลังโหลด"
              className={`animate-spin ${
                tone === "brand"
                  ? "h-5 w-5 text-brand"
                  : "h-4 w-4 text-ink-soft"
              }`}
            />
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function CheckoutProductRows({ items }: { items: CartItem[] }) {
  return (
    <div className="divide-y divide-black/[0.05]">
      {items.map((item) => {
        const optionText = item.selectedOptions
          ? Object.entries(item.selectedOptions)
              .map(([name, value]) => `${name}: ${value}`)
              .join(" · ")
          : "";

        return (
          <div key={getCartItemKey(item)} className="flex gap-3 py-3">
            <ProductImage
              imageUrl={item.imageUrl}
              emoji={item.emoji}
              size="sm"
              className="h-20 w-20 shrink-0 rounded-xl bg-surface-muted"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getCheckoutPaymentLabel(method: PaymentMethod): string {
  if (method === "credit_card") return "Credit Card";
  if (method === "mobile_banking") return "Mobile Banking";
  return "QR พร้อมเพย์";
}

function buildSuccessPath(input: {
  orderId: string;
  orderNo: string;
  points: number;
  spend: number;
}) {
  const params = new URLSearchParams({
    orderId: input.orderId,
    orderNo: input.orderNo,
    points: String(input.points),
    spend: String(input.spend),
  });

  return `/order/success?${params.toString()}`;
}

function buildPaymentExpiredPath(input: { orderId: string; orderNo: string }) {
  const params = new URLSearchParams({
    orderId: input.orderId,
    orderNo: input.orderNo,
  });

  return `/payment/expired?${params.toString()}`;
}

function canRequestPayment(expiresAt: string) {
  const deadline = new Date(expiresAt).getTime();
  return Number.isFinite(deadline) && deadline > Date.now();
}

function extractPostcode(address: string): string {
  return address.match(/\b\d{5}\b/)?.[0] ?? "";
}

function buildShippingRateRequest(
  shipping: Pick<ShippingInfo, "customerName" | "phone" | "address">,
  items: CartItem[],
  address?: SavedAddress | null
): ShippingRateRequest {
  const parcelQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    toName: shipping.customerName.trim(),
    toPhone: shipping.phone.trim(),
    toEmail: address?.email ?? "",
    toAddress: address?.addressLine1 || shipping.address.trim(),
    toDistrict: address?.subdistrict ?? "",
    toState: address?.district ?? "",
    toProvince: address?.province ?? "",
    toPostcode: address?.postcode || extractPostcode(shipping.address),
    parcelName: items.length === 1 ? items[0].name : "สินค้า PonPon",
    weightKg: Math.max(parcelQuantity, 1),
    widthCm: 20,
    lengthCm: 30,
    heightCm: 10,
  };
}

function storePendingRedirectPayment(input: {
  chargeId: string;
  orderId: string;
  orderNo: string;
  points: number;
  spend: number;
}) {
  window.sessionStorage.setItem(
    PENDING_PAYMENT_STORAGE_KEY,
    JSON.stringify(input)
  );
}

const COUPON_ERROR_MESSAGES: Record<string, string> = {
  coupon_invalid: "คูปองนี้ไม่ถูกต้อง",
  coupon_duplicate: "คูปองนี้ถูกใช้แล้ว",
  coupon_inactive_or_quota_exhausted: "คูปองนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน",
  coupon_customer_usage_limit_reached: "คุณใช้คูปองนี้ครบสิทธิ์แล้ว",
  coupon_cannot_combine_with_flash_sale:
    "คูปองนี้ใช้ร่วมกับสินค้า Flash Sale ไม่ได้",
  coupon_cannot_combine_with_promotion:
    "คูปองนี้ใช้ร่วมกับโปรโมชันนี้ไม่ได้",
  coupon_cannot_stack_with_coupon: "คูปองนี้ใช้ร่วมกับคูปองอื่นไม่ได้",
  coupon_stack_limit_exceeded:
    "ใช้คูปองได้สูงสุด 2 ใบ: คูปองส่วนลด 1 ใบ และคูปองส่งฟรี 1 ใบ",
  coupon_customer_not_eligible: "บัญชีนี้ยังไม่เข้าเงื่อนไขคูปองนี้",
  coupon_product_not_eligible: "คูปองนี้ใช้กับสินค้าที่เลือกไม่ได้",
  coupon_payment_method_not_eligible:
    "คูปองนี้ใช้กับช่องทางชำระเงินที่เลือกไม่ได้",
  coupon_shipping_channel_not_eligible:
    "คูปองนี้ใช้กับขนส่งที่เลือกไม่ได้",
  coupon_sales_channel_not_eligible: "คูปองนี้ใช้กับช่องทางขายนี้ไม่ได้",
  coupon_condition_not_eligible: "ออเดอร์นี้ยังไม่เข้าเงื่อนไขคูปอง",
  coupon_invalid_discount_type: "ประเภทส่วนลดของคูปองนี้ไม่ถูกต้อง",
  coupon_quota_no_longer_available: "คูปองนี้เพิ่งหมดสิทธิ์แล้ว",
};

const QUOTE_ERROR_MESSAGES: Record<string, string> = {
  quote_required: "กรุณารอระบบยืนยันยอดล่าสุดก่อนชำระเงิน",
  quote_not_found: "ไม่พบยอดยืนยันล่าสุด กรุณารอสักครู่แล้วลองใหม่",
  quote_expired: "ยอดยืนยันหมดอายุแล้ว กรุณารอระบบคำนวณใหม่",
  quote_not_final: "ยอดนี้ยังไม่พร้อมสร้างคำสั่งซื้อ กรุณารอสักครู่",
  quote_shipping_not_finalized: "กรุณารอระบบยืนยันค่าจัดส่งก่อนชำระเงิน",
  quote_mismatch: "ข้อมูลคำสั่งซื้อเปลี่ยนไป กรุณารอระบบคำนวณยอดใหม่",
};

function getErrorDetails(err: ApiRequestError): Record<string, unknown> | null {
  return err.details && typeof err.details === "object"
    ? (err.details as Record<string, unknown>)
    : null;
}

function getNumberDetail(
  details: Record<string, unknown> | null,
  key: string
): number | null {
  const value = details?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCouponErrorMessage(
  err: unknown,
  fallbackMessage =
    "ใช้คูปองได้สูงสุด 2 ใบ: คูปองส่วนลด 1 ใบ และคูปองส่งฟรี 1 ใบ"
): string {
  if (err instanceof ApiRequestError && err.code) {
    const details = getErrorDetails(err);

    if (err.code === "coupon_minimum_subtotal_not_met") {
      const remainingSubtotal = getNumberDetail(details, "remainingSubtotal");
      const eligibleSubtotal = getNumberDetail(details, "eligibleSubtotal");
      if (remainingSubtotal != null && remainingSubtotal > 0) {
        const eligibleText =
          eligibleSubtotal != null
            ? ` ยอดสินค้าที่เข้าเงื่อนไขตอนนี้ ${eligibleSubtotal.toLocaleString(
                "th-TH"
              )} บาท`
            : "";
        return `ซื้อเพิ่มอีก ${remainingSubtotal.toLocaleString("th-TH")} บาทเพื่อใช้คูปองนี้${eligibleText}`;
      }
      return "ยอดสินค้ายังไม่ถึงขั้นต่ำของคูปองนี้";
    }

    return (
      COUPON_ERROR_MESSAGES[err.code] ??
      QUOTE_ERROR_MESSAGES[err.code] ??
      err.message
    );
  }

  return err instanceof Error
    ? err.message
    : fallbackMessage;
}

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; promo?: string }>;
}) {
  const { mode, promo } = use(searchParams);
  const router = useRouter();
  const hydrated = useCartHydrated();
  const membershipHydrated = useMembershipHydrated();
  const isBuyNowCheckout = mode === "buy-now";
  const isCartSelectionCheckout = mode === "cart-selection";

  const cartItems = useCartStore((s) => s.items);
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const cartShippingFee = useCartStore((s) => s.shippingFee());
  const clearCart = useCartStore((s) => s.clearCart);
  const removeCartItem = useCartStore((s) => s.removeItem);
  const lifetimeSpend = useMembershipStore((state) => state.lifetimeSpend);

  const [shipping, setShipping] =
    useState<ShippingInfo>(emptyShippingInfo);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [bankType, setBankType] =
    useState<ApiMobileBankingType>("mobile_banking_kbank");
  const [cardForm, setCardForm] =
    useState<CreditCardFormState>(emptyCardForm);
  const [promoCode, setPromoCode] = useState("");
  const [couponCodes, setCouponCodes] = useState<string[]>([]);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [pricingPreview, setPricingPreview] =
    useState<ApiPricingPreviewResponse | null>(null);
  const [pricingPreviewSignature, setPricingPreviewSignature] = useState("");
  const [pricingPreviewLoading, setPricingPreviewLoading] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRateOption[]>([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [shippingRatesError, setShippingRatesError] = useState<string | null>(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [shippingQuoteResolved, setShippingQuoteResolved] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [cartSelectionItems, setCartSelectionItems] = useState<
    CartSelectionCheckoutItem[]
  >([]);
  const [checkoutSourceLoaded, setCheckoutSourceLoaded] = useState(
    !isBuyNowCheckout && !isCartSelectionCheckout
  );

  const items = useMemo(
    () => {
      if (isBuyNowCheckout) return buyNowItem ? [buyNowItem] : [];
      if (isCartSelectionCheckout) {
        return cartSelectionItems.map(({ item }) => item);
      }
      return cartItems;
    },
    [
      buyNowItem,
      cartItems,
      cartSelectionItems,
      isBuyNowCheckout,
      isCartSelectionCheckout,
    ]
  );
  const usesStoredCheckoutItems = isBuyNowCheckout || isCartSelectionCheckout;
  const subtotal = usesStoredCheckoutItems
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : cartSubtotal;
  const fallbackShippingFee = usesStoredCheckoutItems
    ? items.length > 0
      ? SHIPPING_FEE
      : 0
    : cartShippingFee;
  const selectedShippingRate = shippingRates[0] ?? null;
  const shippingFee = selectedShippingRate?.price ?? fallbackShippingFee;
  const selectedAddress = savedAddresses.find(
    (address) => address.id === selectedAddressId
  );
  const canLoadShippingRates =
    hydrated &&
    !(usesStoredCheckoutItems && !checkoutSourceLoaded) &&
    items.length > 0 &&
    Boolean(shipping.customerName.trim()) &&
    Boolean(shipping.phone.trim()) &&
    Boolean(shipping.address.trim());
  const shippingRateRequest = useMemo(
    () =>
      canLoadShippingRates
        ? buildShippingRateRequest(
            {
              customerName: shipping.customerName,
              phone: shipping.phone,
              address: shipping.address,
            },
            items,
            selectedAddress
          )
        : null,
    [
      canLoadShippingRates,
      items,
      selectedAddress,
      shipping.address,
      shipping.customerName,
      shipping.phone,
    ]
  );
  const previewCanLoad =
    canLoadShippingRates;
  const totalLoading =
    !addressesLoaded ||
    (canLoadShippingRates && !shippingQuoteResolved);
  const apiPaymentMethod = method === "mobile_banking" ? bankType : method;
  const currentPricingPreviewSignature = useMemo(
    () =>
      JSON.stringify({
        customerEmail: selectedAddress?.email || null,
        shippingName: shipping.customerName.trim(),
        shippingPhone: shipping.phone.trim(),
        shippingAddress: shipping.address.trim(),
        shippingChannel: selectedShippingRate?.courierCode ?? null,
        paymentMethod: apiPaymentMethod,
        couponCodes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      }),
    [
      apiPaymentMethod,
      couponCodes,
      items,
      selectedAddress?.email,
      selectedShippingRate?.courierCode,
      shipping.address,
      shipping.customerName,
      shipping.phone,
    ]
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!shippingRateRequest) {
        setShippingRates([]);
        setShippingRatesError(null);
        setShippingRatesLoading(false);
        setShippingQuoteResolved(true);
        return;
      }

      setShippingQuoteResolved(false);
      setShippingRatesLoading(true);
      setShippingRatesError(null);

      fetchShippingRates(shippingRateRequest)
        .then((rates) => {
          if (cancelled) return;
          setShippingRates(rates);
        })
        .catch((err) => {
          if (cancelled) return;
          setShippingRates([]);
          setShippingRatesError(
            err instanceof Error ? err.message : "Shipping rates failed"
          );
        })
        .finally(() => {
          if (!cancelled) {
            setShippingRatesLoading(false);
            setShippingQuoteResolved(true);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shippingRateRequest]);

  useEffect(() => {
    router.prefetch("/payment");
  }, [router]);

  useEffect(() => {
    const nextCode = promo?.trim().toUpperCase();
    if (!nextCode) return;

    const timer = window.setTimeout(() => {
      setCouponCodes((current) => {
        if (current.includes(nextCode)) {
          setPromoMessage("คูปองนี้ถูกใช้แล้ว");
          setPromoError(true);
          return current;
        }

        if (current.length >= 2) {
          setPromoMessage(
            "ใช้คูปองได้สูงสุด 2 ใบ: คูปองส่วนลด 1 ใบ และคูปองส่งฟรี 1 ใบ"
          );
          setPromoError(true);
          return current;
        }

        setPromoMessage("");
        setPromoError(false);
        return [...current, nextCode];
      });

      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      router.replace(
        params.size > 0 ? `/checkout?${params.toString()}` : "/checkout",
        { scroll: false }
      );

      window.setTimeout(() => {
        document.getElementById(CHECKOUT_COUPON_SECTION_ID)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [mode, promo, router]);

  useEffect(() => {
    if (promo) return;

    const nextCode = consumePendingCouponCode();
    if (!nextCode) return;

    const timer = window.setTimeout(() => {
      setCouponCodes((current) => {
        if (current.includes(nextCode)) {
          setPromoMessage("คูปองนี้ถูกใช้แล้ว");
          setPromoError(true);
          return current;
        }

        if (current.length >= 2) {
          setPromoMessage(
            "ใช้คูปองได้สูงสุด 2 ใบ: คูปองส่วนลด 1 ใบ และคูปองส่งฟรี 1 ใบ"
          );
          setPromoError(true);
          return current;
        }

        setPromoMessage("");
        setPromoError(false);
        return [...current, nextCode];
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [promo]);

  useEffect(() => {
    if (!usesStoredCheckoutItems) return;

    const timer = window.setTimeout(() => {
      if (isBuyNowCheckout) {
        setBuyNowItem(getStoredBuyNowCheckout());
      }
      if (isCartSelectionCheckout) {
        setCartSelectionItems(getStoredCartSelectionCheckout());
      }
      setCheckoutSourceLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isBuyNowCheckout, isCartSelectionCheckout, usesStoredCheckoutItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCustomerAddresses()
        .then((items) => {
          const addresses = items.map(toSavedAddress);
          const storedSelectedId = getSelectedAddressId();
          const defaultAddress =
            addresses.find((address) => address.id === storedSelectedId) ??
            addresses.find((address) => address.isDefault) ?? addresses[0];

          setSavedAddresses(addresses);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setShippingQuoteResolved(false);
            setShipping({
              customerName: defaultAddress.customerName,
              phone: defaultAddress.phone,
              address: defaultAddress.address,
              note: defaultAddress.note,
            });
          } else {
            setSelectedAddressId(null);
            setShipping({ ...emptyShippingInfo });
            setShippingQuoteResolved(true);
          }
        })
        .catch(() => {
          setSavedAddresses([]);
          setSelectedAddressId(null);
          setShipping({ ...emptyShippingInfo });
          setShippingQuoteResolved(true);
        })
        .finally(() => setAddressesLoaded(true));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectAddress = (address: SavedAddress) => {
    rememberSelectedAddressId(address.id);
    setSelectedAddressId(address.id);
    setShippingQuoteResolved(false);
    setShipping({
      customerName: address.customerName,
      phone: address.phone,
      address: address.address,
      note: address.note,
    });
    setAddressPickerOpen(false);
    setPlaceError(null);
  };

  const pricingPreviewIsCurrent =
    pricingPreview != null &&
    pricingPreviewSignature === currentPricingPreviewSignature;
  const currentPricingPreview = pricingPreviewIsCurrent
    ? pricingPreview
    : null;
  const currentQuoteId =
    currentPricingPreview && typeof currentPricingPreview.quoteId === "string"
      ? currentPricingPreview.quoteId
      : null;
  const finalPricingQuote =
    currentQuoteId &&
    currentPricingPreview?.isFinal === true &&
    currentPricingPreview.shippingFinalized === true &&
    currentPricingPreview.calculationStatus === "final"
      ? currentPricingPreview
      : null;
  const manualShippingRequired =
    currentPricingPreview?.calculationStatus === "manual_shipping_required";
  const waitingForFinalQuote =
    previewCanLoad &&
    !manualShippingRequired &&
    (!finalPricingQuote || pricingPreviewLoading);
  const totalConfirming = totalLoading || waitingForFinalQuote;
  const paymentBlocked = totalConfirming || manualShippingRequired;
  const previewPackages = currentPricingPreview?.packages ?? [];
  const estimatedAppliedCoupons =
    pricingPreview?.appliedCoupons.filter((coupon) =>
      couponCodes.includes(coupon.code)
    ) ?? [];
  const localShippingDiscountAmount = Math.min(
    shippingFee,
    estimatedAppliedCoupons
      .filter((coupon) => coupon.type === "free_shipping")
      .reduce((sum, coupon) => sum + coupon.discountAmount, 0)
  );
  const localCouponDiscountAmount = estimatedAppliedCoupons
    .filter((coupon) => coupon.type !== "free_shipping")
    .reduce((sum, coupon) => sum + coupon.discountAmount, 0);
  const previewSubtotal = pricingPreviewIsCurrent
    ? pricingPreview.itemSubtotal
    : subtotal;
  const previewShippingAmount = pricingPreviewIsCurrent
    ? pricingPreview.shippingAmount
    : shippingFee;
  const shippingDiscountAmount =
    pricingPreviewIsCurrent
      ? pricingPreview.shippingDiscountAmount
      : localShippingDiscountAmount;
  const couponDiscountAmount = pricingPreviewIsCurrent
    ? pricingPreview.couponDiscountAmount
    : localCouponDiscountAmount;
  const promotionDiscountAmount =
    pricingPreviewIsCurrent ? pricingPreview.promotionDiscountAmount : 0;
  const discountAmount =
    pricingPreviewIsCurrent
      ? pricingPreview.orderDiscountAmount
      : couponDiscountAmount + promotionDiscountAmount;
  const payableTotal =
    pricingPreviewIsCurrent
      ? pricingPreview.grandTotal
      : Math.max(
          subtotal + shippingFee - shippingDiscountAmount - discountAmount,
          0
        );
  const displayAppliedCoupons = pricingPreviewIsCurrent
    ? pricingPreview.appliedCoupons
    : estimatedAppliedCoupons;
  const memberTier = getTierBySpend(lifetimeSpend);
  const earnedPoints = calculateEarnedPoints(payableTotal, memberTier.id);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleAddresses = showAllAddresses
    ? savedAddresses
    : (() => {
        const firstTwo = savedAddresses.slice(0, 2);
        if (
          selectedAddress &&
          !firstTwo.some((address) => address.id === selectedAddress.id)
        ) {
          return [firstTwo[0], selectedAddress].filter(Boolean);
        }
        return firstTwo;
      })();

  useEffect(() => {
    if (!previewCanLoad) {
      const resetTimer = window.setTimeout(() => {
        setPricingPreview(null);
        setPricingPreviewSignature("");
        setPricingPreviewLoading(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    let cancelled = false;
    const requestSignature = currentPricingPreviewSignature;
    const timer = window.setTimeout(() => {
      setPricingPreviewLoading(true);

      fetchPricingPreview({
        customerEmail: selectedAddress?.email || null,
        shippingName: shipping.customerName.trim(),
        shippingPhone: shipping.phone.trim(),
        shippingAddress: shipping.address.trim(),
        shippingChannel: selectedShippingRate?.courierCode ?? null,
        paymentMethod: apiPaymentMethod,
        couponCodes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      })
        .then((preview) => {
          if (cancelled) return;
          setPricingPreview(preview);
          setPricingPreviewSignature(requestSignature);
          setPromoError(false);
          if (couponCodes.length > 0) {
            const appliedCodes = preview.appliedCoupons.map(
              (coupon) => coupon.code
            );
            const missingCodes = couponCodes.filter(
              (code) => !appliedCodes.includes(code)
            );
            setPromoMessage(
              missingCodes.length > 0
                ? `คูปอง ${missingCodes.join(", ")} ยังไม่ได้ถูกใช้กับออเดอร์นี้`
                : "ใช้คูปองเรียบร้อย"
            );
          } else {
            setPromoMessage("");
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setPricingPreview(null);
          setPromoError(true);
          setPromoMessage(getCouponErrorMessage(err));
        })
        .finally(() => {
          if (!cancelled) {
            setPricingPreviewLoading(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    checkoutSourceLoaded,
    apiPaymentMethod,
    couponCodes,
    currentPricingPreviewSignature,
    hydrated,
    items,
    previewCanLoad,
    selectedAddress?.email,
    selectedShippingRate?.courierCode,
    shipping.address,
    shipping.customerName,
    shipping.phone,
    shippingFee,
    usesStoredCheckoutItems,
  ]);

  const applyPromoCode = () => {
    const nextCode = promoCode.trim().toUpperCase();
    if (!nextCode) return;
    if (couponCodes.includes(nextCode)) {
      setPromoMessage("คูปองนี้ถูกใช้แล้ว");
      setPromoError(true);
      return;
    }
    if (couponCodes.length >= 2) {
      setPromoMessage(
        "ใช้คูปองได้สูงสุด 2 ใบ: คูปองส่วนลด 1 ใบ และคูปองส่งฟรี 1 ใบ"
      );
      setPromoError(true);
      return;
    }
    setCouponCodes((current) => [...current, nextCode]);
    setPromoCode("");
    setPromoMessage("");
    setPromoError(false);
  };

  const removePromoCode = (code: string) => {
    setCouponCodes((current) => current.filter((item) => item !== code));
    setPromoMessage("");
    setPromoError(false);
  };

  const clearSubmittedCheckout = () => {
    if (isBuyNowCheckout) {
      clearBuyNowCheckout();
      return;
    }

    if (isCartSelectionCheckout) {
      for (const { key } of cartSelectionItems) {
        removeCartItem(key);
      }
      clearCartSelectionCheckout();
      return;
    }

    clearCart();
  };

  const revealSection = (id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const validate = () => {
    if (!shipping.customerName.trim()) {
      setPlaceError("กรุณาเลือกหรือเพิ่มชื่อผู้รับ");
      revealSection("shipping-section");
      return false;
    }
    if (!shipping.phone.trim()) {
      setPlaceError("กรุณาเลือกหรือเพิ่มเบอร์โทรศัพท์");
      revealSection("shipping-section");
      return false;
    }
    if (!shipping.address.trim()) {
      setPlaceError("กรุณาเลือกหรือเพิ่มที่อยู่จัดส่ง");
      revealSection("shipping-section");
      return false;
    }
    if (method === "credit_card") {
      if (
        !cardForm.name.trim() ||
        !cardForm.number.trim() ||
        !cardForm.expiry.trim() ||
        !cardForm.securityCode.trim()
      ) {
        setPlaceError("กรุณากรอกข้อมูลบัตรให้ครบถ้วน");
        revealSection("payment-section");
        return false;
      }
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate() || placing || redirecting || totalLoading) return;
    const quoteId = currentQuoteId;
    if (manualShippingRequired) {
      setPlaceError("ออเดอร์นี้ต้องให้ร้านยืนยันค่าจัดส่งก่อนชำระเงิน");
      return;
    }

    if (!finalPricingQuote || !quoteId) {
      setPlaceError("กรุณารอระบบยืนยันยอดล่าสุดก่อนชำระเงิน");
      return;
    }

    setPlacing(true);
    setPlaceError(null);

    try {
      const creditCardTokenId =
        method === "credit_card"
          ? await tokenizeCard({
              ...cardForm,
              expirationMonth: cardForm.expiry.split("/")[0] ?? "",
              expirationYear: cardForm.expiry.split("/")[1] ?? "",
            })
          : null;

      const order = await createOrder({
        clientRequestId: crypto.randomUUID(),
        quoteId,
        customerName: shipping.customerName,
        customerEmail: null,
        customerPhone: shipping.phone,
        customerAddress: shipping.address,
        shippingName: shipping.customerName,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingChannel: selectedShippingRate?.courierCode ?? null,
        shippingAmount: shippingFee,
        paymentMethod: apiPaymentMethod,
        couponCodes,
        description: shipping.note || null,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })),
      });

      const paymentAmount = bahtToSatang(order.amount);
      const paymentDescription = order.number;
      const successPath = buildSuccessPath({
        orderId: order.id,
        orderNo: order.number,
        points: earnedPoints,
        spend: order.amount,
      });
      const returnUri = `${window.location.origin}/payment/complete?${new URLSearchParams(
        {
          orderId: order.id,
          orderNo: order.number,
          points: String(earnedPoints),
          spend: String(order.amount),
        }
      ).toString()}`;
      const mobileBankingReturnUri = `${window.location.origin}/payment/callback?${new URLSearchParams(
        {
          orderId: order.id,
          orderNo: order.number,
          points: String(earnedPoints),
          spend: String(order.amount),
        }
      ).toString()}`;

      if (method === "promptpay") {
        if (!canRequestPayment(order.paymentExpiresAt)) {
          setRedirecting(true);
          router.replace(
            buildPaymentExpiredPath({
              orderId: order.id,
              orderNo: order.number,
            })
          );
          window.setTimeout(clearSubmittedCheckout, 0);
          return;
        }

        const payment = await createPromptPayPayment({
          orderId: order.id,
        });
        const promptPayAmount = satangToBaht(payment.amount);
        storePromptPayCharge({
          orderId: order.id,
          orderNo: order.number,
          amount: promptPayAmount,
          chargeId: payment.chargeId,
          qrCodeUrl: payment.qrCodeUrl,
          expiresAt: payment.expiresAt,
          paymentExpiresAt: order.paymentExpiresAt,
          createdAt: new Date().toISOString(),
        });
        const params = new URLSearchParams({
          orderId: order.id,
          orderNo: order.number,
          amount: String(promptPayAmount),
          points: String(earnedPoints),
          chargeId: payment.chargeId,
          qrCodeUrl: payment.qrCodeUrl,
          expiresAt: payment.expiresAt,
          paymentExpiresAt: order.paymentExpiresAt,
        });

        setRedirecting(true);
        router.replace(`/payment?${params.toString()}`);
        window.setTimeout(clearSubmittedCheckout, 0);
        return;
      }

      if (method === "mobile_banking") {
        const payment = await createMobileBankingPayment({
          orderId: order.id,
          bankType,
          returnUri: mobileBankingReturnUri,
        });

        if (payment.status === "successful") {
          setRedirecting(true);
          router.replace(successPath);
          window.setTimeout(clearSubmittedCheckout, 0);
          return;
        }

        if (!payment.authorizeUri) {
          throw new Error("Mobile banking authorize URI is missing.");
        }

        storePendingRedirectPayment({
          chargeId: payment.chargeId,
          orderId: order.id,
          orderNo: order.number,
          points: earnedPoints,
          spend: order.amount,
        });
        setRedirecting(true);
        clearSubmittedCheckout();
        window.location.assign(payment.authorizeUri);
        return;
      }

      if (method === "credit_card" && creditCardTokenId) {
        const payment = await createCreditCardPayment({
          orderId: order.id,
          tokenId: creditCardTokenId,
          amount: paymentAmount,
          currency: "THB",
          description: paymentDescription,
          returnUri,
        });

        if (payment.status === "successful") {
          setRedirecting(true);
          router.replace(successPath);
          window.setTimeout(clearSubmittedCheckout, 0);
          return;
        }

        if (payment.status === "pending" && payment.authorizeUri) {
          storePendingRedirectPayment({
            chargeId: payment.chargeId,
            orderId: order.id,
            orderNo: order.number,
            points: earnedPoints,
            spend: order.amount,
          });
          setRedirecting(true);
          clearSubmittedCheckout();
          window.location.assign(payment.authorizeUri);
          return;
        }

        throw new Error("Credit card payment was not successful.");
      }

      throw new Error("Unsupported payment method.");
    } catch (err) {
      setPlaceError(
        getCouponErrorMessage(err, "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
      );
      setRedirecting(false);
      setPlacing(false);
    }
  };

  if (!hydrated || (usesStoredCheckoutItems && !checkoutSourceLoaded)) {
    return (
      <>
        <AppHeader title="ยืนยันคำสั่งซื้อ" showBack />
        <PageContainer className="space-y-3 pt-4">
          <div className="h-44 animate-pulse rounded-card bg-white/70" />
          <div className="h-28 animate-pulse rounded-card bg-white/70" />
          <div className="h-36 animate-pulse rounded-card bg-white/70" />
        </PageContainer>
      </>
    );
  }

  if (redirecting) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6"
      >
        <div className="flex w-full max-w-xs flex-col items-center rounded-[2rem] border border-brand/10 bg-white px-6 py-7 text-center shadow-[0_20px_60px_rgba(65,25,25,0.16)]">
          <span className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[6px] border-brand/10" />
            <span className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-r-brand border-t-brand" />
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </span>
          <p className="mt-4 text-lg font-extrabold text-ink">
            กำลังดำเนินการต่อ
          </p>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            เตรียมข้อมูลคำสั่งซื้อของคุณสักครู่
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <AppHeader title="ยืนยันคำสั่งซื้อ" showBack />
        <PageContainer className="pt-4">
          <EmptyState
            emoji="🧾"
            title="ยังไม่มีสินค้าให้สั่งซื้อ"
            description="กลับไปเลือกสินค้าก่อนนะคะ"
            action={
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            }
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="ยืนยันคำสั่งซื้อ"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-3 pb-44 pt-4 md:max-w-3xl md:px-8">
        <div
          className="relative mb-1 grid grid-cols-3 px-2"
          aria-label="ขั้นตอนการสั่งซื้อ"
        >
          <span className="absolute left-[16.66%] right-[16.66%] top-3.5 h-px bg-black/[0.08]" />
          {["จัดส่ง", "ชำระเงิน", "สำเร็จ"].map((label, index) => (
            <div
              key={label}
              className="relative flex min-w-0 flex-col items-center gap-1"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  index === 0
                    ? "bg-brand text-white shadow-[0_4px_12px_rgba(237,23,28,0.22)]"
                    : "bg-white text-ink-soft ring-1 ring-black/[0.08]"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`truncate text-[11px] font-bold ${
                  index === 0 ? "text-brand" : "text-ink-soft"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <Card id="shipping-section" className="overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
                1
              </span>
              <div>
                <h1 className="text-sm font-extrabold text-ink">
                  ที่อยู่จัดส่ง
                </h1>
                <p className="text-[10px] font-semibold text-ink-soft">
                  ตรวจสอบชื่อ เบอร์โทร และที่อยู่ให้ถูกต้อง
                </p>
              </div>
            </div>
            <Link
              href="/addresses"
              className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand"
            >
              จัดการ
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-start gap-3 p-4">
            <span
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                addressesLoaded
                  ? "bg-brand-soft text-brand"
                  : "bg-surface-muted text-ink-soft"
              }`}
            >
              {addressesLoaded ? (
                <MapPin className="h-5 w-5" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-ink">
                    {!addressesLoaded
                      ? "กำลังโหลดที่อยู่จัดส่ง"
                      : shipping.customerName || "ผู้รับสินค้า"}{" "}
                    <span className="font-semibold text-ink-soft">
                      {addressesLoaded ? shipping.phone : ""}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {!addressesLoaded
                      ? "ดึงข้อมูลที่อยู่ล่าสุดจากระบบ"
                      : shipping.address || "กรุณาเพิ่มที่อยู่จัดส่ง"}
                  </p>
                  <p
                    aria-live="polite"
                    className="mt-2 flex min-h-5 items-center gap-1.5 text-[11px] font-bold text-ink-soft"
                  >
                    {!addressesLoaded ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        กำลังเตรียมข้อมูลจัดส่ง
                      </>
                    ) : selectedAddress ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-success" />
                        ใช้ที่อยู่ที่เลือกไว้
                      </>
                    ) : (
                      "ยังไม่ได้เลือกที่อยู่"
                    )}
                  </p>
                </div>
                {addressesLoaded && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    aria-expanded={addressPickerOpen}
                    onClick={() => setAddressPickerOpen((open) => !open)}
                    className="shrink-0 rounded-full border border-brand/20 bg-white px-3 py-1.5 text-xs font-extrabold text-brand"
                  >
                    {addressPickerOpen ? "ปิด" : "เปลี่ยน"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {addressPickerOpen && savedAddresses.length > 0 && (
            <div className="animate-fade-in border-t border-black/[0.05] bg-surface-muted/35 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-ink">
                  เลือกที่อยู่จัดส่ง
                </p>
                <p className="text-[11px] font-semibold text-ink-soft">
                  {savedAddresses.length} ที่อยู่
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleAddresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => selectAddress(address)}
                      className={`relative flex min-h-[96px] w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                        selected
                          ? "border-brand bg-brand-soft/65 shadow-[0_8px_18px_rgba(237,23,28,0.12)]"
                          : "border-black/[0.08] bg-white hover:border-brand/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          selected
                            ? "bg-brand text-white"
                            : "bg-surface-muted text-ink-soft"
                        }`}
                      >
                        {selected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-extrabold ${
                              selected ? "text-brand" : "text-ink"
                            }`}
                          >
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-brand ring-1 ring-brand/10">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block truncate text-xs font-bold text-ink">
                          {address.customerName} · {address.phone}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-ink-soft">
                          {address.address}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {savedAddresses.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllAddresses((show) => !show)}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border border-black/[0.06] bg-white py-2.5 text-xs font-extrabold text-brand transition active:scale-[0.99]"
                >
                  {showAllAddresses
                    ? "ย่อรายการที่อยู่"
                    : `ดูที่อยู่อื่นอีก ${savedAddresses.length - visibleAddresses.length} ที่อยู่`}
                  <ChevronRight
                    className={`h-4 w-4 transition ${
                      showAllAddresses ? "-rotate-90" : "rotate-90"
                    }`}
                  />
                </button>
              )}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-brand" />
              <p className="text-sm font-extrabold text-ink">
                รายการสินค้า
              </p>
            </div>
            <span className="text-[11px] font-bold text-ink-soft">
              {totalQuantity} ชิ้น
            </span>
          </div>
          <div className="px-4">
            <CheckoutProductRows
              items={showAllItems ? items : items.slice(0, 2)}
            />
            {items.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllItems((show) => !show)}
                className="mb-3 flex w-full items-center justify-center gap-1 rounded-xl bg-surface-muted py-2 text-xs font-extrabold text-brand"
              >
                {showAllItems
                  ? "ย่อรายการสินค้า"
                  : `ดูสินค้าอีก ${items.length - 2} รายการ`}
                <ChevronRight
                  className={`h-4 w-4 transition ${
                    showAllItems ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </button>
            )}
          </div>
          <div className="border-t border-black/[0.05] px-4 py-3">
            <SummaryLine
              label={`สินค้ารวม ${items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น`}
              value={formatBaht(subtotal)}
              strong
            />
          </div>
        </Card>

        <Card className="overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-brand" />
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  วิธีจัดส่ง
                </h2>
                <p className="text-[10px] font-semibold text-ink-soft">
                  คำนวณค่าจัดส่งตามที่อยู่
                </p>
              </div>
            </div>
            <span
              aria-live="polite"
              className="flex h-6 w-24 shrink-0 items-center justify-end gap-1.5 text-[10px] font-bold text-ink-soft"
            >
              {!shippingRateRequest ? (
                "รอที่อยู่"
              ) : shippingRatesLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังคำนวณ
                </>
              ) : selectedShippingRate ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  คำนวณแล้ว
                </>
              ) : (
                "ค่ามาตรฐาน"
              )}
            </span>
          </div>
          <div className="px-4 pb-4">
            <div
              className={`relative min-h-[90px] rounded-2xl border px-4 py-3 transition-colors duration-300 ${
                selectedShippingRate
                  ? "border-success bg-success-soft"
                  : "border-black/[0.07] bg-surface-muted/45"
              }`}
            >
              <span
                className={`absolute left-0 top-0 flex h-6 w-6 -translate-x-px -translate-y-px items-center justify-center rounded-br-2xl rounded-tl-2xl text-white transition-colors ${
                  selectedShippingRate ? "bg-success" : "bg-ink-soft"
                }`}
              >
                {shippingRatesLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : selectedShippingRate ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Truck className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="ml-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={`line-clamp-1 min-h-5 text-sm font-extrabold ${
                      selectedShippingRate ? "text-success" : "text-ink"
                    }`}
                  >
                    {selectedShippingRate?.serviceName ??
                      (shippingRatesLoading
                        ? "กำลังตรวจสอบค่าจัดส่ง"
                        : "จัดส่งมาตรฐาน")}
                  </p>
                  <p className="mt-0.5 line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-ink-soft">
                    {selectedShippingRate?.courierName ??
                      (shippingRatesError
                        ? "ระบบจะใช้ค่าจัดส่งมาตรฐานชั่วคราว"
                        : shippingRateRequest
                          ? "กำลังค้นหาบริการที่เหมาะกับที่อยู่ของคุณ"
                          : "เพิ่มที่อยู่เพื่อคำนวณค่าจัดส่ง")}
                  </p>
                </div>
                <div className="min-w-[5.5rem] shrink-0 text-right">
                  <p className="text-sm font-extrabold tabular-nums text-ink">
                    {shippingFee === 0
                      ? "ส่งฟรี"
                      : formatBaht(shippingFee)}
                  </p>
                  <p className="mt-0.5 min-h-4 text-[10px] font-semibold text-ink-soft">
                    {!shippingRateRequest
                      ? "รอคำนวณ"
                      : shippingRatesLoading || !selectedShippingRate
                        ? "ประมาณการ"
                        : "ยืนยันแล้ว"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <details className="group border-t border-black/[0.05] px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-ink">
                    หมายเหตุ
                  </span>
                  <span className="block truncate text-xs font-semibold text-ink-soft">
                    {shipping.note || "ฝากข้อความถึงร้านหรือขนส่ง"}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft transition group-open:rotate-90" />
            </summary>
            <div className="mt-3 rounded-2xl bg-surface-muted/55 p-3">
              <Textarea
                id="checkout-note"
                value={shipping.note ?? ""}
                onChange={(event) =>
                  setShipping((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                rows={3}
                maxLength={160}
                placeholder="เช่น โทรก่อนส่ง ฝากไว้หน้าบ้าน หรือแจ้งรายละเอียดให้ร้าน"
                className="min-h-24 resize-none bg-white"
              />
              <p className="mt-2 text-right text-[11px] font-semibold text-ink-soft">
                {(shipping.note ?? "").length}/160
              </p>
            </div>
          </details>
        </Card>

        <Card
          id={CHECKOUT_COUPON_SECTION_ID}
          className="scroll-mt-24 overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <TicketPercent className="h-5 w-5 shrink-0 text-brand" />
              <h2 className="truncate text-sm font-extrabold text-ink">
                โค้ดส่วนลด PonPon
              </h2>
            </div>
            {discountAmount > 0 ? (
              <span className="shrink-0 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-xs font-extrabold text-success">
                -{formatBaht(discountAmount)}
              </span>
            ) : null}
          </div>
          <div className="border-t border-black/[0.05] p-4">
            <PromoCodeField
              value={promoCode}
              onChange={(value) => {
                setPromoCode(value);
                setPromoMessage("");
                setPromoError(false);
              }}
              onApply={applyPromoCode}
              onRemove={removePromoCode}
              appliedCoupons={displayAppliedCoupons}
              couponCodeCount={couponCodes.length}
              message={promoMessage}
              error={promoError}
              applying={pricingPreviewLoading}
            />
          </div>
        </Card>

        <Card className="flex items-center gap-3 bg-white p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <Coins className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-ink">
              รับ {membershipHydrated ? earnedPoints : "—"} คะแนนจากออเดอร์นี้
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">
              สมาชิก {memberTier.name} รับคะแนน x{memberTier.pointMultiplier}
              {" · "}คะแนนจะเข้าเมื่อสั่งซื้อสำเร็จ
            </p>
          </div>
          <Link
            href="/membership"
            className="shrink-0 text-[11px] font-extrabold text-brand"
          >
            ดูสิทธิ์
          </Link>
        </Card>

        <Card id="payment-section" className="overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
                2
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  ช่องทางชำระเงิน
                </h2>
                <p className="text-[10px] font-semibold text-ink-soft">
                  เลือกวิธีที่สะดวกสำหรับคุณ
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-ink-soft">
              {getCheckoutPaymentLabel(method)}
            </span>
          </div>
          <div className="border-t border-black/[0.05] p-4">
            <PaymentMethodSelector
              value={method}
              onChange={setMethod}
              bankType={bankType}
              onBankTypeChange={setBankType}
            />
            {method === "credit_card" && (
              <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.06] bg-surface-muted/35 p-3">
                <Input
                  id="card-name"
                  label="ชื่อเจ้าของบัตร"
                  autoComplete="cc-name"
                  value={cardForm.name}
                  onChange={(event) =>
                    setCardForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  id="card-number"
                  label="หมายเลขบัตร"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardForm.number}
                  onChange={(event) =>
                    setCardForm((current) => ({
                      ...current,
                      number: event.target.value,
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="card-expiry"
                    label="วันหมดอายุ (ดด/ปป)"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardForm.expiry}
                    onChange={(event) => {
                      let val = event.target.value.replace(/\D/g, "");
                      if (val.length > 2) {
                        val = val.substring(0, 2) + "/" + val.substring(2, 4);
                      }
                      setCardForm((current) => ({
                        ...current,
                        expiry: val,
                      }));
                    }}
                  />
                  <Input
                    id="card-cvc"
                    label="CVV"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={cardForm.securityCode}
                    onChange={(event) =>
                      setCardForm((current) => ({
                        ...current,
                        securityCode: event.target.value,
                      }))
                    }
                  />
                </div>
                <p className="flex items-center gap-1.5 text-xs leading-relaxed text-ink-soft">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                  ข้อมูลบัตรถูกเข้ารหัสและส่งอย่างปลอดภัย
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
                3
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  ตรวจสอบยอดรวม
                </h2>
                <p className="text-[10px] font-semibold text-ink-soft">
                  ยอดนี้รวมค่าจัดส่งและส่วนลดแล้ว
                </p>
              </div>
            </div>
            <span
              aria-live="polite"
              className="flex h-6 w-28 shrink-0 items-center justify-end gap-1.5 text-[10px] font-bold text-ink-soft"
            >
              {shippingRatesLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  อัปเดตค่าส่ง
                </>
              ) : selectedShippingRate ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  ยอดล่าสุด
                </>
              ) : (
                "พร้อมตรวจสอบ"
              )}
            </span>
          </div>
          <div className="space-y-3 border-t border-black/[0.05] px-4 py-4">
            <SummaryLine
              label="รวมการสั่งซื้อ"
              value={formatBaht(previewSubtotal)}
            />
            <SummaryLine
              label="การจัดส่ง"
              value={
                previewShippingAmount === 0
                  ? "ฟรี"
                  : formatBaht(previewShippingAmount)
              }
            />
            {shippingDiscountAmount > 0 && (
              <SummaryLine
                label="ส่วนลดค่าส่ง"
                value={`-${formatBaht(shippingDiscountAmount)}`}
                tone="discount"
              />
            )}
            {couponDiscountAmount > 0 && (
              <SummaryLine
                label="ส่วนลดคูปอง"
                value={`-${formatBaht(couponDiscountAmount)}`}
                tone="discount"
              />
            )}
            {promotionDiscountAmount > 0 && (
              <SummaryLine
                label="โปรโมชันอัตโนมัติ"
                value={`-${formatBaht(promotionDiscountAmount)}`}
                tone="discount"
              />
            )}
            {previewPackages.length > 0 && (
              <div className="rounded-2xl bg-surface-muted/60 px-3 py-2 text-xs text-ink-soft">
                <p className="font-extrabold text-ink">กล่องจัดส่ง</p>
                <div className="mt-1 space-y-1">
                  {previewPackages.map((pkg, index) => (
                    <p key={`${pkg.boxCode}-${index}`}>
                      กล่อง {pkg.boxCode} · {pkg.widthCm}x{pkg.lengthCm}x
                      {pkg.heightCm} ซม. ·{" "}
                      {pkg.weightKg.toLocaleString("th-TH")} กก. ·{" "}
                      {pkg.itemCount} ชิ้น
                    </p>
                  ))}
                </div>
              </div>
            )}
            {manualShippingRequired && (
              <div className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-700">
                คำสั่งซื้อนี้ต้องให้ร้านยืนยันค่าจัดส่งก่อนชำระเงิน
                กรุณาติดต่อร้านหรือรอร้านแจ้งค่าส่ง
              </div>
            )}
            <div className="border-t border-dashed border-black/10 pt-3">
              <SummaryLine
                label="ยอดชำระเงินทั้งหมด"
                value={
                  manualShippingRequired
                    ? "รอประเมินค่าส่ง"
                    : formatBaht(payableTotal)
                }
                strong
                tone="brand"
                loading={totalConfirming}
              />
            </div>
          </div>
        </Card>

        <p className="px-2 text-center text-xs leading-relaxed text-ink-soft">
          เมื่อกด “ยืนยันและชำระเงิน” ถือว่าคุณตรวจสอบข้อมูลจัดส่งและยอดชำระแล้ว
        </p>
      </PageContainer>

      <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 border-t border-brand/10 bg-white/95 px-4 pb-3 pt-3 shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur md:px-6">
        <div className="mx-auto max-w-md md:max-w-5xl md:px-8 xl:max-w-6xl">
          {placeError && (
            <p
              role="alert"
              className="mb-2 rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600"
            >
              {placeError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-soft">
                ยอดรวมทั้งหมด
              </p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {totalConfirming ? (
                  <span
                    aria-label="กำลังยืนยันยอดรวม"
                    role="status"
                    className="flex min-w-[6.5rem] items-center"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                  </span>
                ) : (
                  <p className="min-w-[6.5rem] text-2xl font-extrabold leading-none tabular-nums text-brand">
                    {manualShippingRequired
                      ? "รอค่าส่ง"
                      : formatBaht(payableTotal)}
                  </p>
                )}
                <p className="text-sm font-bold text-ink-soft">
                  รวม {totalQuantity} ชิ้น
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={placing || paymentBlocked}
              className="h-14 min-w-[165px] shrink-0 px-4 text-sm shadow-[0_8px_20px_rgba(237,23,28,0.22)]"
            >
              {placing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังดำเนินการ
                </>
              ) : manualShippingRequired ? (
                "รอร้านยืนยันค่าส่ง"
              ) : waitingForFinalQuote ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังยืนยันยอด
                </>
              ) : (
                "ยืนยันและชำระเงิน"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock,
  Gift,
  Loader2,
  Trash2,
  Truck,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import {
  getCartItemKey,
  useCartHydrated,
  useCartStore,
} from "@/store/cart-store";
import {
  getStoredCartSelectionCheckout,
  storeCartSelectionCheckout,
} from "@/features/checkout/cart-selection-checkout";
import {
  buildCheckoutPricingRequest,
  getCheckoutPricingSignature,
} from "@/features/checkout/checkout-pricing";
import { fetchCustomerAddresses } from "@/features/customer-addresses/customer-address-api";
import { fetchPricingPreview } from "@/features/orders/order-api";
import { toSavedAddress } from "@/lib/address-storage";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 399;

export default function CartPage() {
  const router = useRouter();
  const hydrated = useCartHydrated();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const itemKeys = useMemo(
    () => items.map((item) => getCartItemKey(item)),
    [items]
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(itemKeys)
  );
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const restoredSelectionRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    const timer = window.setTimeout(() => {
      let restoredKeys: string[] | null = null;

      if (!restoredSelectionRef.current) {
        restoredSelectionRef.current = true;

        const existingKeys = new Set(itemKeys);
        restoredKeys = getStoredCartSelectionCheckout()
          .map(({ key }) => key)
          .filter((key) => existingKeys.has(key));

        if (restoredKeys.length > 0) {
          setSelectionTouched(true);
        }
      }

      setSelectedKeys((prev) => {
        if (restoredKeys && restoredKeys.length > 0) {
          return new Set(restoredKeys);
        }

        if (!selectionTouched && prev.size === 0 && itemKeys.length > 0) {
          return new Set(itemKeys);
        }

        const existingKeys = new Set(itemKeys);
        const next = new Set(
          [...prev].filter((key) => existingKeys.has(key))
        );
        const unchanged =
          next.size === prev.size && [...next].every((key) => prev.has(key));

        return unchanged ? prev : next;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hydrated, itemKeys, selectionTouched]);

  const allSelected =
    itemKeys.length > 0 && itemKeys.every((k) => selectedKeys.has(k));
  const someSelected = selectedKeys.size > 0;
  const selectedItems = useMemo(
    () =>
      items
        .map((item) => ({ key: getCartItemKey(item), item }))
        .filter(({ key }) => selectedKeys.has(key)),
    [items, selectedKeys]
  );
  const selectedSubtotal = selectedItems.reduce(
    (sum, { item }) => sum + item.price * item.quantity,
    0
  );
  const selectedTotal = selectedSubtotal;
  const selectedQuantity = selectedItems.reduce(
    (sum, { item }) => sum + item.quantity,
    0
  );
  const totalItems = selectedQuantity;

  const toggleSelectAll = () => {
    setCheckoutError("");
    setSelectionTouched(true);
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(itemKeys));
    }
  };

  const toggleItem = (key: string, checked: boolean) => {
    setCheckoutError("");
    setSelectionTouched(true);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const deleteSelected = () => {
    setSelectionTouched(true);
    for (const key of selectedKeys) {
      removeItem(key);
    }
    setSelectedKeys(new Set());
  };

  const handleCheckout = async () => {
    if (checkoutLoading) return false;
    if (selectedItems.length === 0) {
      setCheckoutError("กรุณาเลือกสินค้าก่อนชำระเงิน");
      return false;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const addresses = await fetchCustomerAddresses().catch(() => []);
      const defaultAddress = addresses.map(toSavedAddress).find(
        (address) => address.isDefault
      );
      const request = buildCheckoutPricingRequest({
        items: selectedItems.map(({ item }) => item),
        address: defaultAddress
          ? {
              email: defaultAddress.email,
              customerName: defaultAddress.customerName,
              phone: defaultAddress.phone,
              address: defaultAddress.address,
            }
          : null,
        shippingChannel: null,
        couponCodes: null,
      });
      const quote = await fetchPricingPreview(request);

      storeCartSelectionCheckout(
        selectedItems,
        quote,
        getCheckoutPricingSignature(request)
      );
      router.push("/checkout?mode=cart-selection");
      return true;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "ไม่สามารถคำนวณยอดก่อนชำระเงินได้"
      );
      return false;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isLoadingCart = !hydrated;
  const isEmpty = hydrated && items.length === 0;
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  return (
    <>
      <AppHeader title="ตะกร้าของฉัน" showCart={false} />

      <PageContainer className="space-y-3 pb-56 pt-3 md:max-w-5xl md:px-8 xl:max-w-6xl">
        {isLoadingCart ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-3xl bg-white/70" />
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.04]">
              <div className="border-b border-black/[0.05] px-4 py-3">
                <div className="h-5 w-36 animate-pulse rounded-full bg-surface-muted" />
              </div>
              <div className="space-y-3 px-3 py-3 md:px-4 md:py-4">
                <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
                <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
              </div>
            </div>
            <div className="h-32 animate-pulse rounded-3xl bg-white/70" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            emoji="🛒"
            title="ตะกร้ายังว่างอยู่"
            description="เลือกสินค้าน่ารักๆ จาก Pon Pon ใส่ตะกร้ากันเลย!"
            action={
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* ── Free-shipping promo banner ── */}
            {false && (
            <section className="overflow-hidden rounded-3xl bg-brand p-5 text-white shadow-[0_12px_32px_rgba(190,9,14,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold">
                    <Gift className="h-3 w-3" />
                    โปรโมชั่นของคุณ
                  </span>

                  <h2 className="mt-2 text-[1.1rem] font-extrabold leading-snug">
                    {freeShippingRemaining > 0
                      ? "คุณใกล้ได้รับสิทธิ์จัดส่งฟรี!"
                      : "คุณได้สิทธิ์จัดส่งฟรีแล้ว! 🎉"}
                  </h2>
                  <p className="mt-0.5 text-sm font-semibold text-white/80">
                    {freeShippingRemaining > 0
                      ? `เพิ่มอีก ${formatBaht(freeShippingRemaining)} ได้จัดส่งฟรี`
                      : "ขอบคุณที่ช้อปกับ PonPon"}
                  </p>

                  <div className="mt-3.5">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/70">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        ส่งฟรีเมื่อครบ {formatBaht(FREE_SHIPPING_THRESHOLD)}
                      </span>
                      <span>{Math.round(shippingProgress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-500"
                        style={{ width: `${Math.max(shippingProgress, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                  🎁
                </div>
              </div>
            </section>

            )}

            {/* ── Cart items ── */}

            <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.04]">
              {/* Select-all row */}
              <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2.5 text-sm font-bold text-ink active:opacity-70"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border-2 transition",
                      allSelected ? "border-brand bg-brand" : "border-black/20"
                    )}
                  >
                    {allSelected && (
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    )}
                  </span>
                  เลือกทั้งหมด ({items.length})
                </button>

                {someSelected && (
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="flex items-center gap-1 text-xs font-bold text-brand transition active:opacity-70"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ลบที่เลือก
                  </button>
                )}
              </div>

              {/* Item list */}
              <div className="space-y-2 px-3 py-3 md:px-4 md:py-4">
                {items.map((item) => {
                  const key = getCartItemKey(item);
                  return (
                    <CartItem
                      key={key}
                      item={item}
                      checked={selectedKeys.has(key)}
                      onCheckedChange={(checked) => toggleItem(key, checked)}
                    />
                  );
                })}
              </div>

              {/* Reservation note */}
              <div className="flex items-center gap-2 border-t border-black/[0.05] px-4 py-2.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-brand/60" />
                <p className="text-xs font-semibold text-ink-soft">
                  ระบบจะจองสินค้าในตะกร้าไว้ให้คุณ 30 นาที
                </p>
              </div>
            </section>

            {/* ── Order summary ── */}
            <section className="rounded-3xl bg-white px-4 py-4 ring-1 ring-black/[0.04]">
              {checkoutLoading ? (
                <div
                  aria-live="polite"
                  className="flex min-h-[88px] items-center justify-center gap-2 text-sm font-bold text-ink-soft"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                  กำลังคำนวณยอดชำระ
                </div>
              ) : (
                <CartSummary
                  subtotal={selectedSubtotal}
                  showShipping={false}
                  total={selectedTotal}
                />
              )}
            </section>

          </>
        )}
      </PageContainer>

      {/* ── Sticky checkout bar ── */}
      {!isLoadingCart && !isEmpty && (
        <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 border-t border-black/[0.05] bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-[430px] px-4 pb-3 pt-3 md:max-w-5xl md:px-8 xl:max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-ink-soft">
                  ยอดรวมทั้งหมด
                </p>
                {checkoutLoading ? (
                  <div
                    aria-live="polite"
                    className="mt-0.5 flex min-h-[1.75rem] items-center gap-2 text-sm font-bold text-brand"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังคำนวณ
                  </div>
                ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-brand">
                    {formatBaht(selectedTotal)}
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">
                    รวม {totalItems} ชิ้น
                  </span>
                </div>
                )}
              </div>
              <Link
                href="/checkout?mode=cart-selection"
                className="shrink-0"
                onClick={(event) => {
                  event.preventDefault();
                  handleCheckout();
                }}
              >
                <Button
                  size="lg"
                  className="gap-1.5 px-6"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังคำนวณ
                    </>
                  ) : (
                    <>
                      ไปชำระเงิน
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </Link>
            </div>
            {checkoutError && (
              <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
                {checkoutError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

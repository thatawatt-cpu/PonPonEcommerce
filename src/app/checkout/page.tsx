"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Coins, MapPin } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PromoCodeField } from "@/components/checkout/promo-code-field";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { OrderSummary } from "@/components/checkout/order-summary";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { placeOrder } from "@/features/checkout/checkout-service";
import { mockCustomerProfile } from "@/lib/mock-data";
import {
  initialAddresses,
  loadSavedAddresses,
  type SavedAddress,
} from "@/lib/address-storage";
import { evaluatePromotion } from "@/lib/promotions";
import { calculateEarnedPoints, getTierBySpend } from "@/lib/membership";
import {
  useMembershipHydrated,
  useMembershipStore,
} from "@/store/membership-store";
import type { ShippingInfo } from "@/types/customer";
import type { PaymentMethod } from "@/types/order";

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const { promo } = use(searchParams);
  const router = useRouter();
  const hydrated = useCartHydrated();
  const membershipHydrated = useMembershipHydrated();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const shippingFee = useCartStore((s) => s.shippingFee());
  const clearCart = useCartStore((s) => s.clearCart);
  const lifetimeSpend = useMembershipStore((state) => state.lifetimeSpend);

  const initialAddress =
    initialAddresses.find((address) => address.isDefault) ??
    initialAddresses[0];
  const [shipping, setShipping] = useState<ShippingInfo>({
    customerName: initialAddress?.customerName ?? mockCustomerProfile.displayName,
    phone: initialAddress?.phone ?? "",
    address: initialAddress?.address ?? "",
    note: initialAddress?.note ?? "",
  });
  const [savedAddresses, setSavedAddresses] =
    useState<SavedAddress[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddress?.id ?? null
  );
  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [promoCode, setPromoCode] = useState(promo?.toUpperCase() ?? "");
  const [appliedCode, setAppliedCode] = useState<string | undefined>();
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ShippingInfo, string>>
  >({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const addresses = loadSavedAddresses();
      const defaultAddress =
        addresses.find((address) => address.isDefault) ?? addresses[0];

      setSavedAddresses(addresses);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setShipping({
          customerName: defaultAddress.customerName,
          phone: defaultAddress.phone,
          address: defaultAddress.address,
          note: defaultAddress.note,
        });
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setShipping({
      customerName: address.customerName,
      phone: address.phone,
      address: address.address,
      note: address.note,
    });
    setErrors({});
  };

  const activePromotion = appliedCode
    ? evaluatePromotion(appliedCode, items, subtotal, shippingFee)
    : undefined;
  const discountAmount = activePromotion?.discountAmount ?? 0;
  const payableTotal = Math.max(
    subtotal + shippingFee - discountAmount,
    0
  );
  const memberTier = getTierBySpend(lifetimeSpend);
  const earnedPoints = calculateEarnedPoints(payableTotal, memberTier.id);
  const discountLabel = activePromotion?.discountLabel ?? "ส่วนลดคูปอง";

  const applyPromoCode = () => {
    const result = evaluatePromotion(
      promoCode,
      items,
      subtotal,
      shippingFee,
    );
    setAppliedCode(result.code);
    setPromoMessage(result.message);
    setPromoError(result.error);
  };

  useEffect(() => {
    if (!hydrated || !promo) return;

    const timer = window.setTimeout(() => {
      const result = evaluatePromotion(promo, items, subtotal, shippingFee);
      setPromoCode(promo.toUpperCase());
      setAppliedCode(result.code);
      setPromoMessage(result.message);
      setPromoError(result.error);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hydrated, items, promo, shippingFee, subtotal]);

  const removePromoCode = () => {
    setAppliedCode(undefined);
    setPromoCode("");
    setPromoMessage("");
    setPromoError(false);
  };

  const validate = () => {
    const next: Partial<Record<keyof ShippingInfo, string>> = {};
    if (!shipping.customerName.trim()) next.customerName = "กรุณากรอกชื่อผู้รับ";
    if (!shipping.phone.trim()) next.phone = "กรุณากรอกเบอร์โทรศัพท์";
    if (!shipping.address.trim()) next.address = "กรุณากรอกที่อยู่จัดส่ง";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const order = placeOrder({
      shipping,
      items,
      paymentMethod: method,
      discountAmount,
      couponCode: appliedCode,
    });
    clearCart();
    if (method === "cod") {
      router.push(
        `/order/success?orderNo=${order.orderNo}&points=${earnedPoints}&spend=${order.total}`,
      );
    } else {
      router.push(
        `/payment?orderNo=${order.orderNo}&amount=${order.total}&points=${earnedPoints}`,
      );
    }
  };

  if (!hydrated) {
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
      <AppHeader title="ยืนยันคำสั่งซื้อ" showBack />
      <PageContainer className="space-y-4 pt-4 pb-44">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink">ที่อยู่จัดส่ง</h2>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                เลือกจากที่อยู่ที่บันทึกไว้ในโปรไฟล์
              </p>
            </div>
            <Link
              href="/addresses"
              className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-brand"
            >
              จัดการที่อยู่
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {savedAddresses.length > 0 && (
            <div className="mb-4 space-y-2">
              {savedAddresses.map((address) => {
                const selected = selectedAddressId === address.id;
                return (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => selectAddress(address)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                      selected
                        ? "border-brand bg-brand-soft/55"
                        : "border-black/[0.06] bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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
                        <span className="text-sm font-extrabold text-ink">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-brand">
                            ที่อยู่หลัก
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-ink">
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
          )}

          <details className="group rounded-2xl bg-[#fff8f6] p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-extrabold text-brand">
              แก้ข้อมูลสำหรับออเดอร์นี้
              <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
            </summary>
            <div className="mt-4">
              <CheckoutForm
                value={shipping}
                onChange={(value) => {
                  setSelectedAddressId(null);
                  setShipping(value);
                }}
                errors={errors}
              />
            </div>
          </details>
        </Card>

        <Card className="p-4">
          <PromoCodeField
            value={promoCode}
            onChange={(value) => {
              setPromoCode(value);
              setPromoMessage("");
              setPromoError(false);
            }}
            onApply={applyPromoCode}
            onRemove={removePromoCode}
            appliedCode={appliedCode}
            message={promoMessage}
            error={promoError}
          />
        </Card>

        <Card className="flex items-center gap-3 p-4">
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

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">วิธีชำระเงิน</h2>
          <PaymentMethodSelector value={method} onChange={setMethod} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 text-sm font-bold text-ink">รายการสินค้า</h2>
          <OrderSummary items={items} promotion={activePromotion} />
          <div className="mt-3 border-t border-black/5 pt-3">
            <CartSummary
              subtotal={subtotal}
              shippingFee={shippingFee}
              discountAmount={discountAmount}
              discountLabel={discountLabel}
              total={payableTotal}
            />
          </div>
        </Card>
      </PageContainer>

      <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-brand/10 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl md:max-w-3xl md:px-6">
        <Button size="lg" fullWidth onClick={handleConfirm}>
          ยืนยันคำสั่งซื้อ
        </Button>
      </div>
    </>
  );
}

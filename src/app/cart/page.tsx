"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Gift,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { formatBaht } from "@/lib/format";

const FREE_SHIPPING_THRESHOLD = 399;
const COUPON_THRESHOLD = 499;

export default function CartPage() {
  const hydrated = useCartHydrated();

  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const subtotal = useCartStore((s) => s.subtotal());
  const shippingFee = useCartStore((s) => s.shippingFee());
  const total = useCartStore((s) => s.total());

  const isEmpty = !hydrated || items.length === 0;
  const freeShippingRemaining = Math.max(
    FREE_SHIPPING_THRESHOLD - subtotal,
    0
  );
  const couponRemaining = Math.max(COUPON_THRESHOLD - subtotal, 0);
  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  return (
    <>
      <AppHeader title="ตะกร้าของฉัน" showCart={false} />
      <PageContainer className="space-y-4 pt-4 pb-52">
        {isEmpty ? (
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
            <section className="overflow-hidden rounded-card bg-brand p-4 text-white shadow-[0_14px_30px_rgba(190,9,14,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/75">
                    พร้อมเช็กเอาต์
                  </p>
                  <h1 className="mt-0.5 text-xl font-extrabold">
                    {totalItems} ชิ้นในตะกร้า
                  </h1>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/16">
                  <Gift className="h-6 w-6" />
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-white/14 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    {freeShippingRemaining > 0
                      ? `เพิ่มอีก ${formatBaht(freeShippingRemaining)} ได้ส่งฟรี`
                      : "คุณได้ส่งฟรีแล้ว"}
                  </span>
                  <span>{Math.round(shippingProgress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-card bg-white p-3 shadow-[0_10px_30px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-extrabold text-ink">
                  รายการสินค้า
                </h2>
                <Link
                  href="/products"
                  className="text-xs font-bold text-brand"
                >
                  ช้อปเพิ่ม
                </Link>
              </div>
              <div className="space-y-2">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-card bg-white shadow-[0_10px_30px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]">
              <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <BadgePercent className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-ink">
                      คูปองพร้อมใช้
                    </h2>
                    <p className="truncate text-xs font-semibold text-ink-soft">
                      {couponRemaining > 0
                        ? `เพิ่มอีก ${formatBaht(couponRemaining)} รับส่วนลด ฿50`
                        : "ใช้โค้ด PONPON50 ลดได้ทันที"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand">
                  เก็บ
                </span>
              </div>

              <div className="px-4 py-3">
              <CartSummary
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={total}
              />
              </div>

              <div className="flex items-center gap-2 bg-surface-muted/65 px-4 py-3 text-xs font-bold text-ink-soft">
                <ShieldCheck className="h-4 w-4 text-brand" />
                ชำระปลอดภัย แพ็กดี และติดตามออเดอร์ได้ทุกขั้นตอน
              </div>
            </section>
          </>
        )}
      </PageContainer>

      {/* Sticky checkout bar */}
      {!isEmpty && (
        <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-brand/10 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl md:max-w-3xl md:px-6">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink-soft">
                ยอดชำระทั้งหมด
              </p>
              <p className="text-xl font-extrabold text-brand">
                {formatBaht(total)}
              </p>
            </div>
            <p className="text-right text-[11px] font-semibold text-ink-soft">
              รวม {totalItems} ชิ้น
            </p>
          </div>
          <Link href="/checkout" className="block">
            <Button size="lg" fullWidth>
              ไปชำระเงิน
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}

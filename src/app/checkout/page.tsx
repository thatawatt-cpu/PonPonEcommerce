"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { OrderSummary } from "@/components/checkout/order-summary";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartStore } from "@/store/cart-store";
import { placeOrder } from "@/features/checkout/checkout-service";
import { mockCustomerProfile } from "@/lib/mock-data";
import type { ShippingInfo } from "@/types/customer";
import type { PaymentMethod } from "@/types/order";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const shippingFee = useCartStore((s) => s.shippingFee());
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);

  const [shipping, setShipping] = useState<ShippingInfo>({
    customerName: mockCustomerProfile.displayName,
    phone: "",
    address: "",
    note: "",
  });
  const [method, setMethod] = useState<PaymentMethod>("promptpay");
  const [errors, setErrors] = useState<
    Partial<Record<keyof ShippingInfo, string>>
  >({});

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
    const order = placeOrder({ shipping, items, paymentMethod: method });
    clearCart();
    if (method === "cod") {
      router.push(`/order/success?orderNo=${order.orderNo}`);
    } else {
      router.push(`/payment?orderNo=${order.orderNo}&amount=${order.total}`);
    }
  };

  if (mounted && items.length === 0) {
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
          <h2 className="mb-3 text-sm font-bold text-ink">ข้อมูลผู้รับสินค้า</h2>
          <CheckoutForm value={shipping} onChange={setShipping} errors={errors} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">วิธีชำระเงิน</h2>
          <PaymentMethodSelector value={method} onChange={setMethod} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-1 text-sm font-bold text-ink">รายการสินค้า</h2>
          <OrderSummary items={items} />
          <div className="mt-3 border-t border-black/5 pt-3">
            <CartSummary
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
            />
          </div>
        </Card>
      </PageContainer>

      <div className="fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-black/5 bg-white/95 px-4 pb-4 pt-3 backdrop-blur md:max-w-3xl md:px-6">
        <Button size="lg" fullWidth onClick={handleConfirm}>
          ยืนยันคำสั่งซื้อ
        </Button>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const shippingFee = useCartStore((s) => s.shippingFee());
  const total = useCartStore((s) => s.total());

  const isEmpty = !mounted || items.length === 0;

  return (
    <>
      <AppHeader title="ตะกร้าของฉัน" showCart={false} />
      <PageContainer className="pt-4 pb-44">
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
            <Card className="divide-y divide-black/5 px-4">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </Card>

            <Card className="mt-4 p-4">
              <CartSummary
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={total}
              />
            </Card>
          </>
        )}
      </PageContainer>

      {/* Sticky checkout bar */}
      {!isEmpty && (
        <div className="fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-black/5 bg-white/95 px-4 pb-4 pt-3 backdrop-blur md:max-w-3xl md:px-6">
          <Link href="/checkout">
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

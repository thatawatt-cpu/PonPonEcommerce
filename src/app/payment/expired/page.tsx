"use client";

import { use } from "react";
import Link from "next/link";
import { AlertCircle, Home, ReceiptText } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    orderNo?: string;
  }>;
}) {
  const { orderId, orderNo = "คำสั่งซื้อนี้" } = use(searchParams);
  const orderHref = orderId ? `/orders/${orderId}` : "/orders";

  return (
    <>
      <AppHeader title="หมดเวลาชำระเงิน" showBack={false} showCart={false} />
      <PageContainer
        withBottomNav={false}
        className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center pt-8"
      >
        <Card className="w-full bg-white p-6 text-center shadow-none">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warning-soft text-warning">
            <AlertCircle className="h-10 w-10" />
          </span>

          <h1 className="mt-4 text-xl font-extrabold text-ink">
            หมดเวลาชำระเงิน
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {orderNo} ถูกยกเลิกอัตโนมัติแล้ว เนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด
          </p>

          <div className="mt-6 space-y-2.5">
            <Link href={orderHref} className="block">
              <Button size="lg" fullWidth>
                <ReceiptText className="h-5 w-5" />
                ดูคำสั่งซื้อ
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button size="lg" fullWidth variant="secondary">
                <Home className="h-5 w-5" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </Card>
      </PageContainer>
    </>
  );
}

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Send } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PromptPayCard } from "@/components/payment/promptpay-card";
import { SlipUpload } from "@/components/payment/slip-upload";
import { getOrderByNo } from "@/features/orders/order-service";

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderNo?: string;
    amount?: string;
    points?: string;
  }>;
}) {
  const { orderNo = "ORD001", amount, points = "0" } = use(searchParams);
  const router = useRouter();
  const [hasSlip, setHasSlip] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prefer a known mock order's total; otherwise use the amount passed from checkout.
  const mockOrder = getOrderByNo(orderNo);
  const payAmount = mockOrder?.total ?? (amount ? Number(amount) : 0);

  const handleSubmit = () => {
    setSubmitting(true);
    // Mock "upload + submit": status becomes "รอตรวจสอบสลิป" on the next page.
    setTimeout(() => {
      router.push(
        `/order/success?orderNo=${orderNo}&points=${points}&spend=${payAmount}`,
      );
    }, 600);
  };

  return (
    <>
      <AppHeader title="ชำระเงิน" showBack showCart={false} />
      <PageContainer className="space-y-4 pt-4 pb-44">
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-ink-soft">เลขที่คำสั่งซื้อ</p>
            <p className="text-lg font-extrabold text-ink">{orderNo}</p>
          </div>
          <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
            รอชำระเงิน
          </span>
        </Card>

        <PromptPayCard amount={payAmount} />

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">
            แนบหลักฐานการชำระเงิน
          </h2>
          <SlipUpload onChange={setHasSlip} />
          <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-soft">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            หลังส่งสลิป สถานะจะเปลี่ยนเป็น “รอตรวจสอบสลิป” ทางร้านจะตรวจสอบ
            และยืนยันการชำระเงินให้เร็วที่สุดค่ะ
          </p>
        </Card>
      </PageContainer>

      <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-brand/10 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl md:max-w-3xl md:px-6">
        <Button
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Send className="h-5 w-5" />
          {submitting
            ? "กำลังส่ง..."
            : hasSlip
              ? "ส่งหลักฐานการชำระเงิน"
              : "ส่งหลักฐานการชำระเงิน"}
        </Button>
        {!hasSlip && (
          <p className="mt-1.5 text-center text-xs text-ink-soft">
            แนะนำให้แนบสลิปก่อนส่ง (เดโม่สามารถกดส่งได้เลย)
          </p>
        )}
      </div>
    </>
  );
}

"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { PAYMENT_ACCOUNT } from "@/lib/constants";
import { getOrderByNo } from "@/features/orders/order-service";

const QR_EXPIRES_IN_SECONDS = 5 * 60;

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
  const [remainingSeconds, setRemainingSeconds] = useState(
    QR_EXPIRES_IN_SECONDS,
  );
  const [processing, setProcessing] = useState(false);

  const mockOrder = getOrderByNo(orderNo);
  const payAmount = mockOrder?.total ?? (amount ? Number(amount) : 0);
  const isExpired = remainingSeconds <= 0;
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  const expiresLabel = `${minutes}:${seconds}`;

  useEffect(() => {
    if (processing || isExpired) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isExpired, processing]);

  const handleConfirmPaid = () => {
    if (processing || isExpired) return;
    setProcessing(true);

    window.setTimeout(() => {
      router.push(
        `/order/success?orderNo=${orderNo}&points=${points}&spend=${payAmount}`,
      );
    }, 900);
  };

  const handleRefreshQr = () => {
    if (processing) return;
    setRemainingSeconds(QR_EXPIRES_IN_SECONDS);
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

        <Card className="overflow-hidden p-0">
          <div className="bg-brand px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <QrCode className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/80">
                  QR PromptPay
                </p>
                <h1 className="text-xl font-extrabold">
                  สแกนจ่ายด้วยพร้อมเพย์
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-3xl bg-brand-soft px-4 py-4 text-center">
              <p className="text-sm font-bold text-ink-soft">ยอดที่ต้องชำระ</p>
              <div className="mt-1 flex justify-center">
                <Price value={payAmount} size="lg" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand/10 bg-white p-4 text-center shadow-sm">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-brand-soft px-3 py-2 text-left">
                <span className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                  <Clock3 className="h-4 w-4 text-brand" />
                  QR หมดอายุใน
                </span>
                <span
                  className={
                    isExpired
                      ? "text-sm font-extrabold text-brand"
                      : "text-sm font-extrabold text-brand"
                  }
                >
                  {isExpired ? "หมดอายุแล้ว" : expiresLabel}
                </span>
              </div>

              <div className="relative mx-auto h-56 w-56">
                <div
                  className={
                    isExpired
                      ? "h-56 w-56 overflow-hidden rounded-3xl bg-white p-3 opacity-25 ring-1 ring-black/10"
                      : "h-56 w-56 overflow-hidden rounded-3xl bg-white p-3 ring-1 ring-black/10"
                  }
                >
                  <Image
                    src="/images/payments/promptpay-qr.png"
                    width={336}
                    height={336}
                    alt="QR พร้อมเพย์สำหรับชำระเงิน"
                    className="h-full w-full object-contain"
                    preload
                    unoptimized
                  />
                </div>

                {isExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/80 px-5 text-center backdrop-blur-sm">
                    <Clock3 className="h-9 w-9 text-brand" />
                    <p className="mt-2 text-base font-extrabold text-ink">
                      QR หมดอายุแล้ว
                    </p>
                    <button
                      type="button"
                      onClick={handleRefreshQr}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-soft transition hover:bg-brand-dark"
                    >
                      <RefreshCw className="h-4 w-4" />
                      สร้าง QR ใหม่
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm font-extrabold text-ink">
                สแกน QR เพื่อชำระเงิน
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                PromptPay: {PAYMENT_ACCOUNT.promptpayId}
              </p>
              <p className="text-xs text-ink-soft">
                ชื่อบัญชี: {PAYMENT_ACCOUNT.accountName}
              </p>
            </div>

            <p className="flex items-start gap-2 rounded-2xl border border-success/15 bg-success-soft px-3 py-3 text-xs font-medium leading-relaxed text-success">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              QR นี้มีอายุ 5 นาที หลังสแกนจ่ายแล้วกดปุ่มยืนยันเพื่อให้ระบบจำลองการตรวจสอบและไปหน้าออเดอร์สำเร็จ
            </p>
          </div>
        </Card>
      </PageContainer>

      <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-brand/10 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl md:max-w-3xl md:px-6">
        {isExpired ? (
          <Button
            size="lg"
            fullWidth
            onClick={handleRefreshQr}
            disabled={processing}
          >
            <RefreshCw className="h-5 w-5" />
            สร้าง QR ใหม่
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            onClick={handleConfirmPaid}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {processing ? "กำลังตรวจสอบ..." : "ชำระเงินแล้ว"}
          </Button>
        )}
      </div>

      {processing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-6 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-xs flex-col items-center rounded-[2rem] border border-brand/10 bg-white px-6 py-7 text-center shadow-[0_20px_60px_rgba(65,25,25,0.18)]">
            <span className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-[6px] border-brand/10" />
              <span className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-r-brand border-t-brand" />
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </span>
            <p className="mt-4 text-lg font-extrabold text-ink">
              กำลังตรวจสอบการชำระเงิน
            </p>
            <p className="mt-1 text-sm font-medium text-ink-soft">
              กรุณารอสักครู่ ระบบกำลังยืนยันยอดพร้อมเพย์
            </p>
          </div>
        </div>
      )}
    </>
  );
}

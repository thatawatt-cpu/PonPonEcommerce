"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchPaymentStatus } from "@/features/payments/payment-api";

const PENDING_PAYMENT_STORAGE_KEY = "ponpon.pendingPayment";

interface PendingPayment {
  chargeId: string;
  orderId: string;
  orderNo: string;
  points: number;
  spend: number;
}

function readPendingPayment(): PendingPayment | null {
  const raw = window.sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingPayment>;
    if (!parsed.chargeId || !parsed.orderId || !parsed.orderNo) return null;

    return {
      chargeId: parsed.chargeId,
      orderId: parsed.orderId,
      orderNo: parsed.orderNo,
      points: Number(parsed.points) || 0,
      spend: Number(parsed.spend) || 0,
    };
  } catch {
    return null;
  }
}

function buildSuccessPath(payment: PendingPayment) {
  const params = new URLSearchParams({
    orderId: payment.orderId,
    orderNo: payment.orderNo,
    points: String(payment.points),
    spend: String(payment.spend),
  });

  return `/order/success?${params.toString()}`;
}

export default function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    chargeId?: string;
    orderId?: string;
    orderNo?: string;
    points?: string;
    spend?: string;
  }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const fromParams = useMemo<PendingPayment | null>(
    () =>
      params.chargeId && params.orderId && params.orderNo
        ? {
            chargeId: params.chargeId,
            orderId: params.orderId,
            orderNo: params.orderNo,
            points: Number(params.points) || 0,
            spend: Number(params.spend) || 0,
          }
        : null,
    [params]
  );
  const [storedPayment, setStoredPayment] = useState<PendingPayment | null>(
    null
  );
  const [storedPaymentLoaded, setStoredPaymentLoaded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("กำลังตรวจสอบสถานะการชำระเงิน");
  const [failed, setFailed] = useState(false);
  const pendingPayment = fromParams ?? storedPayment;
  const missingPayment =
    !pendingPayment && !fromParams && storedPaymentLoaded;
  const displayChecking = checking && !missingPayment;
  const displayFailed = failed || missingPayment;
  const displayMessage = missingPayment
    ? "ไม่พบข้อมูลการชำระเงินที่ต้องตรวจสอบ"
    : message;

  useEffect(() => {
    if (fromParams) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStoredPayment(readPendingPayment());
      setStoredPaymentLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fromParams]);

  useEffect(() => {
    if (!pendingPayment) {
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const status = await fetchPaymentStatus(pendingPayment.chargeId);

        if (cancelled) return;

        if (status.paid || status.status === "successful") {
          window.sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
          router.replace(buildSuccessPath(pendingPayment));
          return;
        }

        if (status.status === "failed" || status.status === "expired") {
          setChecking(false);
          setFailed(true);
          setMessage(status.failureMessage ?? "ชำระเงินไม่สำเร็จ");
          return;
        }

        setMessage("ยังรอการยืนยันจากธนาคาร ระบบจะลองใหม่อีกครั้ง");
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error ? err.message : "ตรวจสอบสถานะไม่สำเร็จ"
          );
        }
      }
    };

    check();
    const timer = window.setInterval(check, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pendingPayment, router]);

  return (
    <>
      <AppHeader title="ตรวจสอบการชำระเงิน" showBack={false} showCart={false} />
      <PageContainer className="flex min-h-dvh items-center justify-center pt-8">
        <Card className="w-full p-6 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
            {displayChecking ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : displayFailed ? (
              <AlertCircle className="h-10 w-10" />
            ) : (
              <CheckCircle2 className="h-10 w-10" />
            )}
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-ink">
            {displayChecking
              ? "กำลังตรวจสอบ"
              : displayFailed
                ? "ตรวจสอบไม่สำเร็จ"
                : "สำเร็จ"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {displayMessage}
          </p>

          {!displayChecking && displayFailed && (
            <div className="mt-5 space-y-2">
              {pendingPayment ? (
                <Link
                  href={`/orders/${pendingPayment.orderId}`}
                  className="block"
                >
                  <Button fullWidth>กลับไปดูคำสั่งซื้อ</Button>
                </Link>
              ) : (
                <Link href="/orders" className="block">
                  <Button fullWidth>ดูรายการคำสั่งซื้อ</Button>
                </Link>
              )}
              <Link href="/" className="block">
                <Button fullWidth variant="ghost">
                  กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </PageContainer>
    </>
  );
}

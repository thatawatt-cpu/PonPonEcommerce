"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Coins,
  Home,
  MessageCircle,
  PackageSearch,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PonPonLogo } from "@/components/brand/ponpon-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";
import { dispatchShopNotificationToast } from "@/lib/shop-notification-toast";
import { useMembershipStore } from "@/store/membership-store";
import { markOrderPaid } from "@/features/payments/payment-api";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    orderNo?: string;
    points?: string;
    spend?: string;
  }>;
}) {
  const {
    orderId,
    orderNo: orderNoParam,
    points: pointsParam = "0",
    spend: spendParam = "0",
  } = use(searchParams);
  const creditOrder = useMembershipStore((state) => state.creditOrder);
  const earnedPoints = Math.max(Number(pointsParam) || 0, 0);
  const orderSpend = Math.max(Number(spendParam) || 0, 0);
  const trackingOrderId = orderId || orderNoParam || "";
  const orderNo = orderNoParam || orderId || "คำสั่งซื้อนี้";
  const trackingHref = trackingOrderId
    ? `/orders/${encodeURIComponent(trackingOrderId)}`
    : "/orders";

  useEffect(() => {
    if (earnedPoints <= 0) return;
    creditOrder(orderNo, earnedPoints, orderSpend);
  }, [creditOrder, earnedPoints, orderNo, orderSpend]);

  useEffect(() => {
    if (!trackingOrderId) return;
    markOrderPaid({ orderId: trackingOrderId, orderNo });
  }, [orderNo, trackingOrderId]);

  useEffect(() => {
    if (!trackingOrderId) return;

    const timer = window.setTimeout(() => {
      dispatchShopNotificationToast({
        type: "payment_succeeded",
        orderId: trackingOrderId,
        orderNumber: orderNo,
        title: "ชำระเงินสำเร็จ",
        message: "ร้านค้าจะเริ่มดำเนินการคำสั่งซื้อของคุณ",
        createdAtUtc: new Date().toISOString(),
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [orderNo, trackingOrderId]);

  return (
    <PageContainer className="flex min-h-dvh flex-col items-center justify-center pt-8 text-center">
      <PonPonLogo size={56} withWordmark className="mb-6" />

      <div className="relative mb-4">
        <span className="flex h-24 w-24 animate-scale-in items-center justify-center rounded-full bg-success-soft">
          <CheckCircle2 className="h-14 w-14 text-success" />
        </span>
      </div>

      <h1 className="text-2xl font-extrabold text-ink">สั่งซื้อสำเร็จ!</h1>
      <p className="mt-1.5 max-w-xs text-sm text-ink-soft">
        ขอบคุณที่อุดหนุนร้าน Pon Pon นะคะ 🧡 เราได้รับคำสั่งซื้อของคุณแล้ว
      </p>

      <Card className="mt-5 w-full p-4">
        <p className="text-xs text-ink-soft">เลขที่คำสั่งซื้อ</p>
        <p className="text-xl font-extrabold text-brand">{orderNo}</p>
        <span className="mt-2 inline-flex rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
          ชำระเงินสำเร็จ
        </span>
      </Card>

      {earnedPoints > 0 ? (
        <Link href="/membership" className="mt-3 block w-full text-left">
          <Card className="flex items-center gap-3 border border-warning/10 bg-warning-soft/60 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-warning shadow-sm">
              <Coins className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-ink">
                ได้รับ +{earnedPoints.toLocaleString("th-TH")} คะแนน
              </span>
              <span className="mt-0.5 block text-xs text-ink-soft">
                คะแนนถูกเพิ่มในบัญชีสมาชิกแล้ว
              </span>
            </span>
          </Card>
        </Link>
      ) : null}

      <div className="mt-6 w-full space-y-2.5">
        <Link href={trackingHref} className="block">
          <Button size="lg" fullWidth>
            <PackageSearch className="h-5 w-5" />
            ติดตามออเดอร์
          </Button>
        </Link>
        <Button
          size="lg"
          fullWidth
          variant="secondary"
          onClick={() => openExternalWindow(LINE_OA_URL)}
        >
          <MessageCircle className="h-5 w-5" />
          ติดต่อร้านผ่าน LINE
        </Button>
        <Link href="/" className="block">
          <Button size="lg" fullWidth variant="ghost">
            <Home className="h-5 w-5" />
            กลับหน้าหลัก
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
}

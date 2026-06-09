"use client";

import { use } from "react";
import Link from "next/link";
import { CheckCircle2, Home, MessageCircle, PackageSearch } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PonPonLogo } from "@/components/brand/ponpon-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNo?: string }>;
}) {
  const { orderNo = "ORD001" } = use(searchParams);

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
        <span className="mt-2 inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
          รอตรวจสอบสลิป
        </span>
      </Card>

      <div className="mt-6 w-full space-y-2.5">
        <Link href={`/orders/${orderNo}`} className="block">
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

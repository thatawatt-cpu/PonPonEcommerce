"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusCard } from "@/components/order/order-status-card";
import { OrderTimeline } from "@/components/order/order-timeline";
import { TrackingCard } from "@/components/order/tracking-card";
import { ContactLineButton } from "@/components/order/contact-line-button";
import { fetchOrderById, cancelOrder } from "@/features/orders/order-api";
import { buildTimeline } from "@/features/orders/order-utils";
import type { ApiOrderDetail } from "@/types/api";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { CartItem } from "@/types/cart";

const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "reviewing_payment"];

function mapStatus(status: string): OrderStatus {
  const known: OrderStatus[] = [
    "pending",
    "reviewing_payment",
    "paid",
    "preparing",
    "shipped",
    "completed",
    "cancelled",
  ];
  const lower = status.toLowerCase().replace(/[-\s]/g, "_") as OrderStatus;
  return known.includes(lower) ? lower : "pending";
}

function mapPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: "pending",
    reviewing: "reviewing",
    paid: "paid",
    failed: "failed",
  };
  return map[status.toLowerCase()] ?? "pending";
}

function mapApiOrderToOrder(api: ApiOrderDetail): Order {
  const orderStatus = mapStatus(api.status);
  const items: CartItem[] = api.items.map((item) => ({
    productId: item.id,
    name: item.name,
    price: item.pricePerUnit,
    imageUrl: "",
    emoji: "📦",
    quantity: Math.round(item.quantity),
  }));

  return {
    id: api.id,
    orderNo: api.number,
    customerName: api.shippingName ?? "",
    phone: api.shippingPhone ?? "",
    address: api.shippingAddress ?? "",
    items,
    subtotal: api.amount - api.shippingAmount + api.discountAmount,
    shippingFee: api.shippingAmount,
    discountAmount: api.discountAmount,
    total: api.amount,
    paymentMethod: api.isCod ? "cod" : "promptpay",
    paymentStatus: mapPaymentStatus(api.paymentStatus),
    orderStatus,
    timeline: buildTimeline(orderStatus),
    createdAt: api.orderDate ?? new Date().toISOString(),
  };
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo: id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderById(id)
      .then((data) => setOrder(mapApiOrderToOrder(data)))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "โหลดออเดอร์ไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelConfirm = async () => {
    if (cancelling) return;
    setCancelling(true);
    setCancelError(null);

    try {
      await cancelOrder(id);
      setShowCancelDialog(false);
      // Optimistically update status then redirect
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: "cancelled",
              timeline: buildTimeline("cancelled"),
            }
          : prev
      );
      router.push("/orders");
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "ยกเลิกออเดอร์ไม่สำเร็จ"
      );
      setCancelling(false);
    }
  };

  const handleOpenCancel = () => {
    setCancelError(null);
    setShowCancelDialog(true);
  };

  if (loading) {
    return (
      <>
        <AppHeader title="ติดตามออเดอร์" showBack />
        <PageContainer className="flex items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-3 text-ink-soft">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-semibold">กำลังโหลดออเดอร์...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <AppHeader title="ติดตามออเดอร์" showBack />
        <PageContainer className="pt-4">
          <EmptyState
            emoji="⚠️"
            title="โหลดออเดอร์ไม่สำเร็จ"
            description={error ?? "ไม่พบออเดอร์นี้"}
            action={
              <Link href="/orders">
                <Button>ดูออเดอร์ทั้งหมด</Button>
              </Link>
            }
          />
        </PageContainer>
      </>
    );
  }

  const cancellable = CANCELLABLE_STATUSES.includes(order.orderStatus);

  return (
    <>
      <AppHeader title="ติดตามออเดอร์" showBack />
      <PageContainer className="space-y-3 pt-4">
        <OrderStatusCard order={order} />

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">สถานะการจัดส่ง</h2>
          <OrderTimeline steps={order.timeline} />
        </Card>

        <TrackingCard order={order} />

        <ContactLineButton />

        <Link href="/orders" className="block">
          <Button variant="ghost" fullWidth>
            ดูออเดอร์ทั้งหมด
          </Button>
        </Link>

        {cancellable && (
          <button
            type="button"
            onClick={handleOpenCancel}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition active:scale-[0.98] hover:bg-red-100"
          >
            <XCircle className="h-4 w-4" />
            ยกเลิกออเดอร์
          </button>
        )}
      </PageContainer>

      {/* Cancel confirmation bottom sheet */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            if (!cancelling) setShowCancelDialog(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10" />

            <div className="mb-5 flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-ink">
                ยืนยันยกเลิกออเดอร์?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                ออเดอร์{" "}
                <span className="font-bold text-ink">{order.orderNo}</span>{" "}
                จะถูกยกเลิกและไม่สามารถเปิดใหม่ได้
              </p>
            </div>

            {cancelError && (
              <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                {cancelError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
              >
                ไม่ยกเลิก
              </Button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-base font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  "ยืนยันยกเลิก"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

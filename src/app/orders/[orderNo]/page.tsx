import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusCard } from "@/components/order/order-status-card";
import { OrderTimeline } from "@/components/order/order-timeline";
import { TrackingCard } from "@/components/order/tracking-card";
import { ContactLineButton } from "@/components/order/contact-line-button";
import { getOrderByNo } from "@/features/orders/order-service";
import { buildTimeline } from "@/features/orders/order-utils";
import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/types/order";

/**
 * Resolve an order by number. Unknown numbers (e.g. an order that was just
 * "placed" during the demo) fall back to a synthetic order based on the first
 * mock order, stamped with a "รอตรวจสอบสลิป" timeline.
 */
function resolveOrder(orderNo: string): Order {
  const found = getOrderByNo(orderNo);
  if (found) {
    return {
      ...found,
      timeline:
        found.timeline.length > 0
          ? found.timeline
          : buildTimeline(found.orderStatus),
    };
  }
  const base = mockOrders[0];
  return {
    ...base,
    id: `o-${orderNo}`,
    orderNo,
    orderStatus: "reviewing_payment",
    paymentStatus: "reviewing",
    timeline: buildTimeline("reviewing_payment"),
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const order = resolveOrder(orderNo);

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
      </PageContainer>
    </>
  );
}

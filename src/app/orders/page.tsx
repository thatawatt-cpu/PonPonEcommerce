import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { getOrders } from "@/features/orders/order-service";
import { getOrderItemCount } from "@/features/orders/order-utils";
import { formatBaht, formatDate } from "@/lib/format";

export default function OrdersPage() {
  const orders = getOrders();

  return (
    <>
      <AppHeader title="ออเดอร์ของฉัน" />
      <PageContainer className="space-y-3 pt-4">
        {orders.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="ยังไม่มีคำสั่งซื้อ"
            description="เริ่มช้อปกับ Pon Pon ได้เลย"
            action={
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            }
          />
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.orderNo}`} className="block">
              <Card className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xl">
                  {order.items[0]?.emoji ?? "📦"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{order.orderNo}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {getOrderItemCount(order)} ชิ้น · {formatBaht(order.total)} ·{" "}
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                {/* Badge + chevron grouped on the right, vertically centred with the card. */}
                <div className="flex shrink-0 items-center gap-2">
                  <OrderStatusBadge status={order.orderStatus} />
                  <ChevronRight className="h-5 w-5 text-ink-soft" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </PageContainer>
    </>
  );
}

import { Card } from "@/components/ui/card";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { Order } from "@/types/order";

export function OrderStatusCard({ order }: { order: Order }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-soft">เลขที่คำสั่งซื้อ</p>
          <p className="text-lg font-extrabold text-ink">{order.orderNo}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
        <span className="text-xs text-ink-soft">สถานะการชำระเงิน</span>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>
    </Card>
  );
}

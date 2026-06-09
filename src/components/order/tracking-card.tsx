import { MapPin, Phone, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { CartSummary } from "@/components/cart/cart-summary";
import type { Order } from "@/types/order";

/** Customer info + items + totals for the order tracking page. */
export function TrackingCard({ order }: { order: Order }) {
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <h2 className="mb-2 text-sm font-bold text-ink">ข้อมูลผู้รับ</h2>
        <div className="space-y-1.5 text-sm text-ink">
          <p className="flex items-center gap-2">
            <User className="h-4 w-4 text-ink-soft" />
            {order.customerName}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-ink-soft" />
            {order.phone}
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
            <span className="text-ink-soft">{order.address}</span>
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-1 text-sm font-bold text-ink">รายการสินค้า</h2>
        <OrderSummary items={order.items} />
        <div className="mt-3 border-t border-black/5 pt-3">
          <CartSummary
            subtotal={order.subtotal}
            shippingFee={order.shippingFee}
            total={order.total}
          />
        </div>
      </Card>
    </div>
  );
}

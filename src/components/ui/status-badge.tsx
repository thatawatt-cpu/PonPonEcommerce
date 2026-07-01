import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/types/order";

const orderStatusStyle: Record<OrderStatus, string> = {
  pending: "bg-surface-muted text-ink-soft",
  waiting: "bg-warning-soft text-warning",
  packed: "bg-blue-50 text-blue-600",
  shipping: "bg-indigo-50 text-indigo-600",
  success: "bg-success-soft text-success",
  voided: "bg-red-50 text-red-500",
  returned: "bg-orange-50 text-orange-500",
  failed_shipment: "bg-red-50 text-red-500",
};

const paymentStatusStyle: Record<PaymentStatus, string> = {
  pending: "bg-surface-muted text-ink-soft",
  paid: "bg-success-soft text-success",
  voided: "bg-red-50 text-red-500",
  partial_payment: "bg-warning-soft text-warning",
  excess_payment: "bg-blue-50 text-blue-600",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold leading-none shadow-sm ring-1 ring-current/10",
        orderStatusStyle[status],
        className
      )}
    >
      <span className="block translate-y-px">{ORDER_STATUS_LABEL[status]}</span>
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold leading-none",
        paymentStatusStyle[status],
        className
      )}
    >
      <span className="block translate-y-px">{PAYMENT_STATUS_LABEL[status]}</span>
    </span>
  );
}

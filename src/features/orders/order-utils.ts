import { ORDER_TIMELINE_SEQUENCE, ORDER_STATUS_LABEL } from "@/lib/constants";
import type {
  Order,
  OrderStatus,
  OrderTimelineStep,
  TimelineStepState,
} from "@/types/order";

/**
 * Build a tracking timeline from a current order status: earlier steps are
 * "completed", the current step is "active", later steps are "pending".
 */
export function buildTimeline(current: OrderStatus): OrderTimelineStep[] {
  const currentIndex = ORDER_TIMELINE_SEQUENCE.indexOf(current);
  return ORDER_TIMELINE_SEQUENCE.map((key, index) => {
    let state: TimelineStepState = "pending";
    if (index < currentIndex) state = "completed";
    else if (index === currentIndex) state = "active";
    return { key, label: ORDER_STATUS_LABEL[key], state };
  });
}

export function getOrderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

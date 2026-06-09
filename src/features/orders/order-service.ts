import { mockOrders } from "@/lib/mock-data";
import type { Order } from "@/types/order";

export function getOrders(): Order[] {
  return mockOrders;
}

/**
 * Look up an order by its order number. Falls back to the first mock order so
 * the demo never hits a dead end for an unknown orderNo (e.g. a freshly
 * "created" order from checkout).
 */
export function getOrderByNo(orderNo: string): Order | undefined {
  return mockOrders.find((o) => o.orderNo === orderNo);
}

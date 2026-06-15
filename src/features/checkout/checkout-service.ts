import type { CartItem } from "@/types/cart";
import type { PaymentMethod, Order } from "@/types/order";
import type { ShippingInfo } from "@/types/customer";
import { SHIPPING_FEE } from "@/lib/constants";

let orderCounter = 100;

/** Generate a mock order number like "ORD001". */
export function generateOrderNo(): string {
  orderCounter += 1;
  return `ORD${String(orderCounter).padStart(3, "0")}`;
}

interface PlaceOrderInput {
  shipping: ShippingInfo;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  couponCode?: string;
}

/**
 * Mock "place order". In a real app this would POST to the backend; here it just
 * assembles an Order object and returns it with a generated order number.
 */
export function placeOrder({
  shipping,
  items,
  paymentMethod,
  discountAmount = 0,
  couponCode,
}: PlaceOrderInput): Order {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = items.length > 0 ? SHIPPING_FEE : 0;
  const orderNo = generateOrderNo();

  return {
    id: `o-${orderNo}`,
    orderNo,
    customerName: shipping.customerName,
    phone: shipping.phone,
    address: shipping.address,
    note: shipping.note,
    items,
    subtotal,
    shippingFee,
    discountAmount,
    couponCode,
    total: Math.max(subtotal + shippingFee - discountAmount, 0),
    paymentMethod,
    paymentStatus: "pending",
    orderStatus: "pending",
    timeline: [],
    createdAt: new Date().toISOString(),
  };
}

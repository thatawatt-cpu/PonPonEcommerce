import type { CartItem } from "./cart";

export type PaymentMethod = "promptpay" | "cod";

export type PaymentStatus = "pending" | "reviewing" | "paid" | "failed";

export type OrderStatus =
  | "pending"
  | "reviewing_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled";

export type TimelineStepState = "completed" | "active" | "pending";

export interface OrderTimelineStep {
  key: OrderStatus;
  label: string;
  description?: string;
  state: TimelineStepState;
  /** Human-readable timestamp for completed/active steps. */
  at?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  timeline: OrderTimelineStep[];
  createdAt: string;
}

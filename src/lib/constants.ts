import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

export const SHOP_NAME = "Pon Pon";
export const SHOP_TAGLINE = "ช้อปง่าย สั่งไว ผ่าน LINE";

/** Flat shipping fee used across the demo (THB). */
export const SHIPPING_FEE = 40;

/** Mock PromptPay / bank transfer destination shown on the payment page. */
export const PAYMENT_ACCOUNT = {
  bankName: "ธนาคารกสิกรไทย",
  accountNumber: "123-4-56789-0",
  accountName: "ร้าน Pon Pon (มอคอัพ)",
  promptpayId: "0812345678",
} as const;

/** Mock LINE OA contact link. */
export const LINE_OA_URL = "https://line.me/R/ti/p/@ponpon";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "รอชำระเงิน",
  reviewing: "รอตรวจสอบสลิป",
  paid: "ชำระเงินแล้ว",
  failed: "ชำระเงินไม่สำเร็จ",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "รอชำระเงิน",
  reviewing_payment: "รอตรวจสอบสลิป",
  paid: "ชำระเงินแล้ว",
  preparing: "กำลังเตรียมสินค้า",
  shipped: "จัดส่งแล้ว",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  promptpay: "QR PromptPay / โอนเงิน",
  cod: "เก็บเงินปลายทาง (COD)",
};

/** Canonical order of statuses for building a tracking timeline. */
export const ORDER_TIMELINE_SEQUENCE: OrderStatus[] = [
  "pending",
  "reviewing_payment",
  "paid",
  "preparing",
  "shipped",
  "completed",
];

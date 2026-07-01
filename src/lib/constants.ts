import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/order";

export const SHOP_NAME = "PonPon Official";
export const SHOP_TAGLINE = "ช้อปง่าย สั่งไว ผ่าน LINE";

/** Flat shipping fee used across the demo (THB). */
export const SHIPPING_FEE = 40;

/** Mock payment gateway destination shown on the payment page. */
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
  paid: "ชำระเงินแล้ว",
  voided: "ยกเลิก",
  partial_payment: "ชำระบางส่วน",
  excess_payment: "ชำระเกิน",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "รอชำระเงิน",
  waiting: "กำลังเตรียมสินค้า",
  packed: "แพ็กสินค้าแล้ว",
  shipping: "กำลังจัดส่ง",
  success: "สำเร็จ",
  voided: "ยกเลิก",
  returned: "คืนสินค้า",
  failed_shipment: "จัดส่งไม่สำเร็จ",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  promptpay: "QR พร้อมเพย์",
  credit_card: "Credit Card",
  mobile_banking: "Mobile Banking",
  cod: "เก็บเงินปลายทาง (COD)",
};

/** Canonical order of statuses for building a tracking timeline. */
export const ORDER_TIMELINE_SEQUENCE: OrderStatus[] = [
  "pending",
  "waiting",
  "packed",
  "shipping",
  "success",
];

"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ApiCreditCardPaymentRequest,
  ApiCreditCardPaymentResponse,
  ApiMobileBankingPaymentRequest,
  ApiMobileBankingPaymentResponse,
  ApiOmiseConfigResponse,
  ApiPaymentStatusResponse,
  ApiPromptPayPaymentRequest,
  ApiPromptPayPaymentResponse,
} from "@/types/api";

const PROMPTPAY_CHARGES_STORAGE_KEY = "ponpon.promptPayCharges";
const PAID_ORDERS_STORAGE_KEY = "ponpon.paidOrders";
const PAID_ORDER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface StoredPromptPayCharge {
  orderId: string;
  orderNo: string;
  amount: number;
  chargeId: string;
  qrCodeUrl: string;
  expiresAt: string;
  paymentExpiresAt?: string;
  createdAt: string;
}

interface StoredPaidOrder {
  orderId: string;
  orderNo?: string;
  paidAt: string;
}

async function readPaymentError(response: Response, fallback: string) {
  const err = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  return err?.message ?? err?.error ?? `${fallback} (${response.status})`;
}

export function bahtToSatang(amount: number): number {
  return Math.round(amount * 100);
}

export function satangToBaht(amount: number): number {
  return amount / 100;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredPromptPayCharges(): StoredPromptPayCharge[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(PROMPTPAY_CHARGES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredPromptPayCharge[];
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    return parsed.filter((charge) => {
      const expiresAt = new Date(charge.expiresAt).getTime();
      return (
        charge.orderId &&
        charge.chargeId &&
        charge.qrCodeUrl &&
        Number.isFinite(expiresAt) &&
        expiresAt > now
      );
    });
  } catch {
    return [];
  }
}

function writeStoredPromptPayCharges(charges: StoredPromptPayCharge[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    PROMPTPAY_CHARGES_STORAGE_KEY,
    JSON.stringify(charges)
  );
}

function readStoredPaidOrders(): StoredPaidOrder[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(PAID_ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredPaidOrder[];
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    return parsed.filter((order) => {
      const paidAt = new Date(order.paidAt).getTime();
      return (
        order.orderId &&
        Number.isFinite(paidAt) &&
        now - paidAt <= PAID_ORDER_TTL_MS
      );
    });
  } catch {
    return [];
  }
}

function writeStoredPaidOrders(orders: StoredPaidOrder[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(PAID_ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export function markOrderPaid(input: { orderId: string; orderNo?: string }): void {
  if (!input.orderId) return;

  const paidOrder: StoredPaidOrder = {
    orderId: input.orderId,
    orderNo: input.orderNo,
    paidAt: new Date().toISOString(),
  };
  const orders = readStoredPaidOrders().filter(
    (order) => order.orderId !== input.orderId && order.orderNo !== input.orderNo
  );

  writeStoredPaidOrders([paidOrder, ...orders]);
}

export function isStoredOrderPaid(input: {
  orderId?: string;
  orderNo?: string;
}): boolean {
  if (!input.orderId && !input.orderNo) return false;

  return readStoredPaidOrders().some(
    (order) =>
      Boolean(input.orderId && order.orderId === input.orderId) ||
      Boolean(input.orderNo && order.orderNo === input.orderNo)
  );
}

export function getStoredPromptPayCharge(input: {
  orderId: string;
  amount?: number;
}): StoredPromptPayCharge | null {
  const charges = readStoredPromptPayCharges();
  const shouldMatchAmount =
    typeof input.amount === "number" && input.amount > 0;

  return charges.find((charge) => {
    if (charge.orderId !== input.orderId) return false;
    return shouldMatchAmount ? charge.amount === input.amount : true;
  }) ?? null;
}

export function storePromptPayCharge(charge: StoredPromptPayCharge): void {
  const charges = readStoredPromptPayCharges().filter(
    (stored) => stored.orderId !== charge.orderId
  );

  writeStoredPromptPayCharges([charge, ...charges]);
}

export function clearStoredPromptPayCharge(orderId: string): void {
  const charges = readStoredPromptPayCharges().filter(
    (stored) => stored.orderId !== orderId
  );

  writeStoredPromptPayCharges(charges);
}

export async function fetchOmiseConfig(): Promise<ApiOmiseConfigResponse> {
  const response = await ponponFetch("/api/payments/omise-config");

  if (!response.ok) {
    throw new Error(await readPaymentError(response, "Omise config failed"));
  }

  return response.json();
}

export async function createPromptPayPayment(
  body: ApiPromptPayPaymentRequest
): Promise<ApiPromptPayPaymentResponse> {
  const response = await ponponFetch("/api/payments/promptpay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readPaymentError(response, "PromptPay request failed"));
  }

  return response.json();
}

export async function createMobileBankingPayment(
  body: ApiMobileBankingPaymentRequest
): Promise<ApiMobileBankingPaymentResponse> {
  const response = await ponponFetch("/api/payments/mobile-banking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await readPaymentError(response, "Mobile banking request failed")
    );
  }

  return response.json();
}

export async function createCreditCardPayment(
  body: ApiCreditCardPaymentRequest
): Promise<ApiCreditCardPaymentResponse> {
  const response = await ponponFetch("/api/payments/credit-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await readPaymentError(response, "Credit card request failed")
    );
  }

  return response.json();
}

export async function fetchPaymentStatus(
  chargeId: string
): Promise<ApiPaymentStatusResponse> {
  const response = await ponponFetch(
    `/api/payments/${encodeURIComponent(chargeId)}/status`
  );

  if (!response.ok) {
    throw new Error(await readPaymentError(response, "Payment status failed"));
  }

  return response.json();
}

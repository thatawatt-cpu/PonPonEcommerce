/**
 * Mock LINE LIFF SDK.
 *
 * This intentionally does NOT load the real `@line/liff` SDK yet — every
 * function returns mock data so the demo flow works end-to-end inside a normal
 * browser (and a LINE WebView). Swap the bodies for real `liff.*` calls later.
 */
import { mockCustomerProfile } from "@/lib/mock-data";
import type { LiffProfile } from "@/types/liff";

const MOCK_DELAY = 350;

function wait<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Pretend to initialise the LIFF app with a liffId. Always succeeds. */
export async function initLiff(liffId?: string): Promise<{ ready: true }> {
  if (typeof console !== "undefined") {
    console.info(`[mock-liff] initLiff(${liffId ?? "MOCK_LIFF_ID"})`);
  }
  return wait({ ready: true });
}

/** In the mock, the user is always already logged in. */
export function isLiffLoggedIn(): boolean {
  return true;
}

/** Pretend to start the LINE login flow. No-op in the mock. */
export async function loginWithLine(): Promise<void> {
  console.info("[mock-liff] loginWithLine()");
  await wait(undefined, 150);
}

/** Return the mock LINE profile. */
export async function getLiffProfile(): Promise<LiffProfile> {
  return wait(mockCustomerProfile);
}

/** Open an external URL. Falls back to window.open in the browser mock. */
export function openExternalWindow(url: string, external = true): void {
  console.info(`[mock-liff] openExternalWindow(${url}, external=${external})`);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Pretend to close the LIFF window. No-op in the browser mock. */
export function closeLiffWindow(): void {
  console.info("[mock-liff] closeLiffWindow()");
}

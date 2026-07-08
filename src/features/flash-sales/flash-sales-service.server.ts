import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import type { ApiFlashSale } from "@/types/api";

export async function getActiveFlashSaleServer(): Promise<ApiFlashSale | null> {
  try {
    const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/flash-sales/active`, {
      cache: "no-store",
    });
    if (res.status === 204) return null;
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

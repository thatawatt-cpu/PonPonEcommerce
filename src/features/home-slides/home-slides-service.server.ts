import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import type { ApiHomeSlide } from "@/types/api";

export async function getHomeSlidesServer(): Promise<ApiHomeSlide[]> {
  try {
    const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/home-slides`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

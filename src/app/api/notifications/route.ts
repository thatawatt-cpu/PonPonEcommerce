import { NextRequest } from "next/server";
import {
  backendUnreachableResponse,
  getNotificationAuthHeaders,
  getNotificationsBackendUrl,
  proxyNotificationJsonResponse,
} from "@/lib/server/notification-proxy";

export async function GET(request: NextRequest) {
  const headers = getNotificationAuthHeaders(request);
  if (headers instanceof Response) return headers;

  try {
    const response = await fetch(getNotificationsBackendUrl("/api/notifications"), {
      headers,
      cache: "no-store",
    });
    return proxyNotificationJsonResponse(response);
  } catch {
    return backendUnreachableResponse();
  }
}

import { NextRequest } from "next/server";
import {
  backendUnreachableResponse,
  getNotificationAuthHeaders,
  getNotificationsBackendUrl,
  proxyNotificationJsonResponse,
} from "@/lib/server/notification-proxy";

export async function PATCH(request: NextRequest) {
  const headers = getNotificationAuthHeaders(request);
  if (headers instanceof Response) return headers;

  try {
    const response = await fetch(
      getNotificationsBackendUrl("/api/notifications/read-all"),
      {
        method: "PATCH",
        headers,
        cache: "no-store",
      }
    );
    return proxyNotificationJsonResponse(response);
  } catch {
    return backendUnreachableResponse();
  }
}

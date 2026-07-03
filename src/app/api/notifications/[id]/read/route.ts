import { NextRequest } from "next/server";
import {
  backendUnreachableResponse,
  getNotificationAuthHeaders,
  getNotificationsBackendUrl,
  proxyNotificationJsonResponse,
} from "@/lib/server/notification-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = getNotificationAuthHeaders(request);
  if (headers instanceof Response) return headers;

  const { id } = await params;

  try {
    const response = await fetch(
      getNotificationsBackendUrl(
        `/api/notifications/${encodeURIComponent(id)}/read`
      ),
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

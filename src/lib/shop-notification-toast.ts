import type { ShopNotificationPayload } from "@/store/notification-store";

export const SHOP_NOTIFICATION_TOAST_EVENT = "ponpon-shop-notification-toast";

export function dispatchShopNotificationToast(
  payload: ShopNotificationPayload
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ShopNotificationPayload>(SHOP_NOTIFICATION_TOAST_EVENT, {
      detail: payload,
    })
  );
}

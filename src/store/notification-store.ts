"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ponponFetch } from "@/features/auth/ponpon-auth";

export type ShopNotificationType =
  | "order_created"
  | "payment_created"
  | "payment_succeeded"
  | "payment_expired"
  | "packed"
  | "shipping_booked"
  | "shipping_status"
  | "refund_requested"
  | "refund_completed"
  | "return_requested"
  | "return_request_updated"
  | "return_refund_completed";

export type NotificationCategory = "order" | "promotion";

export interface ShopNotificationPayload {
  id?: string;
  type?: string;
  orderId?: string;
  orderNumber?: string;
  title?: string;
  message?: string;
  amount?: number;
  status?: string;
  trackingNumber?: string;
  actionUrl?: string | null;
  isRead?: boolean;
  readAtUtc?: string | null;
  createdAtUtc?: string;
}

export interface NotificationItem {
  id: string;
  type?: string;
  orderId?: string;
  orderNumber?: string;
  title: string;
  description: string;
  amount?: number;
  status?: string;
  trackingNumber?: string;
  createdAtUtc: string;
  href: string;
  category: NotificationCategory;
  unread: boolean;
  readAtUtc?: string | null;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addFromShopNotification: (payload: ShopNotificationPayload) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const MAX_NOTIFICATIONS = 50;

const NOTIFICATION_TITLE_BY_TYPE: Record<ShopNotificationType, string> = {
  order_created: "สร้างคำสั่งซื้อแล้ว",
  payment_created: "พร้อมชำระเงิน",
  payment_succeeded: "ชำระเงินสำเร็จ",
  payment_expired: "หมดเวลาชำระเงิน",
  packed: "กำลังเตรียมจัดส่ง",
  shipping_booked: "สร้างรายการจัดส่งแล้ว",
  shipping_status: "อัปเดตสถานะจัดส่ง",
  refund_requested: "ได้รับคำขอคืนเงินแล้ว",
  refund_completed: "คืนเงินเรียบร้อยแล้ว",
  return_requested: "ได้รับคำขอคืนสินค้า",
  return_request_updated: "อัปเดตคำขอคืนสินค้า",
  return_refund_completed: "คืนเงินเรียบร้อยแล้ว",
};

function isKnownShopNotificationType(
  type: string | undefined
): type is ShopNotificationType {
  return Boolean(
    type && Object.prototype.hasOwnProperty.call(NOTIFICATION_TITLE_BY_TYPE, type)
  );
}

export function getShopNotificationTitle(
  payload: ShopNotificationPayload
): string {
  if (payload.type === "shipping_status" && payload.title) {
    return payload.title;
  }

  if (isKnownShopNotificationType(payload.type)) {
    return NOTIFICATION_TITLE_BY_TYPE[payload.type];
  }

  return payload.title ?? "มีการแจ้งเตือนใหม่";
}

export function getShopNotificationDescription(
  payload: ShopNotificationPayload
): string {
  if (payload.message) return payload.message;

  if (payload.type === "payment_created") {
    return "คำสั่งซื้อพร้อมสำหรับการชำระเงินแล้ว";
  }

  if (payload.type === "payment_succeeded") {
    return "ระบบได้รับชำระเงินของคำสั่งซื้อแล้ว";
  }

  if (payload.type === "payment_expired") {
    return "คำสั่งซื้อนี้หมดเวลาชำระเงินแล้ว";
  }

  if (payload.type === "packed") {
    return "ร้านค้ากำลังเตรียมสินค้าเพื่อจัดส่ง";
  }

  if (payload.type === "shipping_booked") {
    return payload.trackingNumber
      ? `เลขติดตามพัสดุ ${payload.trackingNumber}`
      : "ร้านค้าสร้างรายการจัดส่งแล้ว";
  }

  if (payload.type === "refund_requested") {
    return "ระบบรับคำขอคืนเงินแล้ว กรุณารอร้านค้าดำเนินการ";
  }

  if (
    payload.type === "refund_completed" ||
    payload.type === "return_refund_completed"
  ) {
    return "ร้านค้าดำเนินการคืนเงินเรียบร้อยแล้ว";
  }

  if (payload.type === "return_requested") {
    return "ระบบรับคำขอคืนสินค้าแล้ว กรุณารอร้านค้าตรวจสอบ";
  }

  return "แตะเพื่อดูรายละเอียดคำสั่งซื้อ";
}

function getNotificationHref(payload: ShopNotificationPayload): string {
  if (payload.orderId) {
    return `/orders/${encodeURIComponent(payload.orderId)}`;
  }
  if (payload.actionUrl) return payload.actionUrl;
  if (payload.orderNumber) {
    return `/orders/${encodeURIComponent(payload.orderNumber)}`;
  }
  return "/notifications";
}

function getNotificationId(payload: ShopNotificationPayload): string {
  if (payload.id) return payload.id;

  return [
    payload.type ?? "shop",
    payload.orderId ?? payload.orderNumber ?? "order",
    payload.status ?? "status",
    payload.trackingNumber ?? "tracking",
    payload.createdAtUtc ?? Date.now(),
  ].join(":");
}

function toNotificationItem(
  payload: ShopNotificationPayload
): NotificationItem {
  return {
    id: getNotificationId(payload),
    type: payload.type,
    orderId: payload.orderId,
    orderNumber: payload.orderNumber,
    title: getShopNotificationTitle(payload),
    description: getShopNotificationDescription(payload),
    amount: payload.amount,
    status: payload.status,
    trackingNumber: payload.trackingNumber,
    createdAtUtc: payload.createdAtUtc ?? new Date().toISOString(),
    href: getNotificationHref(payload),
    category: "order",
    unread: payload.isRead === true ? false : true,
    readAtUtc: payload.readAtUtc ?? null,
  };
}

export function formatNotificationContext(
  notification: Pick<
    NotificationItem,
    "orderNumber" | "trackingNumber" | "status"
  >
): string {
  const details = [
    notification.orderNumber
      ? `คำสั่งซื้อ ${notification.orderNumber}`
      : null,
    notification.trackingNumber
      ? `เลขพัสดุ ${notification.trackingNumber}`
      : null,
    notification.status ? `สถานะ ${notification.status}` : null,
  ].filter(Boolean);

  return details.join(" · ");
}

function getPayloadList(data: unknown): ShopNotificationPayload[] {
  if (Array.isArray(data)) return data as ShopNotificationPayload[];

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["items", "notifications", "data"]) {
      const value = record[key];
      if (Array.isArray(value)) return value as ShopNotificationPayload[];
    }
  }

  return [];
}

function getUnreadCount(data: unknown): number {
  if (typeof data === "number" && Number.isFinite(data)) return data;

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["unreadCount", "count", "total"]) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
  }

  return 0;
}

export function formatNotificationTime(createdAtUtc: string): string {
  const createdAt = Date.parse(createdAtUtc);
  if (!Number.isFinite(createdAt)) return "";

  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return "เมื่อสักครู่";
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: async () => {
        set({ loading: true });
        try {
          const response = await ponponFetch("/api/notifications", {
            method: "GET",
          });

          if (!response.ok) return;

          const data = await response.json().catch(() => null);
          const items = getPayloadList(data).map(toNotificationItem);
          set({ items });
        } catch (error) {
          console.warn("[notifications] failed to fetch notifications", error);
        } finally {
          set({ loading: false });
        }
      },
      fetchUnreadCount: async () => {
        try {
          const response = await ponponFetch("/api/notifications/unread-count", {
            method: "GET",
          });

          if (!response.ok) return;

          const data = await response.json().catch(() => null);
          set({ unreadCount: getUnreadCount(data) });
        } catch (error) {
          console.warn("[notifications] failed to fetch unread count", error);
        }
      },
      addFromShopNotification: (payload) =>
        set((state) => {
          const item = toNotificationItem(payload);
          const previousItem = state.items.find(
            (notification) => notification.id === item.id
          );
          const existing = state.items.filter(
            (notification) => notification.id !== item.id
          );
          return {
            items: [item, ...existing].slice(0, MAX_NOTIFICATIONS),
            unreadCount: item.unread && !previousItem?.unread
              ? state.unreadCount + 1
              : state.unreadCount,
          };
        }),
      markRead: async (id) => {
        const previous = get();
        const target = previous.items.find(
          (notification) => notification.id === id
        );
        const wasUnread = Boolean(target?.unread);
        const readAtUtc = new Date().toISOString();

        set((state) => ({
          items: state.items.map((notification) =>
            notification.id === id
              ? { ...notification, unread: false, readAtUtc }
              : notification
          ),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        }));

        try {
          const response = await ponponFetch(
            `/api/notifications/${encodeURIComponent(id)}/read`,
            {
              method: "PATCH",
            }
          );

          if (response.ok) return;
        } catch (error) {
          console.warn("[notifications] failed to mark notification read", error);
        }

        set({
          items: previous.items,
          unreadCount: previous.unreadCount,
        });
      },
      markAllRead: async () => {
        const previous = get();
        const readAtUtc = new Date().toISOString();

        set((state) => ({
          items: state.items.map((notification) => ({
            ...notification,
            unread: false,
            readAtUtc: notification.readAtUtc ?? readAtUtc,
          })),
          unreadCount: 0,
        }));

        try {
          const response = await ponponFetch("/api/notifications/read-all", {
            method: "PATCH",
          });

          if (response.ok) return;
        } catch (error) {
          console.warn("[notifications] failed to mark all notifications read", error);
        }

        set({
          items: previous.items,
          unreadCount: previous.unreadCount,
        });
      },
    }),
    {
      name: "ponpon-notifications",
      partialize: (state) => ({
        items: state.items,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export function useNotificationsHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribeHydrate =
        useNotificationStore.persist.onHydrate(onStoreChange);
      const unsubscribeFinish =
        useNotificationStore.persist.onFinishHydration(onStoreChange);
      return () => {
        unsubscribeHydrate();
        unsubscribeFinish();
      };
    },
    () => useNotificationStore.persist.hasHydrated(),
    () => false
  );
}

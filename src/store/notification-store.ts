"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShopNotificationType =
  | "refund_completed"
  | "refund_requested"
  | "return_request_updated"
  | "return_refund_completed";

export type NotificationCategory = "order" | "promotion";

export interface ShopNotificationPayload {
  type?: ShopNotificationType;
  orderId?: string;
  orderNumber?: string;
  title?: string;
  message?: string;
  amount?: number;
  status?: string;
  actionUrl?: string | null;
  createdAtUtc?: string;
}

export interface NotificationItem {
  id: string;
  type?: ShopNotificationType;
  title: string;
  description: string;
  createdAtUtc: string;
  href: string;
  category: NotificationCategory;
  unread: boolean;
}

interface NotificationState {
  items: NotificationItem[];
  addFromShopNotification: (payload: ShopNotificationPayload) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

const MAX_NOTIFICATIONS = 50;

function getNotificationTitle(payload: ShopNotificationPayload): string {
  if (
    payload.type === "refund_completed" ||
    payload.type === "return_refund_completed"
  ) {
    return "คืนเงินเรียบร้อยแล้ว";
  }

  if (payload.title) return payload.title;

  if (payload.type === "refund_requested") {
    return "ส่งคำขอคืนเงินแล้ว";
  }

  if (payload.type === "return_request_updated") {
    return "อัปเดตคำขอคืนสินค้า";
  }

  return "มีการแจ้งเตือนใหม่";
}

function getNotificationDescription(
  payload: ShopNotificationPayload
): string {
  if (payload.message) return payload.message;

  if (
    payload.type === "refund_completed" ||
    payload.type === "return_refund_completed"
  ) {
    return "ร้านค้าดำเนินการคืนเงินเรียบร้อยแล้ว";
  }

  if (payload.type === "refund_requested") {
    return "ระบบรับคำขอคืนเงินแล้ว กรุณารอร้านค้าดำเนินการ";
  }

  return "แตะเพื่อดูรายละเอียดคำสั่งซื้อ";
}

function getNotificationHref(payload: ShopNotificationPayload): string {
  if (payload.actionUrl) return payload.actionUrl;
  if (payload.orderNumber) {
    return `/orders/${encodeURIComponent(payload.orderNumber)}`;
  }
  if (payload.orderId) {
    return `/orders/${encodeURIComponent(payload.orderId)}`;
  }
  return "/notifications";
}

function getNotificationId(payload: ShopNotificationPayload): string {
  return [
    payload.type ?? "shop",
    payload.orderId ?? payload.orderNumber ?? "order",
    payload.status ?? "status",
    payload.createdAtUtc ?? Date.now(),
  ].join(":");
}

function toNotificationItem(
  payload: ShopNotificationPayload
): NotificationItem {
  return {
    id: getNotificationId(payload),
    type: payload.type,
    title: getNotificationTitle(payload),
    description: getNotificationDescription(payload),
    createdAtUtc: payload.createdAtUtc ?? new Date().toISOString(),
    href: getNotificationHref(payload),
    category: "order",
    unread: true,
  };
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
      addFromShopNotification: (payload) =>
        set((state) => {
          const item = toNotificationItem(payload);
          const existing = state.items.filter(
            (notification) => notification.id !== item.id
          );
          return {
            items: [item, ...existing].slice(0, MAX_NOTIFICATIONS),
          };
        }),
      markRead: (id) =>
        set((state) => ({
          items: state.items.map((notification) =>
            notification.id === id
              ? { ...notification, unread: false }
              : notification
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          items: state.items.map((notification) => ({
            ...notification,
            unread: false,
          })),
        })),
      unreadCount: () =>
        get().items.filter((notification) => notification.unread).length,
    }),
    {
      name: "ponpon-notifications",
      partialize: (state) => ({ items: state.items }),
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

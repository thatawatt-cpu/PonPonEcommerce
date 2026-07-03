"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { CheckCircle2, X } from "lucide-react";
import {
  getStoredPonPonJwt,
  isStoredJwtValid,
  PONPON_AUTH_TOKEN_CHANGED_EVENT,
} from "@/features/auth/ponpon-auth";
import { cn } from "@/lib/utils";
import {
  getShopNotificationDescription,
  getShopNotificationTitle,
  type ShopNotificationPayload,
  type ShopNotificationType,
  useNotificationStore,
} from "@/store/notification-store";
import { SHOP_NOTIFICATION_TOAST_EVENT } from "@/lib/shop-notification-toast";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
}

const TOAST_DURATION_MS = 6000;
const IMPORTANT_TOAST_TYPES = new Set<ShopNotificationType>([
  "payment_succeeded",
  "shipping_booked",
  "shipping_status",
  "refund_completed",
  "return_refund_completed",
]);

function shouldShowToast(payload: ShopNotificationPayload): boolean {
  return Boolean(
    payload.type && IMPORTANT_TOAST_TYPES.has(payload.type as ShopNotificationType)
  );
}

function buildToast(payload: ShopNotificationPayload): ToastNotification {
  return {
    id: [
      payload.type ?? "shop",
      payload.orderId ?? payload.orderNumber ?? payload.id ?? "notification",
    ].join(":"),
    title: getShopNotificationTitle(payload),
    message: getShopNotificationDescription(payload),
    orderNumber: payload.orderNumber,
  };
}

export function ShopNotificationListener({ hubUrl }: { hubUrl: string }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [authVersion, setAuthVersion] = useState(0);
  const addFromShopNotification = useNotificationStore(
    (state) => state.addFromShopNotification
  );
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications
  );
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount
  );
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (payload: ShopNotificationPayload) => {
      const toast = buildToast(payload);
      const existingTimer = timersRef.current.get(toast.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      setToasts((items) =>
        [toast, ...items.filter((item) => item.id !== toast.id)].slice(0, 3)
      );

      const timer = setTimeout(() => {
        dismissToast(toast.id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(toast.id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const payload = (event as CustomEvent<ShopNotificationPayload>).detail;
      if (payload && shouldShowToast(payload)) {
        showToast(payload);
      }
    };

    window.addEventListener(SHOP_NOTIFICATION_TOAST_EVENT, handleToastEvent);
    return () =>
      window.removeEventListener(
        SHOP_NOTIFICATION_TOAST_EVENT,
        handleToastEvent
      );
  }, [showToast]);

  useEffect(() => {
    const notifyAuthChanged = () => setAuthVersion((value) => value + 1);
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "ponpon.auth.jwt") {
        notifyAuthChanged();
      }
    };

    window.addEventListener(PONPON_AUTH_TOKEN_CHANGED_EVENT, notifyAuthChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        PONPON_AUTH_TOKEN_CHANGED_EVENT,
        notifyAuthChanged
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!getStoredPonPonJwt() || !isStoredJwtValid()) {
      return;
    }

    let connection: HubConnection | null = null;
    let cancelled = false;

    const startConnection = async () => {
      connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => getStoredPonPonJwt() ?? "",
        })
        .withAutomaticReconnect()
        .configureLogging(
          process.env.NODE_ENV === "development"
            ? LogLevel.Information
            : LogLevel.Warning
        )
        .build();

      connection.on(
        "shopNotification",
        (payload: ShopNotificationPayload) => {
          addFromShopNotification(payload);
          if (shouldShowToast(payload)) {
            showToast(payload);
          }
        }
      );

      try {
        await connection.start();
      } catch (error) {
        if (!cancelled) {
          console.warn("[shop-notifications] SignalR connection failed", error);
        }
      } finally {
        if (!cancelled) {
          await Promise.allSettled([
            fetchNotifications(),
            fetchUnreadCount(),
          ]);
        }
      }
    };

    void startConnection();

    return () => {
      cancelled = true;
      if (
        connection &&
        connection.state !== HubConnectionState.Disconnected
      ) {
        void connection.stop();
      }
    };
  }, [
    authVersion,
    addFromShopNotification,
    dismissToast,
    fetchNotifications,
    fetchUnreadCount,
    hubUrl,
    showToast,
  ]);

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-3 z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-white p-3 text-ink shadow-[0_14px_36px_rgba(33,27,27,0.16)] ring-1 ring-black/[0.05]",
            "animate-fade-up"
          )}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">{toast.title}</span>
            <span className="mt-0.5 block text-xs font-semibold text-ink-soft">
              {toast.orderNumber ? `${toast.orderNumber} · ` : ""}
              {toast.message}
            </span>
          </span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="ปิดการแจ้งเตือน"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

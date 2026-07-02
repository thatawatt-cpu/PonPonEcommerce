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

type ShopNotificationType =
  | "refund_completed"
  | "refund_requested"
  | "return_request_updated"
  | "return_refund_completed";

interface ShopNotificationPayload {
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

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
}

const HUB_URL = "/hubs/shop-notifications";
const REFUND_COMPLETED_TYPES = new Set<ShopNotificationType>([
  "refund_completed",
  "return_refund_completed",
]);
const TOAST_DURATION_MS = 6000;

function isRefundCompletedNotification(
  payload: ShopNotificationPayload
): boolean {
  return Boolean(payload.type && REFUND_COMPLETED_TYPES.has(payload.type));
}

function buildToast(payload: ShopNotificationPayload): ToastNotification {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    title: "คืนเงินเรียบร้อยแล้ว",
    message:
      payload.message ||
      "ร้านค้าดำเนินการคืนเงินและยกเลิกคำสั่งซื้อเรียบร้อยแล้ว",
    orderNumber: payload.orderNumber,
  };
}

export function ShopNotificationListener() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [authVersion, setAuthVersion] = useState(0);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

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

    const showToast = (payload: ShopNotificationPayload) => {
      const toast = buildToast(payload);
      setToasts((items) => [toast, ...items].slice(0, 3));

      const timer = setTimeout(() => {
        dismissToast(toast.id);
      }, TOAST_DURATION_MS);
      timersRef.current.set(toast.id, timer);
    };

    const startConnection = async () => {
      connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
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
          if (isRefundCompletedNotification(payload)) {
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
  }, [authVersion, dismissToast]);

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
    <div className="pointer-events-none fixed left-0 right-0 top-16 z-[70] flex flex-col items-center gap-2 px-3">
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

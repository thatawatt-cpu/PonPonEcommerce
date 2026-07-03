"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  ReceiptText,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatNotificationContext,
  formatNotificationTime,
  type NotificationCategory,
  useNotificationStore,
  useNotificationsHydrated,
} from "@/store/notification-store";

type NotificationFilter = "all" | "unread" | NotificationCategory;

const filters: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unread", label: "ยังไม่อ่าน" },
  { value: "order", label: "ออเดอร์" },
  { value: "promotion", label: "โปรโมชัน" },
];

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const hydrated = useNotificationsHydrated();
  const notifications = useNotificationStore((state) => state.items);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const markRead = useNotificationStore((state) => state.markRead);
  const storeUnreadCount = useNotificationStore((state) => state.unreadCount);

  const filteredNotifications = useMemo(() => {
    if (!hydrated) return [];
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") {
      return notifications.filter((notification) => notification.unread);
    }
    return notifications.filter(
      (notification) => notification.category === activeFilter
    );
  }, [activeFilter, hydrated, notifications]);

  const unreadCount = hydrated ? storeUnreadCount : 0;

  return (
    <>
      <AppHeader
        title="การแจ้งเตือน"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-4 pt-4">
        <Card className="overflow-hidden p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-ink">
                การแจ้งเตือนทั้งหมด
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                {unreadCount > 0
                  ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
                  : "อ่านครบทั้งหมดแล้ว"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-3 py-2 text-xs font-extrabold text-brand"
              >
                <CheckCheck className="h-4 w-4" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition",
                  activeFilter === filter.value
                    ? "bg-brand text-white"
                    : "bg-surface-muted text-ink-soft"
                )}
              >
                {filter.label}
                {filter.value === "unread" && unreadCount > 0
                  ? ` (${unreadCount})`
                  : ""}
              </button>
            ))}
          </div>
        </Card>

        {filteredNotifications.length > 0 ? (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-black/[0.05]">
              {filteredNotifications.map((notification) => {
                const context = formatNotificationContext(notification);
                return (
                  <li key={notification.id}>
                    <Link
                      href={notification.href}
                      onClick={() => void markRead(notification.id)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-4 transition active:bg-brand-soft",
                        notification.unread && "bg-brand-soft/35"
                      )}
                    >
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-black/[0.04]">
                        <ReceiptText className="h-5 w-5" />
                        {notification.unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold text-ink">
                          {notification.title}
                        </span>
                        {context && (
                          <span className="mt-1 block text-xs font-extrabold text-brand">
                            {context}
                          </span>
                        )}
                        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                          {notification.description}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-semibold text-ink-soft/75">
                          {formatNotificationTime(notification.createdAtUtc)}
                        </span>
                      </span>
                      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-ink-soft" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <Card className="px-4 py-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink-soft/40" />
            <p className="mt-3 text-sm font-extrabold text-ink">
              ไม่มีการแจ้งเตือนในหมวดนี้
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              ลองเลือกหมวดอื่นเพื่อดูรายการที่ผ่านมา
            </p>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

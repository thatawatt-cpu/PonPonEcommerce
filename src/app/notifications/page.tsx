"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Gift,
  PackageCheck,
  ReceiptText,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NotificationCategory = "order" | "promotion";
type NotificationFilter = "all" | "unread" | NotificationCategory;

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  href: string;
  category: NotificationCategory;
  unread: boolean;
  icon: LucideIcon;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "กำลังตรวจสอบการชำระเงิน ORD001",
    description: "ร้านได้รับหลักฐานการชำระเงินแล้ว และกำลังตรวจสอบยอด",
    time: "5 นาทีที่แล้ว",
    href: "/orders/ORD001",
    category: "order",
    unread: true,
    icon: ReceiptText,
  },
  {
    id: "n2",
    title: "คูปองใหม่พร้อมใช้",
    description: "รับส่วนลด ฿50 เมื่อช้อปครบ ฿499 ใช้ได้ถึง 15 มิ.ย. 2569",
    time: "1 ชม. ที่แล้ว",
    href: "/coupons",
    category: "promotion",
    unread: true,
    icon: TicketPercent,
  },
  {
    id: "n3",
    title: "Flash Sale เริ่มแล้ว",
    description: "ดีลพิเศษจำนวนจำกัดสำหรับคุณ ลดสูงสุด 50%",
    time: "วันนี้ 09:00",
    href: "/products",
    category: "promotion",
    unread: false,
    icon: Bell,
  },
  {
    id: "n4",
    title: "ออเดอร์ ORD002 จัดส่งแล้ว",
    description: "พัสดุออกจากร้านแล้ว สามารถติดตามสถานะได้ทันที",
    time: "เมื่อวาน 08:45",
    href: "/orders/ORD002",
    category: "order",
    unread: false,
    icon: Truck,
  },
  {
    id: "n5",
    title: "ร้านกำลังเตรียมสินค้า",
    description: "ออเดอร์ ORD002 แพ็กสินค้าเรียบร้อยและเตรียมส่งให้ขนส่ง",
    time: "6 มิ.ย. 2569 14:20",
    href: "/orders/ORD002",
    category: "order",
    unread: false,
    icon: PackageCheck,
  },
  {
    id: "n6",
    title: "ดีลซื้อคู่ประหยัดเพิ่ม",
    description: "เลือกสินค้าที่ร่วมรายการ 2 ชิ้น รับส่วนลดเพิ่มทันที",
    time: "5 มิ.ย. 2569 11:30",
    href: "/products",
    category: "promotion",
    unread: false,
    icon: Gift,
  },
];

const filters: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "unread", label: "ยังไม่อ่าน" },
  { value: "order", label: "ออเดอร์" },
  { value: "promotion", label: "โปรโมชัน" },
];

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState(initialNotifications);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") {
      return notifications.filter((notification) => notification.unread);
    }
    return notifications.filter(
      (notification) => notification.category === activeFilter
    );
  }, [activeFilter, notifications]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAllRead = () => {
    setNotifications((items) =>
      items.map((notification) => ({ ...notification, unread: false }))
    );
  };

  const markRead = (id: string) => {
    setNotifications((items) =>
      items.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

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
                onClick={markAllRead}
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
                const Icon = notification.icon;
                return (
                  <li key={notification.id}>
                    <Link
                      href={notification.href}
                      onClick={() => markRead(notification.id)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-4 transition active:bg-brand-soft",
                        notification.unread && "bg-brand-soft/35"
                      )}
                    >
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-black/[0.04]">
                        <Icon className="h-5 w-5" />
                        {notification.unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold text-ink">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                          {notification.description}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-semibold text-ink-soft/75">
                          {notification.time}
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

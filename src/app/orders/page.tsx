"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  PackageSearch,
  PackageCheck,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { OrderStatusBadge } from "@/components/ui/status-badge";
import { getOrders } from "@/features/orders/order-service";
import { getOrderItemCount } from "@/features/orders/order-utils";
import { formatBaht, formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/order";

type OrderFilter =
  | "all"
  | "payment"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled";

const orderFilters: {
  value: OrderFilter;
  label: string;
  statuses?: OrderStatus[];
}[] = [
  { value: "all", label: "ทั้งหมด" },
  {
    value: "payment",
    label: "รอชำระ",
    statuses: ["pending", "reviewing_payment"],
  },
  {
    value: "preparing",
    label: "กำลังเตรียม",
    statuses: ["paid", "preparing"],
  },
  { value: "shipped", label: "จัดส่งแล้ว", statuses: ["shipped"] },
  { value: "completed", label: "สำเร็จ", statuses: ["completed"] },
  { value: "cancelled", label: "ยกเลิก", statuses: ["cancelled"] },
];

const progressByStatus: Record<OrderStatus, number> = {
  pending: 10,
  reviewing_payment: 28,
  paid: 45,
  preparing: 62,
  shipped: 82,
  completed: 100,
  cancelled: 0,
};

const helperByStatus: Record<OrderStatus, string> = {
  pending: "กรุณาชำระเงินเพื่อยืนยันออเดอร์",
  reviewing_payment: "ร้านกำลังตรวจสอบหลักฐานการชำระเงิน",
  paid: "ชำระเงินแล้ว รอร้านเตรียมสินค้า",
  preparing: "ร้านกำลังแพ็กสินค้าให้คุณ",
  shipped: "สินค้าออกเดินทางแล้ว",
  completed: "จัดส่งสำเร็จ ขอบคุณที่อุดหนุน",
  cancelled: "ออเดอร์นี้ถูกยกเลิก",
};

function OrderCard({ order }: { order: Order }) {
  const progress = progressByStatus[order.orderStatus];
  const isShipped = order.orderStatus === "shipped";

  return (
    <Link href={`/orders/${order.orderNo}`} className="group block">
      <Card className="overflow-hidden transition duration-200 group-active:scale-[0.985]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
              {isShipped ? (
                <PackageCheck className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink">{order.orderNo}</p>
              <p className="text-[10px] font-medium text-ink-soft">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <OrderStatusBadge status={order.orderStatus} />
        </div>

        <div className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 -space-x-3">
              {order.items.slice(0, 3).map((item, index) => (
                <ProductImage
                  key={`${item.productId}-${index}`}
                  imageUrl={item.imageUrl}
                  emoji={item.emoji}
                  size="sm"
                  className="h-12 w-12 rounded-2xl ring-2 ring-white"
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {order.items[0]?.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {getOrderItemCount(order)} ชิ้น
                {order.items.length > 1
                  ? ` · อีก ${order.items.length - 1} รายการ`
                  : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-ink-soft">ยอดรวม</p>
              <p className="text-base font-extrabold text-brand">
                {formatBaht(order.total)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="truncate text-[11px] font-semibold text-ink-soft">
                {helperByStatus[order.orderStatus]}
              </p>
              <span className="shrink-0 text-[10px] font-bold text-brand">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-soft">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ff5457,#ed171c)] shadow-[0_0_8px_rgba(237,23,28,0.35)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-surface-muted/65 px-4 py-2.5">
          <span className="text-[11px] font-semibold text-ink-soft">
            อัปเดตล่าสุด {formatDate(order.createdAt)}
          </span>
          <span className="flex items-center gap-1 text-xs font-extrabold text-brand">
            ติดตามออเดอร์
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function OrdersPage() {
  const orders = getOrders();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const activeOrders = orders.filter(
    (order) =>
      order.orderStatus !== "completed" &&
      order.orderStatus !== "cancelled"
  ).length;
  const normalizedQuery = query.trim().toLocaleLowerCase("th");
  const filteredOrders = useMemo(() => {
    const filter = orderFilters.find((item) => item.value === activeFilter);

    return orders.filter((order) => {
      const matchesStatus =
        !filter?.statuses || filter.statuses.includes(order.orderStatus);
      const matchesQuery =
        !normalizedQuery ||
        order.orderNo.toLocaleLowerCase("th").includes(normalizedQuery) ||
        order.items.some((item) =>
          item.name.toLocaleLowerCase("th").includes(normalizedQuery)
        );

      return matchesStatus && matchesQuery;
    });
  }, [activeFilter, normalizedQuery, orders]);

  const getFilterCount = (statuses?: OrderStatus[]) =>
    statuses
      ? orders.filter((order) => statuses.includes(order.orderStatus)).length
      : orders.length;

  return (
    <>
      <AppHeader title="ออเดอร์ของฉัน" />
      <PageContainer className="pt-4">
        {orders.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="ยังไม่มีคำสั่งซื้อ"
            description="เริ่มช้อปกับ Pon Pon ได้เลย"
            action={
              <Link href="/products">
                <Button>เลือกซื้อสินค้า</Button>
              </Link>
            }
          />
        ) : (
          <>
            <section className="mb-4 overflow-hidden rounded-card bg-brand px-4 py-4 text-white shadow-[0_12px_28px_rgba(190,9,14,0.2)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/75">
                    สถานะการสั่งซื้อ
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold">
                    {activeOrders} ออเดอร์กำลังดำเนินการ
                  </h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16">
                  <ShoppingBag className="h-6 w-6" />
                </span>
              </div>
              <Link
                href="/products"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/90"
              >
                ช้อปต่อ
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="mb-4 overflow-hidden rounded-card bg-white shadow-[0_9px_26px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]">
              <div className="no-scrollbar flex overflow-x-auto border-b border-black/[0.05] px-2 pt-1">
                {orderFilters.map((filter) => {
                  const isActive = activeFilter === filter.value;
                  const count = getFilterCount(filter.statuses);

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setActiveFilter(filter.value)}
                      className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-bold transition ${
                        isActive ? "text-brand" : "text-ink-soft"
                      }`}
                    >
                      {filter.label}
                      {count > 0 && (
                        <span
                          className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] ${
                            isActive
                              ? "bg-brand text-white"
                              : "bg-surface-muted text-ink-soft"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative m-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  type="search"
                  aria-label="ค้นหาประวัติคำสั่งซื้อ"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ค้นหาเลขออเดอร์ หรือชื่อสินค้า"
                  className="w-full rounded-2xl border border-black/[0.06] bg-surface-muted/70 py-3 pl-10 pr-10 text-sm text-ink outline-none transition placeholder:text-ink-soft/65 focus:border-brand/30 focus:bg-white focus:ring-3 focus:ring-brand/10"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </section>

            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="rounded-card bg-white shadow-sm ring-1 ring-black/[0.04]">
                <EmptyState
                  emoji=""
                  title="ไม่พบประวัติที่ค้นหา"
                  description="ลองเปลี่ยนสถานะ หรือตรวจสอบเลขออเดอร์และชื่อสินค้าอีกครั้ง"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter("all");
                        setQuery("");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand"
                    >
                      <PackageSearch className="h-4 w-4" />
                      ดูออเดอร์ทั้งหมด
                    </button>
                  }
                />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}

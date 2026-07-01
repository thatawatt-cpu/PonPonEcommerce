import Link from "next/link";
import { Clock3, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ProductCard } from "@/components/product/product-card";
import { Card } from "@/components/ui/card";
import type { Product } from "@/types/product";

export default function RecentlyViewedPage() {
  const recentProducts: Product[] = [];

  return (
    <>
      <AppHeader title="ดูล่าสุด" showBack />
      <PageContainer className="space-y-4 pt-4">
        <Card className="overflow-hidden p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-ink">
                สินค้าที่ดูล่าสุด
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                กลับไปดูสินค้าที่เคยเปิดไว้ ไม่ต้องค้นหาใหม่
              </p>
            </div>
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-brand-soft text-brand">
              <Clock3 className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1 text-xs font-extrabold text-white ring-2 ring-white">
                {recentProducts.length}
              </span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#fff8f6] px-3 py-2">
              <p className="text-[10px] font-bold text-ink-soft">ล่าสุด</p>
              <p className="mt-0.5 truncate text-xs font-extrabold text-ink">
                {recentProducts[0]?.name ?? "ยังไม่มีข้อมูล"}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff8f6] px-3 py-2">
              <p className="text-[10px] font-bold text-ink-soft">
                เก็บย้อนหลัง
              </p>
              <p className="mt-0.5 text-xs font-extrabold text-ink">
                30 วันล่าสุด
              </p>
            </div>
          </div>
        </Card>

        {recentProducts.length > 0 ? (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-extrabold text-ink">
                  รายการล่าสุด
                </h2>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[11px] font-extrabold text-brand"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  ล้างประวัติ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {recentProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            </section>

            <Link
              href="/products"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-soft text-sm font-extrabold text-brand ring-1 ring-brand/10"
            >
              <RotateCcw className="h-4 w-4" />
              ดูสินค้าทั้งหมด
            </Link>
          </>
        ) : (
          <Card className="px-4 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ShoppingBag className="h-8 w-8" />
            </span>
            <p className="mt-4 text-base font-extrabold text-ink">
              ยังไม่มีสินค้าที่ดูล่าสุด
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-soft">
              เมื่อคุณเปิดดูรายละเอียดสินค้า ระบบจะแสดงรายการไว้ที่นี่
            </p>
            <Link
              href="/products"
              className="brand-button mt-5 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-extrabold text-white"
            >
              เริ่มเลือกสินค้า
            </Link>
          </Card>
        )}
      </PageContainer>
    </>
  );
}

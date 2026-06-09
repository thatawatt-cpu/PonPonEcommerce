import Link from "next/link";
import { ArrowRight, PackageSearch, Sparkles, Flame } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { PonPonLogo } from "@/components/brand/ponpon-logo";
import { ProductCard } from "@/components/product/product-card";
import {
  getBestSellers,
  getCategories,
  getFeaturedProducts,
} from "@/features/products/product-service";
import { SHOP_NAME, SHOP_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  const categories = getCategories().filter((c) => c.id !== "all");
  const bestSellers = getBestSellers();
  const featured = getFeaturedProducts();

  return (
    <>
      <AppHeader />
      <PageContainer className="pt-4">
        {/* Hero */}
        <section className="overflow-hidden rounded-card bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-md shadow-brand/30">
          <PonPonLogo size={48} className="mb-3" />
          <h1 className="text-2xl font-extrabold leading-tight">
            {SHOP_NAME} Store
          </h1>
          <p className="mt-1 text-sm text-white/90">{SHOP_TAGLINE}</p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/products"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-brand shadow-sm"
            >
              ดูสินค้าทั้งหมด
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/orders"
              className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-base font-bold text-white ring-1 ring-white/40"
            >
              <PackageSearch className="h-5 w-5" />
              ติดตามออเดอร์
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-ink">หมวดหมู่สินค้า</h2>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/5">
                  {cat.emoji}
                </span>
                <span className="text-center text-[11px] font-medium text-ink-soft">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Best sellers */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <Flame className="h-5 w-5 text-brand" />
              สินค้าขายดี
            </h2>
            <Link href="/products" className="text-sm font-medium text-brand">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>

        {/* Featured */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-bold text-ink">
              <Sparkles className="h-5 w-5 text-amber-500" />
              สินค้าแนะนำ
            </h2>
            <Link href="/products" className="text-sm font-medium text-brand">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      </PageContainer>
    </>
  );
}

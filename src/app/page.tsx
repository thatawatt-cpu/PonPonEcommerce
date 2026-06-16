import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryIcon } from "@/components/product/category-icon";
import { ProductCard } from "@/components/product/product-card";
import { FlashSaleSection } from "@/components/product/flash-sale-section";
import { CouponSection } from "@/components/home/coupon-section";
import { PromoHeroCarousel } from "@/components/home/promo-hero-carousel";
import { ShopBenefits } from "@/components/home/shop-benefits";
import { ReorderSection } from "@/components/home/reorder-section";
import {
  getAllProducts,
  getBestSellers,
  getCategories,
  getFeaturedProducts,
} from "@/features/products/product-service";

export default function HomePage() {
  const categories = getCategories().filter((category) => category.id !== "all");
  const bestSellers = getBestSellers();
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  const flashSaleProducts = [...bestSellers, ...featured]
    .filter(
      (product, index, items) =>
        items.findIndex((item) => item.id === product.id) === index
    )
    .slice(0, 4);
  const reorderProducts = ["1", "2", "4"]
    .map((id) => allProducts.find((product) => product.id === id))
    .filter((product) => product !== undefined);

  return (
    <>
      <AppHeader />
      <PageContainer className="pt-3.5">
        <PromoHeroCarousel />

        <section className="mt-4 rounded-card bg-white px-2 py-3 shadow-[0_8px_24px_rgba(65,25,25,0.06)]">
          <div className="grid grid-cols-5 gap-1">
            {categories.map((category) => {
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group flex min-w-0 flex-col items-center gap-1.5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand transition group-active:scale-90 md:h-14 md:w-14">
                    <CategoryIcon
                      categoryId={category.id}
                      className="h-5 w-5 md:h-6 md:w-6"
                    />
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-semibold text-ink-soft md:text-xs">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <FlashSaleSection products={flashSaleProducts} />
        <CouponSection />
        <ShopBenefits />

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="promo-section-title flex items-center gap-1.5">
              <Flame className="h-5 w-5 fill-brand text-brand" />
              สินค้าขายดี
            </h2>
            <Link
              href="/products"
              className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>

        <ReorderSection products={reorderProducts} />

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="promo-section-title flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-amber-500" />
              แนะนำสำหรับคุณ
            </h2>
            <Link
              href="/products"
              className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </section>
      </PageContainer>
    </>
  );
}

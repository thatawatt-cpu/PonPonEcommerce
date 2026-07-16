import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryIcon } from "@/components/product/category-icon";
import { ProductCard } from "@/components/product/product-card";
import { FlashSaleSection } from "@/components/product/flash-sale-section";
import { PromoHeroCarousel } from "@/components/home/promo-hero-carousel";
import { ShopBenefits } from "@/components/home/shop-benefits";
import { ReorderSection } from "@/components/home/reorder-section";
import { CouponSection } from "@/components/home/coupon-section";
import { getCategoriesServer } from "@/features/products/product-service.server";
import { getShopHomeServer } from "@/features/shop-home/shop-home-service.server";
import {
  buildFlashSaleProducts,
  mergeFlashSaleProducts,
} from "@/features/flash-sales/flash-sale-products";

export default async function HomePage() {
  const [home, rawCategories] = await Promise.all([
    getShopHomeServer({ salesChannel: "line_liff", featuredProductLimit: 12 }),
    getCategoriesServer(),
  ]);

  const products = home.featuredProducts;
  const flashSaleProducts = buildFlashSaleProducts(products, home.flashSale);
  const displayProducts = mergeFlashSaleProducts(products, flashSaleProducts);
  const categories = rawCategories.filter((c) => c.id !== "all");
  const bestSellers = displayProducts.filter((p) => p.isBestSeller);
  const featured = displayProducts.filter((p) => p.isFeatured);

  const reorderProducts = displayProducts.slice(0, 3);

  return (
    <>
      <AppHeader />
      <PageContainer className="pt-3.5 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <PromoHeroCarousel slides={home.slides} />

        <section className="home-panel-shadow mt-4 rounded-card bg-white">
          <div className="no-scrollbar flex overflow-x-auto px-2 py-3 md:grid md:grid-cols-5 md:overflow-visible md:px-4 lg:grid-cols-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.id)}`}
                className="group flex w-16 shrink-0 flex-col items-center gap-1.5 px-1 md:w-auto md:py-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand transition group-active:scale-90 md:h-14 md:w-14">
                  <CategoryIcon
                    categoryId={category.id}
                    className="h-5 w-5 md:h-6 md:w-6"
                  />
                </span>
                <span className="w-full text-center text-[10px] font-semibold leading-tight text-ink-soft md:text-xs">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {home.flashSale && flashSaleProducts.length > 0 && (
          <FlashSaleSection
            products={flashSaleProducts}
            slots={home.flashSale.slots}
          />
        )}
        <CouponSection coupons={home.availableCoupons} />
        <ShopBenefits />

        {bestSellers.length > 0 && (
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
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {bestSellers.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}

        <ReorderSection products={reorderProducts} />

        {featured.length > 0 && (
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
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </PageContainer>
    </>
  );
}

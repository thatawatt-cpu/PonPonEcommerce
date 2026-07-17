import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import {
  getAllProductsServer,
  getCategoriesServer,
} from "@/features/products/product-service.server";
import { ProductsClient } from "./products-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; coupon?: string; flashSale?: string }>;
}) {
  const { category, coupon, flashSale: flashSaleParam } = await searchParams;

  const [products, categories] = await Promise.all([
    getAllProductsServer(),
    getCategoriesServer(),
  ]);
  const flashSaleProductIds = products
    .filter((product) => product.priceSource === "flash_sale")
    .map((product) => product.id);
  const initialCategory =
    flashSaleParam === "1" && flashSaleProductIds.length > 0
      ? "flash-sale"
      : category ?? "all";

  return (
    <>
      <AppHeader title="สินค้าทั้งหมด" />
      <PageContainer className="pt-4 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <ProductsClient
          products={products}
          categories={categories}
          initialCategory={initialCategory}
          selectedCouponCode={coupon}
          flashSaleProductIds={flashSaleProductIds}
        />
      </PageContainer>
    </>
  );
}

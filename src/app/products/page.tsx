import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import {
  getAllProductsServer,
  getCategoriesServer,
} from "@/features/products/product-service.server";
import { getActiveFlashSaleServer } from "@/features/flash-sales/flash-sales-service.server";
import { ProductsClient } from "./products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; coupon?: string; flashSale?: string }>;
}) {
  const { category, coupon, flashSale: flashSaleParam } = await searchParams;

  const [products, categories, flashSale] = await Promise.all([
    getAllProductsServer(),
    getCategoriesServer(),
    getActiveFlashSaleServer(),
  ]);
  const flashSaleProductMap = new Map(
    flashSale?.products.map((p) => [p.productId, p]) ?? []
  );
  const productsWithFlashSale = flashSaleProductMap.size > 0
    ? products.map((product) => {
        const flashSaleProduct = flashSaleProductMap.get(product.id);
        return flashSaleProduct
          ? {
              ...product,
              price: flashSaleProduct.salePrice,
              compareAtPrice: flashSaleProduct.originalPrice,
            }
          : product;
      })
    : products;
  const initialCategory =
    flashSaleParam === "1" && flashSaleProductMap.size > 0
      ? "flash-sale"
      : category ?? "all";

  return (
    <>
      <AppHeader title="สินค้าทั้งหมด" />
      <PageContainer className="pt-4 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <ProductsClient
          products={productsWithFlashSale}
          categories={categories}
          initialCategory={initialCategory}
          selectedCouponCode={coupon}
          flashSaleProductIds={[...flashSaleProductMap.keys()]}
        />
      </PageContainer>
    </>
  );
}

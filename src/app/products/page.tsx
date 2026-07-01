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
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [products, categories] = await Promise.all([
    getAllProductsServer(),
    getCategoriesServer(),
  ]);

  return (
    <>
      <AppHeader title="สินค้าทั้งหมด" />
      <PageContainer className="pt-4 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <ProductsClient
          products={products}
          categories={categories}
          initialCategory={category ?? "all"}
        />
      </PageContainer>
    </>
  );
}

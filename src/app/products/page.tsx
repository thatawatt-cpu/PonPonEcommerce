"use client";

import { use, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ProductSearch } from "@/components/product/product-search";
import { CategoryFilter } from "@/components/product/category-filter";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAllProducts,
  getCategories,
} from "@/features/products/product-service";
import { filterProducts } from "@/features/products/product-utils";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = use(searchParams);
  const categories = getCategories();
  const allProducts = useMemo(() => getAllProducts(), []);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category ?? "all");

  const results = useMemo(
    () => filterProducts(allProducts, query, selectedCategory),
    [allProducts, query, selectedCategory]
  );

  return (
    <>
      <AppHeader title="สินค้าทั้งหมด" />
      <PageContainer className="pt-4">
        <div className="space-y-3">
          <ProductSearch value={query} onChange={setQuery} />
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <p className="mt-4 mb-3 text-sm text-ink-soft">
          พบ {results.length} รายการ
        </p>

        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <EmptyState
            emoji="🔍"
            title="ไม่พบสินค้า"
            description="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะคะ"
          />
        )}
      </PageContainer>
    </>
  );
}

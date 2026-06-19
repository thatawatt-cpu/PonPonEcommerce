"use client";

import { useMemo, useState } from "react";
import { ProductSearch } from "@/components/product/product-search";
import { CategoryFilter } from "@/components/product/category-filter";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { filterProducts } from "@/features/products/product-utils";
import type { Product } from "@/types/product";
import type { Category } from "@/types/common";

const PAGE_SIZE = 24;

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}

export function ProductsClient({
  products,
  categories,
  initialCategory = "all",
}: ProductsClientProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);

  const results = useMemo(
    () => filterProducts(products, query, selectedCategory),
    [products, query, selectedCategory]
  );

  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleCategoryChange = (c: string) => {
    setSelectedCategory(c);
    setPage(1);
  };

  const visibleResults = results.slice(0, page * PAGE_SIZE);
  const hasMore = visibleResults.length < results.length;

  return (
    <div>
      <div className="space-y-3">
        <ProductSearch value={query} onChange={handleQueryChange} />
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={handleCategoryChange}
        />
      </div>

      <p className="mt-4 mb-3 text-sm text-ink-soft">
        พบ {results.length} รายการ
      </p>

      {results.length > 0 ? (
        <>
          <ProductGrid products={visibleResults} />
          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="mt-6 w-full rounded-full border border-brand/20 bg-white py-3 text-sm font-bold text-brand shadow-sm transition active:scale-[0.97]"
            >
              โหลดเพิ่ม ({results.length - visibleResults.length} รายการ)
            </button>
          )}
        </>
      ) : (
        <EmptyState
          emoji="🔍"
          title="ไม่พบสินค้า"
          description="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะคะ"
        />
      )}
    </div>
  );
}

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
const FLASH_SALE_CATEGORY_ID = "flash-sale";

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  selectedCouponCode?: string;
  flashSaleProductIds?: string[];
}

export function ProductsClient({
  products,
  categories,
  initialCategory = "all",
  selectedCouponCode,
  flashSaleProductIds = [],
}: ProductsClientProps) {
  const [query, setQuery] = useState("");
  const hasFlashSaleFilter = flashSaleProductIds.length > 0;
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory === FLASH_SALE_CATEGORY_ID && hasFlashSaleFilter
      ? FLASH_SALE_CATEGORY_ID
      : initialCategory
  );
  const [page, setPage] = useState(1);
  const filterCategories = useMemo(
    () =>
      hasFlashSaleFilter
        ? [
            ...categories.slice(0, 1),
            { id: FLASH_SALE_CATEGORY_ID, name: "Flash Sale", emoji: "⚡" },
            ...categories.slice(1),
          ]
        : categories,
    [categories, hasFlashSaleFilter]
  );
  const flashSaleProductIdSet = useMemo(
    () => new Set(flashSaleProductIds),
    [flashSaleProductIds]
  );

  const results = useMemo(() => {
    const nextProducts =
      selectedCategory === FLASH_SALE_CATEGORY_ID
        ? products.filter((product) => flashSaleProductIdSet.has(product.id))
        : products;

    return filterProducts(
      nextProducts,
      query,
      selectedCategory === FLASH_SALE_CATEGORY_ID ? "all" : selectedCategory
    );
  }, [flashSaleProductIdSet, products, query, selectedCategory]);

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
      <div className="home-panel-shadow space-y-3 rounded-card bg-white p-3 md:p-4">
        <ProductSearch value={query} onChange={handleQueryChange} />
        <CategoryFilter
          categories={filterCategories}
          selected={selectedCategory}
          onSelect={handleCategoryChange}
        />
      </div>

      <p className="mt-4 mb-3 text-sm text-ink-soft">
        พบ {results.length} รายการ
      </p>

      {selectedCouponCode ? (
        <div className="mb-3 rounded-card bg-brand-soft px-3 py-2 text-xs font-bold text-brand ring-1 ring-brand/10">
          เลือกสินค้าเพื่อใช้คูปอง {selectedCouponCode.toUpperCase()}
        </div>
      ) : null}

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

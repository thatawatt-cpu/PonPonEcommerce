"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/product/product-image";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  /** Used to stagger the entrance animation in a grid. */
  index?: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Card
      className="group flex h-full animate-fade-up flex-col overflow-hidden transition active:scale-[0.98] motion-reduce:active:scale-100"
      style={{ animationDelay: `${Math.min(index, 9) * 55}ms` }}
    >
      <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden">
          <ProductImage
            emoji={product.emoji}
            className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
          />
          {product.badges.length > 0 && (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {product.badges.slice(0, 2).map((b) => (
                <Badge key={b} label={b} />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">
            {product.name}
          </h3>
          <div className="mt-auto pt-2">
            <Price value={product.price} compareAt={product.compareAtPrice} />
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "flex w-full items-center justify-center gap-1 rounded-full py-2 text-xs font-semibold text-white transition active:scale-95 motion-reduce:active:scale-100",
            added ? "bg-success" : "bg-brand hover:bg-brand-dark"
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              เพิ่มแล้ว
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              เพิ่มลงตะกร้า
            </>
          )}
        </button>
      </div>
    </Card>
  );
}

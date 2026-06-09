"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { getProductById } from "@/features/products/product-service";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  if (!product) notFound();

  const handleAdd = () => {
    addItem({ product, quantity, selectedOptions: selected });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem({ product, quantity, selectedOptions: selected });
    router.push("/checkout");
  };

  return (
    <>
      <AppHeader showBack />
      <div className="pb-44">
        <div className="mx-auto max-w-md md:grid md:max-w-3xl md:grid-cols-2 md:items-start md:gap-8 md:px-6 md:pt-6">
          <ProductImage
            emoji={product.emoji}
            size="lg"
            className="aspect-square w-full md:sticky md:top-20 md:overflow-hidden md:rounded-card md:shadow-sm"
          />

          <div className="px-4 md:px-0">
            <div className="mt-4 md:mt-0">
            {product.badges.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {product.badges.map((b) => (
                  <Badge key={b} label={b} />
                ))}
              </div>
            )}
            <h1 className="text-xl font-bold text-ink">{product.name}</h1>
            <p className="mt-1 text-xs text-ink-soft">
              หมวดหมู่: {product.categoryName} · คงเหลือ {product.stock} ชิ้น
            </p>
            <div className="mt-3">
              <Price
                value={product.price}
                compareAt={product.compareAtPrice}
                size="lg"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-black/5 pt-4">
            <h2 className="mb-1.5 text-sm font-bold text-ink">รายละเอียดสินค้า</h2>
            <p className="text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>
          </div>

          {/* Options */}
          {product.options?.map((option) => (
            <div key={option.name} className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-ink">{option.label}</h3>
              <div className="flex flex-wrap gap-2">
                {option.choices.map((choice) => {
                  const active = selected[option.name] === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() =>
                        setSelected((prev) => ({
                          ...prev,
                          [option.name]: choice.value,
                        }))
                      }
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand text-white"
                          : "bg-white text-ink ring-1 ring-black/10"
                      )}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-ink">จำนวน</span>
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={product.stock}
            />
          </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom action */}
      <div className="fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-black/5 bg-white/95 px-4 pb-4 pt-3 backdrop-blur md:max-w-3xl md:px-6">
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleAdd}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" /> เพิ่มแล้ว
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" /> เพิ่มลงตะกร้า
              </>
            )}
          </Button>
          <Button size="lg" className="flex-1" onClick={handleBuyNow}>
            ซื้อทันที
          </Button>
        </div>
      </div>
    </>
  );
}

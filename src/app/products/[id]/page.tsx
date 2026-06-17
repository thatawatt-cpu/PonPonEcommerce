"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Check,
  X,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Star,
  TicketPercent,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import {
  getProductById,
} from "@/features/products/product-service";
import { useCartStore } from "@/store/cart-store";
import {
  useFavoriteStore,
  useFavoritesHydrated,
} from "@/store/favorite-store";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

type ReviewMedia =
  | { type: "image"; imageUrl: string }
  | { type: "video"; imageUrl: string; videoUrl: string };

type ReviewFilter = "all" | "media" | "5" | "4" | "3" | "2" | "1" | "latest";

const productCoupons = [
  {
    id: "ponpon50",
    value: "฿50",
    title: "ลดทันที",
    detail: "เมื่อช้อปครบ ฿499",
    code: "PONPON50",
  },
  {
    id: "freeship",
    value: "FREE",
    title: "ส่งฟรี",
    detail: "เมื่อช้อปครบ ฿399",
    code: "FREESHIP",
  },
  {
    id: "friend50",
    value: "฿50",
    title: "เพื่อนใหม่",
    detail: "เมื่อช้อปครบ ฿299",
    code: "PONFRIEND50",
  },
];

function getPreferredVariant(
  product: Product,
  requiredOptions: Record<string, string> = {}
) {
  return product.variants
    ?.filter(
      (variant) =>
        variant.stock > 0 &&
        Object.entries(requiredOptions).every(
          ([name, value]) => variant.options[name] === value
        )
    )
    .sort((left, right) => {
      for (const option of product.options ?? []) {
        const leftIndex = option.choices.findIndex(
          (choice) => choice.value === left.options[option.name]
        );
        const rightIndex = option.choices.findIndex(
          (choice) => choice.value === right.options[option.name]
        );
        const difference = leftIndex - rightIndex;

        if (difference !== 0) return difference;
      }

      return 0;
    })[0];
}

function getDefaultSelectedOptions(
  product: Product | undefined
): Record<string, string> {
  if (!product?.options?.length) return {};

  const defaultVariant = getPreferredVariant(product);

  if (product.variants?.length && !defaultVariant) return {};
  if (!product.variants?.length && product.stock <= 0) return {};

  return Object.fromEntries(
    product.options.map((option) => [
      option.name,
      defaultVariant?.options[option.name] ?? option.choices[0]?.value ?? "",
    ])
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const favoritesHydrated = useFavoritesHydrated();
  const favoriteProductIds = useFavoriteStore((s) => s.productIds);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const isFavorite =
    favoritesHydrated && favoriteProductIds.includes(id);

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    getDefaultSelectedOptions(product)
  );
  const [added, setAdded] = useState(false);
  const [activeGallery, setActiveGallery] = useState("main");
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [claimedProductCoupons, setClaimedProductCoupons] = useState<string[]>(
    []
  );
  const [activeReviewMedia, setActiveReviewMedia] =
    useState<ReviewMedia | null>(null);

  if (!product) notFound();

  const detailContent =
    product.detailContent ??
    (product.categoryId === "fashion"
      ? {
          highlights: [
            "ผ้าคอตตอนนุ่ม ใส่สบาย",
            "ทรงใส่ง่าย เหมาะกับทุกวัน",
            "ซักมือหรือซักเครื่องโหมดถนอมผ้า",
          ],
          infoCards: [
            { label: "เหมาะสำหรับ", value: "ใส่ทุกวันหรือแมตช์เป็นของขวัญ" },
            { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
          ],
          sizeGuide: {
            title: "ตารางไซซ์แนะนำ",
            headers: ["ไซซ์", "อก", "ยาว", "ไหล่"],
            rows: [
              ["S", "36-38", "25", "17"],
              ["M", "38-40", "26", "18"],
              ["L", "40-42", "27", "19"],
              ["XL", "42-44", "28", "20"],
            ],
          },
        }
      : product.categoryId === "drink"
        ? {
            highlights: [
              "ชงสดตามออเดอร์",
              "เลือกระดับความหวานได้",
              "แนะนำดื่มภายในวันที่ได้รับ",
            ],
            infoCards: [
              { label: "เหมาะสำหรับ", value: "ดื่มสดหรือซื้อฝากคนพิเศษ" },
              { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
            ],
          }
        : product.categoryId === "beauty"
          ? {
              highlights: [
                "สีชัด เนื้อบางเบา",
                "พกง่าย ใช้เติมระหว่างวันได้",
                "เก็บให้พ้นแสงแดดโดยตรง",
              ],
              infoCards: [
                { label: "เหมาะสำหรับ", value: "เติมสีสดใสระหว่างวัน" },
                { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
              ],
            }
          : {
              highlights: [
                "แพ็กพร้อมส่ง",
                "เหมาะเป็นของฝาก",
                "เก็บในที่แห้งและเย็น",
              ],
              infoCards: [
                { label: "เหมาะสำหรับ", value: "ซื้อใช้เองหรือเป็นของฝาก" },
                { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
              ],
            });
  const productSpecs = detailContent.highlights;
  const detailInfoCards = detailContent.infoCards ?? [
    { label: "เหมาะสำหรับ", value: "ซื้อใช้เองหรือเป็นของฝาก" },
    { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
  ];
  const detailSections = detailContent.sections ?? [];
  const summaryText = detailContent.summary ?? product.description;
  const galleryItems = [
    {
      key: "main",
      label: "รูปสินค้า",
      imageUrl: product.imageUrl,
      emoji: product.emoji,
      type: "image",
    },
    ...(product.gallery?.map((item) => ({
      key: `admin-${item.id}`,
      label: item.label,
      imageUrl: item.imageUrl,
      emoji: item.emoji ?? product.emoji,
      type: "image",
    })) ?? []),
  ];
  const activeGalleryItem =
    galleryItems.find((item) => item.key === activeGallery) ?? galleryItems[0];
  const selectedPreviewChoice = product.options
    ?.flatMap((option) => option.choices)
    .find(
      (choice) =>
        choice.imageUrl &&
        Object.values(selected).includes(choice.value),
    );
  const variantOptionNames = product.options?.map((option) => option.name) ?? [];
  const missingOptions =
    product.options?.filter((option) => !selected[option.name]) ?? [];
  const hasSelectedAllOptions = missingOptions.length === 0;
  const hasVariantStock = (product.variants?.length ?? 0) > 0;
  const allVariantsSoldOut =
    hasVariantStock &&
    (product.variants?.every((variant) => variant.stock <= 0) ?? false);
  const hasSelectedAllVariantOptions =
    hasVariantStock && variantOptionNames.length > 0 && hasSelectedAllOptions;
  const selectedVariant = hasSelectedAllVariantOptions
    ? product.variants?.find((variant) =>
        variantOptionNames.every(
          (name) => variant.options[name] === selected[name]
        )
      )
    : undefined;
  const effectiveStock = allVariantsSoldOut
    ? 0
    : selectedVariant?.stock ?? product.stock;
  const isSoldOut =
    allVariantsSoldOut || (hasSelectedAllVariantOptions && effectiveStock <= 0);
  const purchaseDisabled = isSoldOut || !hasSelectedAllOptions;
  const quantityStockLabel =
    isSoldOut || effectiveStock <= 0
      ? "สินค้าหมด"
      : hasVariantStock && !hasSelectedAllOptions
        ? "สินค้าพร้อมส่ง"
        : `มีสินค้าทั้งหมด ${effectiveStock.toLocaleString("th-TH")} ชิ้น`;

  const isChoiceSoldOut = (optionName: string, choiceValue: string) => {
    if (allVariantsSoldOut) return true;
    if (!hasVariantStock || !product.variants) return false;

    const optionIndex =
      product.options?.findIndex((option) => option.name === optionName) ?? -1;
    const priorSelections = Object.fromEntries(
      (product.options ?? [])
        .slice(0, Math.max(optionIndex, 0))
        .map((option) => [option.name, selected[option.name]])
        .filter(([, value]) => Boolean(value))
    );

    return !getPreferredVariant(product, {
      ...priorSelections,
      [optionName]: choiceValue,
    });
  };

  const handleChoiceSelect = (optionName: string, choiceValue: string) => {
    setSelected((prev) => {
      if (prev[optionName] === choiceValue) {
        return { ...prev, [optionName]: "" };
      }

      if (!product.variants?.length) {
        return { ...prev, [optionName]: choiceValue };
      }

      const optionIndex =
        product.options?.findIndex((option) => option.name === optionName) ?? -1;
      const priorSelections = Object.fromEntries(
        (product.options ?? [])
          .slice(0, Math.max(optionIndex, 0))
          .map((option) => [option.name, prev[option.name]])
          .filter(([, value]) => Boolean(value))
      );
      const compatibleVariant = getPreferredVariant(product, {
        ...priorSelections,
        [optionName]: choiceValue,
      });

      return compatibleVariant
        ? { ...prev, ...compatibleVariant.options }
        : { ...prev, [optionName]: choiceValue };
    });
  };

  const handleAdd = () => {
    if (purchaseDisabled) return;
    addItem({ product, quantity, selectedOptions: selected });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (purchaseDisabled) return;
    addItem({ product, quantity, selectedOptions: selected });
    router.push("/checkout");
  };

  const reviewFilters: { value: ReviewFilter; label: string }[] = [
    { value: "all", label: "ทั้งหมด" },
    { value: "media", label: "มีรูป/วิดีโอ" },
    { value: "5", label: "5 ดาว" },
    { value: "4", label: "4 ดาว" },
    { value: "3", label: "3 ดาว" },
    { value: "2", label: "2 ดาว" },
    { value: "1", label: "1 ดาว" },
    { value: "latest", label: "ล่าสุด" },
  ];
  const reviews: {
    name: string;
    rating: number;
    text: string;
    tag: string;
    date: string;
    media: ReviewMedia[];
  }[] = [
    {
      name: "Mint",
      rating: 5,
      text: "แพ็กสินค้าดีมาก ส่งไว ของตรงปก เหมาะซื้อเป็นของฝากสุด ๆ",
      tag: "ซื้อซ้ำแล้ว",
      date: "วันนี้ 14:32",
      media: [
        { type: "image", imageUrl: product.imageUrl },
        {
          type: "video",
          imageUrl: "/images/products/cookies.png",
          videoUrl: "/videos/review-sample.mp4",
        },
      ],
    },
    {
      name: "Ploy",
      rating: 4,
      text: "กล่องน่ารัก รสชาติดี ราคาโอเค กดสั่งง่ายมาก",
      tag: "มีรูปสินค้า",
      date: "เมื่อวาน 19:08",
      media: [{ type: "image", imageUrl: "/images/products/milk-tea.png" }],
    },
    {
      name: "Bank",
      rating: 3,
      text: "ส่งถึงไวกว่าเดิม แพ็กมาดี ไม่มีเสียหาย",
      tag: "รีวิวจากผู้ซื้อจริง",
      date: "10 มิ.ย. 2569 09:41",
      media: [],
    },
    {
      name: "Ning",
      rating: 2,
      text: "รสชาติดี แต่รอบนี้ขนส่งช้ากว่าปกตินิดหน่อย",
      tag: "รอจัดส่งนาน",
      date: "8 มิ.ย. 2569 16:20",
      media: [{ type: "image", imageUrl: "/images/products/teddy.png" }],
    },
    {
      name: "Art",
      rating: 1,
      text: "กล่องมีบุบเล็กน้อย อยากให้แพ็กหนากว่านี้",
      tag: "แจ้งร้านแล้ว",
      date: "5 มิ.ย. 2569 11:05",
      media: [],
    },
  ];
  const filteredReviews =
    reviewFilter === "all" || reviewFilter === "latest"
      ? reviews
      : reviewFilter === "media"
        ? reviews.filter((review) => review.media.length > 0)
        : reviews.filter((review) => review.rating === Number(reviewFilter));

  return (
    <>
      <AppHeader showBack />
      <div className="pb-60">
        <div className="mx-auto max-w-md md:grid md:max-w-3xl md:grid-cols-2 md:items-start md:gap-8 md:px-6 md:pt-6">
          <div className="md:sticky md:top-20 md:space-y-3">
            <div className="relative overflow-hidden bg-white md:rounded-card md:shadow-sm md:ring-1 md:ring-black/[0.04]">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={
                  isFavorite
                    ? `นำ ${product.name} ออกจากรายการโปรด`
                    : `เพิ่ม ${product.name} ในรายการโปรด`
                }
                aria-pressed={isFavorite}
                className={cn(
                  "absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-[0_8px_22px_rgba(65,25,25,0.16)] ring-1 transition duration-200 active:scale-90 motion-reduce:active:scale-100 md:right-5 md:top-5",
                  isFavorite
                    ? "bg-brand text-white ring-brand/20 hover:bg-brand-dark"
                    : "bg-white/95 text-brand ring-brand/15 backdrop-blur hover:bg-brand hover:text-white",
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isFavorite && "scale-110 fill-current",
                  )}
                  strokeWidth={2.3}
                />
              </button>
              {activeGalleryItem.type === "detail" ? (
                <div className="flex aspect-square w-full flex-col justify-center bg-[#fff8f6] p-7">
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
                    PonPon Detail
                  </p>
                  <h2 className="text-2xl font-extrabold leading-tight text-ink">
                    รายละเอียดสินค้า
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {summaryText}
                  </p>
                  <div className="mt-5 space-y-2">
                    {productSpecs.map((spec) => (
                      <div
                        key={spec}
                        className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm"
                      >
                        <Check className="h-4 w-4 text-brand" />
                        {spec}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ProductImage
                  imageUrl={
                    activeGallery === "main"
                      ? selectedPreviewChoice?.imageUrl ??
                        activeGalleryItem.imageUrl
                      : activeGalleryItem.imageUrl
                  }
                  emoji={activeGalleryItem.emoji}
                  size="lg"
                  fit="contain"
                  priority={activeGallery === "main"}
                  className="aspect-square w-full"
                />
              )}
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 md:px-0 md:py-0">
              {galleryItems.map((item) => {
                const isActive = activeGallery === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveGallery(item.key)}
                    className={cn(
                      "relative h-18 w-18 shrink-0 overflow-hidden rounded-2xl border-2 border-transparent bg-white p-1 shadow-sm ring-1 ring-black/[0.05] transition",
                      isActive && "border-brand ring-0"
                    )}
                    aria-label={`ดู${item.label}`}
                  >
                    {item.type === "detail" ? (
                      <span className="flex h-full w-full items-center justify-center rounded-xl bg-brand-soft text-[10px] font-extrabold text-brand">
                        Detail
                      </span>
                    ) : (
                      <ProductImage
                        imageUrl={item.imageUrl}
                        emoji={item.emoji}
                        size="sm"
                        className="h-full w-full rounded-xl"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <section className="hidden rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-black/[0.04] md:block">
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-2xl bg-brand-soft/80 px-2 py-2.5 text-center">
                  <ShieldCheck className="mx-auto h-4 w-4 text-brand" />
                  <p className="mt-1 text-[10px] font-bold text-ink-soft">
                    Official
                  </p>
                </div>
                {[
                  { label: "ส่งไว", icon: Truck },
                  { label: "แพ็กดี", icon: PackageCheck },
                  { label: "4.9 รีวิว", icon: Star },
                ].map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-surface-muted/70 px-2 py-2.5 text-center"
                  >
                    <Icon
                      className={cn(
                        "mx-auto h-4 w-4 text-brand",
                        label.includes("4.9") && "fill-amber-400 text-amber-500"
                      )}
                    />
                    <p className="mt-1 text-[10px] font-bold text-ink-soft">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] md:block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-ink">
                    รีวิวล่าสุด
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    “แพ็กสินค้าดีมาก ส่งไว ของตรงปก เหมาะซื้อเป็นของฝากสุด ๆ”
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  4.9
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReviewsOpen(true)}
                className="mt-3 text-xs font-extrabold text-brand"
              >
                ดูรีวิวทั้งหมด
              </button>
            </section>

            <section className="rounded-3xl bg-brand-soft/70 p-4 ring-1 ring-brand/10 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-ink">
                    คูปองพร้อมใช้
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-ink-soft">
                    เก็บก่อนซื้อ ลดเพิ่มเมื่อครบยอด
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-brand shadow-sm">
                  เก็บเลย
                </span>
              </div>
            </section>
          </div>

          <div className="px-4 md:px-0">
            <div className="mt-4 md:mt-0">
            {product.badges.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {product.badges.map((b) => (
                  <Badge key={b} label={b} />
                ))}
                {allVariantsSoldOut && (
                  <span className="rounded-full bg-black/10 px-2.5 py-1 text-[10px] font-extrabold text-ink-soft">
                    สินค้าหมด
                  </span>
                )}
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
            <h2 className="mb-1.5 text-sm font-bold text-ink">สรุปสินค้า</h2>
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {summaryText}
            </p>
          </div>

          {/* Options */}
          {product.options?.map((option) => (
            <div key={option.name} className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-ink">{option.label}</h3>
              <div className="flex flex-wrap gap-2">
                {option.choices.map((choice) => {
                  const active = selected[option.name] === choice.value;
                  const soldOut = isChoiceSoldOut(option.name, choice.value);
                  const hasPreview = Boolean(
                    choice.imageUrl || choice.swatchColor,
                  );
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      disabled={soldOut}
                      onClick={() =>
                        handleChoiceSelect(option.name, choice.value)
                      }
                      className={cn(
                        "relative text-sm font-medium transition disabled:cursor-not-allowed",
                        hasPreview
                          ? "flex min-h-14 min-w-28 items-center gap-2 rounded-xl px-2.5 py-2 text-left"
                          : "flex h-12 min-w-14 items-center justify-center rounded-full border px-4 py-2",
                        soldOut
                          ? active
                            ? hasPreview
                              ? "bg-brand-soft/60 text-brand/60 ring-2 ring-brand/45"
                              : "border-brand/45 bg-brand-soft/60 text-brand/60"
                            : hasPreview
                              ? "bg-surface-muted text-ink-soft/45 ring-1 ring-black/5"
                              : "border-black/5 bg-surface-muted text-ink-soft/45"
                          : active
                            ? hasPreview
                              ? "bg-brand-soft text-brand ring-2 ring-brand shadow-[0_5px_14px_rgba(190,9,14,0.12)]"
                              : "border-brand bg-brand text-white shadow-[0_5px_14px_rgba(190,9,14,0.18)]"
                            : hasPreview
                              ? "bg-white text-ink ring-1 ring-black/10 hover:bg-brand-soft hover:text-brand hover:ring-brand/25"
                              : "border-black/10 bg-white text-ink hover:border-brand/25 hover:bg-brand-soft hover:text-brand"
                      )}
                    >
                      {hasPreview && (
                        <span
                          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-black/[0.06]"
                          style={{
                            backgroundColor:
                              choice.swatchColor ?? "var(--color-brand-soft)",
                          }}
                        >
                          {choice.imageUrl ? (
                            <ProductImage
                              imageUrl={choice.imageUrl}
                              emoji={product.emoji}
                              size="sm"
                              fit="contain"
                              className="h-full w-full bg-transparent"
                            />
                          ) : null}
                          {soldOut && (
                            <span className="absolute inset-0 bg-white/55" />
                          )}
                        </span>
                      )}
                      <span>
                        {choice.label}
                        {soldOut && (
                          <span className="block text-[10px] font-extrabold text-brand/70">
                            หมด
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {missingOptions.length > 0 && !allVariantsSoldOut && (
            <p className="mt-3 rounded-2xl border border-brand/15 bg-brand-soft/70 px-3 py-2 text-xs font-extrabold text-brand">
              กรุณาเลือก{missingOptions.map((option) => option.label).join(" และ ")}
            </p>
          )}

          {hasVariantStock && (
            <p className="mt-3 rounded-2xl bg-[#fff8f6] px-3 py-2 text-xs font-bold text-ink-soft">
              {allVariantsSoldOut
                ? "สินค้านี้หมดทุกแบบแล้ว"
                : selectedVariant
                ? selectedVariant.stock > 0
                  ? `ชุดนี้เหลือ ${selectedVariant.stock} ชิ้น`
                  : "ชุดตัวเลือกนี้หมดแล้ว"
                : "เลือกตัวเลือกให้ครบเพื่อเช็กสต็อกของชุดสินค้า"}
            </p>
          )}

          {/* Quantity */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-ink">จำนวน</span>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={Math.max(effectiveStock, 1)}
              />
              <span className="text-sm font-semibold text-ink-soft">
                {quantityStockLabel}
              </span>
            </div>
          </div>

          <section className="mt-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                <TicketPercent className="h-[18px] w-[18px] text-brand" />
                คูปองสำหรับคุณ
              </h2>
              <span className="shrink-0 text-[10px] font-bold text-ink-soft">
                เก็บไว้ใช้ตอนชำระเงิน
              </span>
            </div>

            <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {productCoupons.map((coupon) => {
                const isClaimed = claimedProductCoupons.includes(coupon.id);

                return (
                  <article
                    key={coupon.id}
                    className="relative flex min-h-[4.5rem] min-w-[17.5rem] overflow-hidden rounded-[1.15rem] bg-white shadow-[0_8px_22px_rgba(190,9,14,0.10)] ring-1 ring-brand/15"
                  >
                    <div className="flex w-[5.75rem] shrink-0 flex-col items-center justify-center bg-brand px-2 py-3 text-center text-white">
                      <span className="text-xl font-extrabold leading-none">
                        {coupon.value}
                      </span>
                      <span className="mt-1 text-[10px] font-extrabold leading-none text-white">
                        {coupon.title}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-ink">
                          {coupon.detail}
                        </p>
                        <p className="mt-1 text-[10px] font-extrabold tracking-wide text-ink-soft">
                          CODE: {coupon.code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setClaimedProductCoupons((current) =>
                            current.includes(coupon.id)
                              ? current
                              : [...current, coupon.id]
                          )
                        }
                        disabled={isClaimed}
                        className={cn(
                          "brand-button flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-[0_7px_16px_rgba(237,23,28,0.32)] transition active:scale-95 disabled:shadow-none",
                          isClaimed
                            ? "bg-[#d9fbe7] text-[#12a85a]"
                            : "bg-brand"
                        )}
                        aria-label={
                          isClaimed ? "เก็บคูปองแล้ว" : "เก็บคูปอง"
                        }
                      >
                        {isClaimed ? <Check className="h-4 w-4" /> : "เก็บ"}
                      </button>
                    </div>

                    <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-muted" />
                    <span className="absolute bottom-0 left-[5.75rem] top-0 border-l border-dashed border-white/50" />
                  </article>
                );
              })}
              <Link
                href="/coupons"
                className="flex min-h-[4.5rem] min-w-[8rem] shrink-0 flex-col items-center justify-center rounded-[1.15rem] border border-dashed border-brand/30 bg-white px-3 text-center text-brand shadow-[0_8px_22px_rgba(190,9,14,0.08)] transition active:scale-95"
              >
                <TicketPercent className="h-5 w-5" />
                <span className="mt-1 text-xs font-extrabold leading-tight">
                  ดูคูปองทั้งหมด
                </span>
              </Link>
            </div>
          </section>

          <section className="mt-3 rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-black/[0.04] md:hidden">
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-2xl bg-brand-soft/80 px-2 py-2.5 text-center">
                <ShieldCheck className="mx-auto h-4 w-4 text-brand" />
                <p className="mt-1 text-[10px] font-bold text-ink-soft">
                  Official
                </p>
              </div>
              {[
                { label: "ส่งไว", icon: Truck },
                { label: "แพ็กดี", icon: PackageCheck },
                { label: "4.9 รีวิว", icon: Star },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-surface-muted/70 px-2 py-2.5 text-center"
                >
                  <Icon
                    className={cn(
                      "mx-auto h-4 w-4 text-brand",
                      label.includes("4.9") && "fill-amber-400 text-amber-500"
                    )}
                  />
                  <p className="mt-1 text-[10px] font-bold text-ink-soft">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReviewsOpen(true)}
              className="mt-2 w-full rounded-2xl bg-[#fff8f6] px-3 py-3 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-ink">
                    รีวิวล่าสุด
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-ink-soft">
                    วันนี้ 14:32
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                    “แพ็กสินค้าดีมาก ส่งไว ของตรงปก เหมาะซื้อเป็นของฝากสุด ๆ”
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-extrabold text-amber-500 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  5.0
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setReviewsOpen(true)}
              className="mt-2 w-full rounded-2xl bg-brand-soft px-3 py-2 text-xs font-extrabold text-brand"
            >
              ดูรีวิวทั้งหมด
            </button>
          </section>
          </div>
        </div>

        <section className="mx-auto mt-5 max-w-md px-4 md:max-w-3xl md:px-6">
          <div className="overflow-hidden rounded-card bg-white shadow-[0_10px_28px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]">
            <div className="bg-surface-muted/75 px-4 py-4">
              <h2 className="text-lg font-extrabold text-ink">
                {detailContent.title ?? "รายละเอียดสินค้า"}
              </h2>
            </div>

            <div className="space-y-5 p-4">
              <p className="text-sm leading-7 text-ink-soft">
                {summaryText}
              </p>

              <div className="grid gap-2 md:grid-cols-3">
                {productSpecs.map((spec) => (
                  <div
                    key={spec}
                    className="rounded-2xl bg-[#fff8f6] px-3 py-3 text-sm font-bold text-ink"
                  >
                    <Check className="mb-2 h-4 w-4 text-brand" />
                    {spec}
                  </div>
                ))}
              </div>

              {detailContent.sizeGuide ? (
                <div className="overflow-hidden rounded-3xl ring-1 ring-black/[0.06]">
                  <div className="bg-brand px-4 py-3 text-sm font-extrabold text-white">
                    {detailContent.sizeGuide.title}
                  </div>
                  <div
                    className="grid bg-white text-center text-xs"
                    style={{
                      gridTemplateColumns: `repeat(${detailContent.sizeGuide.headers.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {detailContent.sizeGuide.headers.map((head) => (
                      <div
                        key={head}
                        className="bg-brand-soft px-2 py-2 font-extrabold text-brand"
                      >
                        {head}
                      </div>
                    ))}
                    {detailContent.sizeGuide.rows.flatMap((row) =>
                      row.map((cell, index) => (
                        <div
                          key={`${row[0]}-${index}`}
                          className="border-t border-black/[0.05] px-2 py-2 font-semibold text-ink-soft"
                        >
                          {cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 rounded-3xl bg-[#fff8f6] p-3 md:grid-cols-2">
                  {detailInfoCards.map((card) => (
                    <div key={card.label} className="rounded-2xl bg-white px-3 py-3">
                      <p className="text-xs font-bold text-ink-soft">
                        {card.label}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-ink">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {detailSections.length > 0 && (
                <div className="space-y-3 border-t border-black/[0.05] pt-4">
                  {detailSections.map((section) => (
                    <section
                      key={section.title}
                      className="rounded-3xl bg-surface-muted/60 p-4"
                    >
                      <h3 className="text-sm font-extrabold text-ink">
                        {section.title}
                      </h3>
                      {section.body && (
                        <p className="mt-2 text-sm leading-7 text-ink-soft">
                          {section.body}
                        </p>
                      )}
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {section.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex gap-2 text-sm font-semibold text-ink-soft"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sticky bottom action */}
      <div className="promo-action-bar fixed inset-x-3 bottom-above-nav z-30 mx-auto max-w-[calc(28rem-1.5rem)] border border-brand/10 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-xl md:max-w-[calc(48rem-3rem)] md:px-6">
        {!hasSelectedAllOptions && !allVariantsSoldOut && (
          <p className="mb-2 text-center text-xs font-extrabold text-brand">
            กรุณาเลือก{missingOptions.map((option) => option.label).join(" และ ")}ก่อน
          </p>
        )}
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={purchaseDisabled}
          >
            {added ? (
              <>
                <Check className="h-5 w-5" /> เพิ่มแล้ว
              </>
            ) : allVariantsSoldOut ? (
              <>สินค้าหมด</>
            ) : !hasSelectedAllOptions ? (
              <>เลือกตัวเลือกก่อน</>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" /> เพิ่มลงตะกร้า
              </>
            )}
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleBuyNow}
            disabled={purchaseDisabled}
          >
            {allVariantsSoldOut
              ? "แจ้งเตือนเมื่อมีสินค้า"
              : hasSelectedAllOptions
                ? "ซื้อทันที"
                : "เลือกตัวเลือกก่อน"}
          </Button>
        </div>
      </div>

      {reviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="mx-auto flex max-h-[78dvh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:max-h-[82vh] md:max-w-xl">
            <div className="shrink-0 flex items-center justify-between border-b border-black/[0.05] px-4 py-3">
              <div>
                <h2 className="text-lg font-extrabold text-ink">
                  รีวิวทั้งหมด
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  จากลูกค้าที่สั่งซื้อสินค้า PonPon
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewsOpen(false)}
                aria-label="ปิดรีวิวทั้งหมด"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
              <div className="mb-4 rounded-3xl bg-brand p-4 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white/75">
                      คะแนนรวม
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Star className="h-6 w-6 fill-amber-300 text-amber-300" />
                      <span className="text-3xl font-extrabold">4.9</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white/85">128 รีวิว</p>
                </div>
              </div>

              <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
                {reviewFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setReviewFilter(filter.value)}
                    aria-pressed={reviewFilter === filter.value}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition active:scale-95",
                      reviewFilter === filter.value
                        ? "bg-brand text-white"
                        : "bg-surface-muted text-ink-soft hover:bg-brand-soft hover:text-brand"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredReviews.map((review) => (
                  <article
                    key={review.name}
                    className="rounded-3xl bg-[#fff8f6] p-3.5 ring-1 ring-black/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-extrabold text-brand shadow-sm">
                          {review.name.charAt(0)}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold text-ink">
                            {review.name}
                          </p>
                          <p className="text-[10px] font-bold text-ink-soft">
                            {review.tag}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink-soft/80">
                            {review.date}
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        {review.rating}.0
                      </span>
                    </div>
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            "h-3.5 w-3.5",
                            index < review.rating
                              ? "fill-amber-400 text-amber-500"
                              : "fill-surface-muted text-surface-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      “{review.text}”
                    </p>
                    {review.media.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {review.media.map((media, index) => (
                          <button
                            key={`${review.name}-${media.type}-${index}`}
                            type="button"
                            onClick={() => setActiveReviewMedia(media as ReviewMedia)}
                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"
                            aria-label={
                              media.type === "video"
                                ? "เปิดวิดีโอรีวิว"
                                : "เปิดรูปรีวิว"
                            }
                          >
                            {media.type === "video" &&
                            "videoUrl" in media &&
                            media.videoUrl ? (
                              <video
                                src={media.videoUrl}
                                poster={media.imageUrl}
                                preload="metadata"
                                muted
                                playsInline
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            ) : (
                              <ProductImage
                                imageUrl={media.imageUrl}
                                emoji={product.emoji}
                                size="sm"
                                className="h-full w-full rounded-2xl"
                              />
                            )}
                            {media.type === "video" && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 pl-0.5 text-xs font-extrabold text-brand shadow-sm">
                                  ▶
                                </span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {filteredReviews.length === 0 && (
                  <div className="rounded-3xl bg-surface-muted px-4 py-10 text-center">
                    <Star className="mx-auto h-7 w-7 text-ink-soft/35" />
                    <p className="mt-2 text-sm font-extrabold text-ink">
                      ยังไม่มีรีวิวในหมวดนี้
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReviewMedia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="flex min-h-[62dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.32)] md:min-h-[70vh]">
            <div className="shrink-0 flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  {activeReviewMedia.type === "video"
                    ? "วิดีโอรีวิว"
                    : "รูปรีวิว"}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  จากลูกค้าที่ซื้อสินค้านี้
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewMedia(null)}
                aria-label="ปิดสื่อรีวิว"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
              {activeReviewMedia.type === "video" ? (
                <video
                  src={activeReviewMedia.videoUrl}
                  poster={activeReviewMedia.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full max-h-[72dvh] w-full bg-black object-contain"
                />
              ) : (
                <ProductImage
                  imageUrl={activeReviewMedia.imageUrl}
                  emoji={product.emoji}
                  size="lg"
                  fit="contain"
                  className="h-full min-h-[48dvh] w-full bg-white md:min-h-[56vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

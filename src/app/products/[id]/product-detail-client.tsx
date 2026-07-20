"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Heart,
  Loader2,
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
import { ProductCard } from "@/components/product/product-card";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { useCartStore } from "@/store/cart-store";
import {
  createBuyNowCartItem,
  storeBuyNowCheckout,
} from "@/features/checkout/buy-now-checkout";
import {
  useFavoriteStore,
  useFavoritesHydrated,
} from "@/store/favorite-store";
import {
  claimCoupon,
  fetchAvailableCoupons,
  getCachedAvailableCoupons,
} from "@/features/coupons/coupon-api";
import {
  fetchProductReviews,
  fetchProductReviewSummary,
} from "@/features/reviews/review-api";
import {
  mapApiProductDetailToProduct,
  mapApiShopProductToProduct,
} from "@/features/products/product-mapper";
import {
  addWishlistProduct,
  fetchWishlist,
  recordRecentlyViewed,
  removeWishlistProduct,
} from "@/features/customers/customer-engagement-api";
import { consumeProductDetailScrollTop } from "@/features/products/product-detail-navigation";
import { storePendingCouponCode } from "@/features/coupons/pending-coupon";
import { cn } from "@/lib/utils";
import type { ApiCouponListItem, ApiShopProductDetailResponse } from "@/types/api";
import type { Product, ProductVariantStock } from "@/types/product";
import type {
  ProductReview,
  ProductReviewMedia,
  ProductReviewSummary,
} from "@/types/review";

type ReviewMedia =
  | { type: "image"; imageUrl: string }
  | { type: "video"; thumbnailUrl?: string | null; videoUrl: string };

type ReviewFilter = "all" | "media" | "5" | "4" | "3" | "2" | "1" | "latest";
type DetailTab = "detail" | "shipping" | "review";

const ANONYMOUS_REVIEW_AVATAR_URL =
  "/images/review-anonymous.png";
const DEFAULT_REVIEW_AVATAR_URL = "/images/review-default.png";
const DEFERRED_DETAIL_ROOT_MARGIN = "700px 0px";
const PRODUCT_DETAIL_ENTRY_SCROLL_RETRY_DELAYS_MS = [0, 80, 180, 360];

interface ProductCoupon {
  id: string;
  value: string;
  title: string;
  detail: string;
  minimumLabel: string;
  code: string;
  isClaimed: boolean;
  canClaim: boolean;
  canUse: boolean;
  unavailableReason?: string | null;
  remainingTotalUses?: number | null;
  maximumUsesPerCustomer?: number | null;
  customerUsedCount?: number | null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCouponType(coupon: ApiCouponListItem): string {
  return (coupon.type || coupon.discountType || "").trim().toLowerCase();
}

function getCouponValue(coupon: ApiCouponListItem): string {
  const type = getCouponType(coupon);
  if (type === "free_shipping") return "FREE";

  const amount =
    asNumber(coupon.discountAmount) ??
    asNumber(coupon.discountValue) ??
    asNumber(coupon.value);

  if (amount == null) {
    return typeof coupon.value === "string" ? coupon.value : "คูปอง";
  }
  if (type === "percentage") return `${amount}%`;
  return `฿${amount.toLocaleString("th-TH")}`;
}

function getMinimumAmount(coupon: ApiCouponListItem): number | null {
  return (
    asNumber(coupon.minimumSpend) ??
    asNumber(coupon.minimumSubtotal) ??
    asNumber(coupon.minimumOrderAmount) ??
    asNumber(coupon.minOrderAmount)
  );
}

function getMinimumSpendText(coupon: ApiCouponListItem): string {
  const amount = getMinimumAmount(coupon);
  return amount && amount > 0
    ? `เมื่อช้อปครบ ฿${amount.toLocaleString("th-TH")}`
    : "ใช้ได้ตอนชำระเงิน";
}

function getMinimumLabel(coupon: ApiCouponListItem): string {
  const amount = getMinimumAmount(coupon);
  return amount && amount > 0
    ? `ขั้นต่ำ ${amount.toLocaleString("th-TH")} ฿`
    : "ไม่มีขั้นต่ำ";
}

function addLazyImageAttributes(html: string): string {
  return html
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy"')
    .replace(/<img\b(?![^>]*\bdecoding=)/gi, '<img decoding="async"')
    .replace(/<img\b(?![^>]*\bfetchpriority=)/gi, '<img fetchpriority="low"');
}

function isCouponVisible(coupon: ApiCouponListItem): boolean {
  if (coupon.isActive === false) return false;
  const status = coupon.status?.trim().toLowerCase();
  if (!status) return true;
  return ["active", "available", "published", "live"].includes(status);
}

function mapApiCoupon(coupon: ApiCouponListItem): ProductCoupon | null {
  if (!coupon.code || !isCouponVisible(coupon)) return null;

  const type = getCouponType(coupon);
  return {
    id: coupon.id || coupon.code,
    value: getCouponValue(coupon),
    title:
      coupon.name ||
      coupon.title ||
      (type === "free_shipping" ? "ส่งฟรี" : "ลดทันที"),
    detail: coupon.description || getMinimumSpendText(coupon),
    minimumLabel: getMinimumLabel(coupon),
    code: coupon.code,
    isClaimed: coupon.isClaimed === true,
    canClaim: coupon.canClaim !== false,
    canUse: coupon.canUse !== false,
    unavailableReason: coupon.unavailableReason ?? null,
    remainingTotalUses: asNumber(coupon.remainingTotalUses),
    maximumUsesPerCustomer: asNumber(
      coupon.maximumUsesPerCustomer ?? coupon.maxUsesPerCustomer
    ),
    customerUsedCount: asNumber(
      coupon.customerUsedCount ??
        coupon.customerUsageCount ??
        coupon.usedByCustomer ??
        coupon.usedCountByCustomer
    ),
  };
}

function canShowAvailableCoupon(coupon: ProductCoupon): boolean {
  if (!coupon.canUse) return false;
  if (coupon.remainingTotalUses === 0) return false;
  if (
    coupon.maximumUsesPerCustomer != null &&
    coupon.customerUsedCount != null &&
    coupon.customerUsedCount >= coupon.maximumUsesPerCustomer
  ) {
    return false;
  }

  return coupon.isClaimed || coupon.canClaim;
}

function formatReviewDate(value?: string | null): string {
  if (!value) return "";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getReviewMediaPreview(media: ProductReviewMedia): ReviewMedia | null {
  if (!media.url) return null;

  if (media.type === "video") {
    return {
      type: "video",
      thumbnailUrl: media.thumbnailUrl,
      videoUrl: media.url,
    };
  }

  return {
    type: "image",
    imageUrl: media.thumbnailUrl || media.url,
  };
}

function ReviewMediaThumbnail({
  media,
  product,
  className,
}: {
  media: ReviewMedia;
  product: Product;
  className?: string;
}) {
  if (media.type === "video") {
    if (media.thumbnailUrl) {
      return (
        <ProductImage
          imageUrl={media.thumbnailUrl}
          emoji={product.emoji}
          size="sm"
          className={cn("h-full w-full", className)}
        />
      );
    }

    return (
      <video
        src={media.videoUrl}
        preload="metadata"
        muted
        playsInline
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <ProductImage
      imageUrl={media.imageUrl}
      emoji={product.emoji}
      size="sm"
      className={cn("h-full w-full", className)}
    />
  );
}

function getReviewName(review: ProductReview): string {
  if (review.isAnonymous) return "ผู้ใช้ไม่ระบุตัวตน";

  return (
    review.userName?.trim() ||
    review.customerName?.trim() ||
    "ผู้ใช้ PonPon"
  );
}

function getReviewAvatar(review: ProductReview): string | null {
  return review.isAnonymous
    ? ANONYMOUS_REVIEW_AVATAR_URL
    : review.userAvatar?.trim() || DEFAULT_REVIEW_AVATAR_URL;
}

function ReviewAvatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl: string | null;
  size: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white font-extrabold text-brand shadow-sm",
        dimensions
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes={size === "sm" ? "32px" : "36px"} className="object-cover" />
      ) : (
        name.charAt(0)
      )}
    </span>
  );
}

function getProductCouponParams(
  product: Product,
  variant?: ProductVariantStock
) {
  return {
    salesChannel: "line_liff",
    productId: product.id,
    variantId: variant?.id,
    sku: variant?.sku ?? product.sku,
    zortCategoryId: product.zortCategoryId,
    categoryName: product.categoryName || product.categoryId,
  };
}

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
  product: Product
): Record<string, string> {
  if (!product.options?.length) return {};
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

function getInitialSelectedOptions(
  product: Product,
  initialSelectedOptions?: Record<string, string>
): Record<string, string> {
  const defaults = getDefaultSelectedOptions(product);
  if (!initialSelectedOptions) return defaults;

  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(initialSelectedOptions).filter(([, value]) =>
        Boolean(value)
      )
    ),
  };
}

interface ProductDetailClientProps {
  product: Product;
  initialCoupons?: ApiCouponListItem[];
  relatedProducts?: Product[];
  cartEditItemKey?: string;
  initialQuantity?: number;
  initialSelectedOptions?: Record<string, string>;
}

export function ProductDetailClient({
  product: initialProduct,
  initialCoupons = [],
  relatedProducts: initialRelatedProducts = [],
  cartEditItemKey,
  initialQuantity,
  initialSelectedOptions,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState(initialRelatedProducts);
  const [fullDetailLoaded, setFullDetailLoaded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const favoritesHydrated = useFavoritesHydrated();
  const favoriteProductIds = useFavoriteStore((s) => s.productIds);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const setFavoriteProductIds = useFavoriteStore((s) => s.setFavoriteProductIds);
  const isFavorite =
    favoritesHydrated && favoriteProductIds.includes(product.id);

  const isEditingCartItem = Boolean(cartEditItemKey);
  const [quantity, setQuantity] = useState(() =>
    Number.isFinite(initialQuantity) && initialQuantity && initialQuantity > 0
      ? initialQuantity
      : 1
  );
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    getInitialSelectedOptions(initialProduct, initialSelectedOptions)
  );
  const [added, setAdded] = useState(false);
  const [activeGallery, setActiveGallery] = useState("main");
  const [userPickedGallery, setUserPickedGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const deferredDetailRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const reviewsRequestedRef = useRef(false);
  const [deferredDetailReady, setDeferredDetailReady] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [remoteProductCoupons, setRemoteProductCoupons] = useState<ApiCouponListItem[]>(
    () => initialCoupons
  );
  const [productCouponsLoaded, setProductCouponsLoaded] = useState(
    true
  );
  const [claimingProductCouponIds, setClaimingProductCouponIds] = useState<string[]>([]);
  const [activeReviewMedia, setActiveReviewMedia] = useState<ReviewMedia | null>(null);
  const [remoteReviews, setRemoteReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    averageRating: product.rating ?? 0,
    totalReviews: product.reviewCount ?? 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("detail");
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);
  const apiProductCoupons = remoteProductCoupons
    .map(mapApiCoupon)
    .filter((coupon): coupon is ProductCoupon => Boolean(coupon));
  const visibleProductCoupons = apiProductCoupons.filter(
    canShowAvailableCoupon
  );
  const displayProductCoupons = productCouponsLoaded ? visibleProductCoupons : [];
  const showProductCouponSection =
    !productCouponsLoaded || displayProductCoupons.length > 0;

  const claimProductCoupon = (coupon: ProductCoupon) => {
    if (coupon.isClaimed || !coupon.canClaim) return;

    setClaimingProductCouponIds((current) =>
      current.includes(coupon.id) ? current : [...current, coupon.id]
    );

    claimCoupon(coupon.id)
      .then((claimedCoupon) => {
        if (!claimedCoupon) return;
        setRemoteProductCoupons((current) =>
          current.map((item) =>
            item.id === coupon.id ? claimedCoupon : item
          )
        );
      })
      .finally(() => {
        setClaimingProductCouponIds((current) =>
          current.filter((id) => id !== coupon.id)
        );
      });
  };

  const handleUseProductCoupon = (coupon: ProductCoupon) => {
    if (!coupon.canUse) return;

    storePendingCouponCode(coupon.code);
    router.push(`/products?coupon=${encodeURIComponent(coupon.code)}`);
  };

  const handleFavoriteToggle = () => {
    if (favoriteUpdating) return;

    const wasFavorite = favoriteProductIds.includes(product.id);
    const previousIds = favoriteProductIds;
    setFavoriteUpdating(true);
    toggleFavorite(product.id);

    const request = wasFavorite
      ? removeWishlistProduct(product.id)
      : addWishlistProduct(product.id);

    request
      .then((data) => {
        if (data) setFavoriteProductIds(data.productIds);
      })
      .catch((error: unknown) => {
        console.error("[product-detail] Failed to update wishlist", error);
        setFavoriteProductIds(previousIds);
      })
      .finally(() => {
        setFavoriteUpdating(false);
      });
  };

  const detailContent =
    product.detailContent ??
    (product.categoryId === "fashion" || product.categoryId === "แฟชั่น" || product.categoryId === "เสื้อผ้า"
      ? {
          highlights: ["ผ้าคอตตอนนุ่ม ใส่สบาย", "ทรงใส่ง่าย เหมาะกับทุกวัน", "ซักมือหรือซักเครื่องโหมดถนอมผ้า"],
          infoCards: [
            { label: "เหมาะสำหรับ", value: "ใส่ทุกวันหรือแมตช์เป็นของขวัญ" },
            { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
          ],
          sizeGuide: {
            title: "ตารางไซซ์แนะนำ",
            headers: ["ไซซ์", "อก", "ยาว", "ไหล่"],
            rows: [["S", "36-38", "25", "17"], ["M", "38-40", "26", "18"], ["L", "40-42", "27", "19"], ["XL", "42-44", "28", "20"]],
          },
        }
      : product.categoryId === "drink" || product.categoryId === "เครื่องดื่ม"
        ? {
            highlights: ["ชงสดตามออเดอร์", "เลือกระดับความหวานได้", "แนะนำดื่มภายในวันที่ได้รับ"],
            infoCards: [
              { label: "เหมาะสำหรับ", value: "ดื่มสดหรือซื้อฝากคนพิเศษ" },
              { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
            ],
          }
        : product.categoryId === "beauty" || product.categoryId === "ความงาม"
          ? {
              highlights: ["สีชัด เนื้อบางเบา", "พกง่าย ใช้เติมระหว่างวันได้", "เก็บให้พ้นแสงแดดโดยตรง"],
              infoCards: [
                { label: "เหมาะสำหรับ", value: "เติมสีสดใสระหว่างวัน" },
                { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
              ],
            }
          : {
              highlights: ["แพ็กพร้อมส่ง", "เหมาะเป็นของฝาก", "เก็บในที่แห้งและเย็น"],
              infoCards: [
                { label: "เหมาะสำหรับ", value: "ซื้อใช้เองหรือเป็นของฝาก" },
                { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
              ],
            });

  const productSpecs = detailContent.highlights;
  const detailSections = detailContent.sections ?? [];
  const summaryText = detailContent.summary ?? product.description;
  const lazyRichDescription = useMemo(
    () =>
      detailContent.richDescription
        ? addLazyImageAttributes(detailContent.richDescription)
        : null,
    [detailContent.richDescription]
  );

  const galleryItems = [
    { key: "main", label: "รูปสินค้า", imageUrl: product.imageUrl, emoji: product.emoji, type: "image" },
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
  const lightboxImages = galleryItems
    .filter((item) => item.type === "image" && item.imageUrl)
    .map((item) => item.imageUrl as string);
  const selectedPreviewChoice = product.options
    ?.flatMap((option) =>
      option.choices.map((choice) => ({
        choice,
        optionName: option.name,
      }))
    )
    .find(({ choice, optionName }) => choice.imageUrl && selected[optionName] === choice.value)
    ?.choice;

  const productOptions = product.options ?? [];
  const selectableOptions = productOptions.filter((option) => option.choices.length > 1);
  const selectableVariantOptionNames = selectableOptions.map((option) => option.name);
  const missingOptions = selectableOptions.filter((option) => !selected[option.name]);
  const hasSelectedAllOptions = missingOptions.length === 0;
  const hasVariantStock = (product.variants?.length ?? 0) > 0;
  const allVariantsSoldOut =
    hasVariantStock && (product.variants?.every((variant) => variant.stock <= 0) ?? false);
  const hasSelectedAllVariantOptions =
    hasVariantStock && selectableVariantOptionNames.length > 0 && hasSelectedAllOptions;
  const selectedVariant =
    hasSelectedAllVariantOptions
      ? product.variants?.find((variant) =>
          selectableVariantOptionNames.every((name) => variant.options[name] === selected[name])
        )
      : hasVariantStock && selectableVariantOptionNames.length === 0
        ? getPreferredVariant(product)
        : undefined;
  const effectiveStock = allVariantsSoldOut ? 0 : selectedVariant?.stock ?? product.stock;
  const selectedProductImageUrl =
    selectedVariant?.imageUrl ?? selectedPreviewChoice?.imageUrl ?? product.imageUrl;
  const isSoldOut =
    allVariantsSoldOut || (hasSelectedAllVariantOptions && effectiveStock <= 0);
  const purchaseDisabled = isSoldOut || !hasSelectedAllOptions;
  const quantityStockLabel =
    isSoldOut || effectiveStock <= 0
      ? "สินค้าหมด"
      : hasVariantStock && !hasSelectedAllOptions
        ? "สินค้าพร้อมส่ง"
        : `มีสินค้าทั้งหมด ${effectiveStock.toLocaleString("th-TH")} ชิ้น`;

  useEffect(() => {
    let cancelled = false;

    fetchWishlist()
      .then((data) => {
        if (!cancelled) setFavoriteProductIds(data.productIds);
      })
      .catch((error: unknown) => {
        console.info("[product-detail] Wishlist sync skipped", error);
      });

    return () => {
      cancelled = true;
    };
  }, [setFavoriteProductIds]);

  useEffect(() => {
    if (!initialProduct.slug) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({
        salesChannel: "line_liff",
        relatedProductLimit: "4",
      });

      fetch(
        `/api/shop/products/slug/${encodeURIComponent(initialProduct.slug)}/detail?${params.toString()}`,
        { signal: controller.signal }
      )
        .then((response) =>
          response.ok ? response.json() : Promise.reject(response)
        )
        .then((data: ApiShopProductDetailResponse | null) => {
          if (cancelled || !data?.product) return;

          setProduct(mapApiProductDetailToProduct(data.product));
          setRelatedProducts(
            Array.isArray(data.relatedProducts)
              ? data.relatedProducts.map(mapApiShopProductToProduct)
              : []
          );
          setRemoteProductCoupons(
            Array.isArray(data.availableCoupons) ? data.availableCoupons : []
          );
          setProductCouponsLoaded(true);
          setFullDetailLoaded(true);
        })
        .catch((error: unknown) => {
          if (
            cancelled ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            return;
          }
          console.info("[product-detail] Full detail hydration skipped", error);
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [initialProduct.slug]);

  useLayoutEffect(() => {
    if (!consumeProductDetailScrollTop()) return;

    let cancelled = false;
    const scrollToTop = () => {
      if (cancelled) return;

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);
    const timers = PRODUCT_DETAIL_ENTRY_SCROLL_RETRY_DELAYS_MS.map((delay) =>
      window.setTimeout(scrollToTop, delay)
    );

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [product.id]);

  useEffect(() => {
    recordRecentlyViewed({ productId: product.id }).catch((error: unknown) => {
      console.info("[product-detail] Recently viewed sync skipped", error);
    });
  }, [product.id]);

  useEffect(() => {
    const target = deferredDetailRef.current;
    if (!target || deferredDetailReady) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setDeferredDetailReady(true);
        observer.disconnect();
      },
      { rootMargin: DEFERRED_DETAIL_ROOT_MARGIN }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [deferredDetailReady]);

  useEffect(() => {
    let cancelled = false;
    const params = getProductCouponParams(product, selectedVariant);

    void Promise.resolve().then(() => {
      if (cancelled) return;
      if (!selectedVariant) {
        if (!fullDetailLoaded) {
          setRemoteProductCoupons(initialCoupons);
        }
        setProductCouponsLoaded(true);
        return;
      }

      const cachedCoupons = getCachedAvailableCoupons(params);
      if (cachedCoupons.length > 0) {
        setRemoteProductCoupons(cachedCoupons);
        setProductCouponsLoaded(true);
      } else {
        setProductCouponsLoaded(false);
      }
    });

    if (!selectedVariant) {
      return () => {
        cancelled = true;
      };
    }

    const cachedCoupons = getCachedAvailableCoupons(params);
    if (cachedCoupons.length > 0) {
      return () => {
        cancelled = true;
      };
    }

    fetchAvailableCoupons(params)
      .then((items) => {
        if (!cancelled) {
          setRemoteProductCoupons(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteProductCoupons([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProductCouponsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fullDetailLoaded, initialCoupons, product, selectedVariant]);

  useEffect(() => {
    const shouldLoadReviews =
      activeTab === "review" || reviewsOpen || deferredDetailReady;
    if (!shouldLoadReviews || reviewsRequestedRef.current) return;

    reviewsRequestedRef.current = true;
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setReviewsLoading(true);
        setReviewsError(null);
        return Promise.all([
          fetchProductReviews(product.id, { page: 1, limit: 50, sort: "latest" }),
          fetchProductReviewSummary(product.id),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [reviewItems, summary] = result;
        if (cancelled) return;
        setRemoteReviews(reviewItems);
        setReviewSummary(summary);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRemoteReviews([]);
        setReviewsError(
          error instanceof Error ? error.message : "โหลดรีวิวไม่สำเร็จ"
        );
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, deferredDetailReady, product.id, reviewsOpen]);

  const getPriorSelections = (optionName: string) => {
    const optionIndex =
      product.options?.findIndex((option) => option.name === optionName) ?? -1;
    return Object.fromEntries(
      (product.options ?? [])
        .slice(0, Math.max(optionIndex, 0))
        .map((option) => [option.name, selected[option.name]])
        .filter(([, value]) => Boolean(value))
    );
  };

  const isChoiceCompatible = (optionName: string, choiceValue: string) => {
    if (!hasVariantStock || !product.variants) return true;
    const required = { ...getPriorSelections(optionName), [optionName]: choiceValue };
    return product.variants.some((v) =>
      Object.entries(required).every(([k, val]) => v.options[k] === val)
    );
  };

  const isChoiceSoldOut = (optionName: string, choiceValue: string) => {
    if (allVariantsSoldOut) return true;
    if (!hasVariantStock || !product.variants) return false;
    return !getPreferredVariant(product, {
      ...getPriorSelections(optionName),
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
    if (cartEditItemKey) {
      removeItem(cartEditItemKey);
    }
    addItem({
      product,
      quantity,
      selectedOptions: selected,
      variantId: selectedVariant?.id,
      imageUrl: selectedProductImageUrl,
    });
    if (cartEditItemKey) {
      router.push("/cart");
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (purchaseDisabled) return;

    const item = createBuyNowCartItem({
      product,
      quantity,
      selectedOptions: selected,
      variantId: selectedVariant?.id,
      imageUrl: selectedProductImageUrl,
    });

    storeBuyNowCheckout(item, null, null);
    router.push("/checkout?mode=buy-now");
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
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
    text: string;
    tag: string;
    date: string;
    media: ReviewMedia[];
  }[] = remoteReviews.map((review) => ({
    id: review.id,
    name: getReviewName(review),
    avatarUrl: getReviewAvatar(review),
    rating: Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0))),
    text: review.comment,
    tag: review.editedAt ? "แก้ไขแล้ว · ผู้ซื้อจริง" : "ผู้ซื้อจริง",
    date: formatReviewDate(review.editedAt ?? review.createdAt),
    media: (review.media ?? [])
      .map(getReviewMediaPreview)
      .filter((media): media is ReviewMedia => Boolean(media)),
  }));

  const filteredReviews =
    reviewFilter === "all" || reviewFilter === "latest"
      ? reviews
      : reviewFilter === "media"
        ? reviews.filter((r) => r.media.length > 0)
        : reviews.filter((r) => r.rating === Number(reviewFilter));
  const averageRatingLabel =
    reviewSummary.totalReviews > 0
      ? reviewSummary.averageRating.toFixed(1)
      : "0.0";
  const totalReviewsLabel = reviewSummary.totalReviews.toLocaleString("th-TH");

  const mainImageUrl =
    !userPickedGallery && selectedProductImageUrl
      ? selectedProductImageUrl
      : activeGalleryItem.imageUrl;

  return (
    <>
      <div className="product-detail-page min-h-screen bg-[#f5f3f1]">
        <AppHeader showBack />

        {/* ── Mobile-first centered container ── */}
        <div className="product-detail-grid mx-auto">

          {/* ── Gallery ── */}
          <div className="product-detail-gallery app-panel-shadow bg-white">
            <div
              className="relative overflow-hidden"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const delta = e.changedTouches[0].clientX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(delta) < 40) return;
                const currentIdx = galleryItems.findIndex((item) => item.key === activeGallery);
                const nextIdx =
                  delta < 0
                    ? (currentIdx + 1) % galleryItems.length
                    : (currentIdx - 1 + galleryItems.length) % galleryItems.length;
                setActiveGallery(galleryItems[nextIdx].key);
                setUserPickedGallery(true);
              }}
            >
              <button
                type="button"
                className="product-detail-main-media aspect-square w-full cursor-zoom-in bg-[#faf9f8]"
                onClick={() => {
                  const idx = lightboxImages.indexOf(mainImageUrl ?? "");
                  setLightboxIndex(idx >= 0 ? idx : 0);
                }}
              >
                <ProductImage
                  imageUrl={mainImageUrl}
                  emoji={activeGalleryItem.emoji}
                  size="lg"
                  fit="contain"
                  priority={activeGallery === "main"}
                  className="product-detail-main-media aspect-square w-full"
                />
              </button>

              {/* Favorite */}
              <button
                type="button"
                onClick={handleFavoriteToggle}
                aria-label={isFavorite ? `นำ ${product.name} ออกจากรายการโปรด` : `เพิ่ม ${product.name} ในรายการโปรด`}
                aria-pressed={isFavorite}
                disabled={favoriteUpdating}
                className={cn(
                  "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-1 transition active:scale-90",
                  isFavorite
                    ? "bg-brand text-white ring-brand/20"
                    : "bg-white text-brand ring-black/10 backdrop-blur"
                )}
              >
                <Heart className={cn("h-5 w-5", isFavorite && "scale-110 fill-current")} strokeWidth={2.2} />
              </button>

              {/* Gallery counter */}
              {galleryItems.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {galleryItems.findIndex((item) => item.key === activeGallery) + 1} / {galleryItems.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {galleryItems.length > 1 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 pt-2.5">
                {galleryItems.map((item) => {
                  const isActive = activeGallery === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => { setActiveGallery(item.key); setUserPickedGallery(true); }}
                      className={cn(
                        "relative h-[3.75rem] w-[3.75rem] shrink-0 overflow-hidden rounded-xl border-2 bg-[#faf9f8] transition",
                        isActive ? "border-brand" : "border-transparent ring-1 ring-black/[0.06]"
                      )}
                      aria-label={`ดู${item.label}`}
                    >
                      <ProductImage
                        imageUrl={item.imageUrl}
                        emoji={item.emoji}
                        size="sm"
                        className="h-full w-full"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="product-detail-info app-panel-shadow mt-2 bg-white px-4 pb-4 pt-3.5">
            {/* Badges */}
            {(product.badges.length > 0 || allVariantsSoldOut) && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {product.badges.map((b) => <Badge key={b} label={b} />)}
                {allVariantsSoldOut && (
                  <span className="rounded-full bg-black/8 px-2.5 py-1 text-[10px] font-bold text-ink-soft">
                    สินค้าหมด
                  </span>
                )}
              </div>
            )}

            <h1 className="text-[1.05rem] font-bold leading-snug text-ink">{product.name}</h1>

            <p className="mt-1 text-xs text-ink-soft">
              หมวดหมู่: {product.categoryName} · คงเหลือ {product.stock.toLocaleString("th-TH")} ชิ้น
            </p>

            {(product.soldCount ?? 0) > 0 && (
              <p className="mt-1.5 text-xs font-semibold text-ink-soft">
                ขายแล้ว {(product.soldCount ?? 0).toLocaleString("th-TH")} ชิ้น
              </p>
            )}

            <div className="mt-2.5">
              <Price value={product.price} compareAt={product.compareAtPrice} size="lg" />
            </div>

            {productSpecs.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-black/[0.05] pt-3">
                {productSpecs.map((spec) => (
                  <div key={spec} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} />
                    {spec}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Options + Quantity ── */}
          <div className="product-detail-options app-panel-shadow mt-2 bg-white px-4 pb-4 pt-3.5">
            {/* Dynamic option groups */}
            {selectableOptions.map((option, optionIndex) => (
              <div key={option.name} className={optionIndex > 0 ? "mt-5" : ""}>
                <p className="mb-2.5 text-sm font-semibold text-ink">{option.label}</p>
                <div className="flex flex-wrap gap-2">
                  {option.choices.map((choice) => {
                    if (!isChoiceCompatible(option.name, choice.value)) return null;
                    const active = selected[option.name] === choice.value;
                    const soldOut = isChoiceSoldOut(option.name, choice.value);
                    const hasPreview =
                      optionIndex === 0 && Boolean(choice.imageUrl || choice.swatchColor);
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          handleChoiceSelect(option.name, choice.value);
                          if (choice.imageUrl) {
                            setActiveGallery("main");
                            setUserPickedGallery(false);
                          }
                        }}
                        className={cn(
                          "relative text-sm font-medium transition disabled:cursor-not-allowed",
                          hasPreview
                            ? "flex min-h-[3.25rem] min-w-[7rem] items-center gap-2 rounded-xl px-2.5 py-2 text-left"
                            : "flex h-10 min-w-[2.75rem] items-center justify-center rounded-full border px-4",
                          soldOut
                            ? active
                              ? hasPreview
                                ? "bg-brand-soft/60 text-brand/60 ring-2 ring-brand/45"
                                : "border-brand/40 bg-brand-soft/60 text-brand/60"
                              : hasPreview
                                ? "bg-surface-muted text-ink-soft/40 ring-1 ring-black/5"
                                : "border-black/5 bg-surface-muted text-ink-soft/40"
                            : active
                              ? hasPreview
                                ? "bg-brand-soft text-brand ring-2 ring-brand"
                                : "border-brand bg-brand text-white"
                              : hasPreview
                                ? "bg-white text-ink ring-1 ring-black/10 hover:bg-brand-soft hover:text-brand"
                                : "border-black/10 bg-white text-ink hover:border-brand/25 hover:bg-brand-soft hover:text-brand"
                        )}
                      >
                        {hasPreview && (
                          <span
                            className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-black/[0.06]"
                            style={{ backgroundColor: choice.swatchColor ?? "var(--color-brand-soft)" }}
                          >
                            {choice.imageUrl && (
                              <ProductImage
                                imageUrl={choice.imageUrl}
                                emoji={product.emoji}
                                size="sm"
                                fit="contain"
                                className="h-full w-full bg-transparent"
                              />
                            )}
                            {soldOut && <span className="absolute inset-0 bg-white/55" />}
                          </span>
                        )}
                        <span>
                          {choice.label}
                          {soldOut && (
                            <span className="block text-[10px] font-bold text-brand/70">หมด</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Missing options warning */}
            {missingOptions.length > 0 && !allVariantsSoldOut && (
              <p className="mt-3 rounded-xl border border-brand/15 bg-brand-soft/60 px-3 py-2 text-xs font-bold text-brand">
                กรุณาเลือก {missingOptions.map((o) => o.label).join(" และ ")}
              </p>
            )}

            {/* Variant stock note */}
            {hasVariantStock && (
              <p className="mt-2.5 text-xs font-medium text-ink-soft">
                {allVariantsSoldOut
                  ? "สินค้านี้หมดทุกแบบแล้ว"
                  : selectedVariant
                    ? selectedVariant.stock > 0
                      ? `ชุดนี้เหลือ ${selectedVariant.stock} ชิ้น`
                      : "ชุดตัวเลือกนี้หมดแล้ว"
                    : "เลือกตัวเลือกให้ครบเพื่อเช็กสต็อก"}
              </p>
            )}

            <div className="my-4 border-t border-black/[0.05]" />

            {/* Quantity */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">จำนวน</span>
              <div className="flex items-center gap-3">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={Math.max(effectiveStock, 1)}
                />
                <span className="text-xs text-ink-soft">{quantityStockLabel}</span>
              </div>
            </div>
          </div>

          {/* ── Trust badges ── */}
          <div className="product-detail-trust app-panel-shadow mt-2 bg-white px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: "Official", amber: false },
                { icon: Truck, label: "ส่งไว", amber: false },
                { icon: PackageCheck, label: "แพ็กดี", amber: false },
              ].map(({ icon: Icon, label, amber }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-[#faf9f8] py-2.5">
                  <Icon className={cn("h-4 w-4", amber ? "fill-amber-400 text-amber-500" : "text-brand")} />
                  <span className="text-[10px] font-semibold text-ink-soft">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Coupons ── */}

          {showProductCouponSection && (
            <div className="product-detail-wide app-panel-shadow mt-2 bg-[var(--background)] px-4 pb-4 pt-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <TicketPercent className="h-4 w-4 text-brand" />
                  คูปองสำหรับคุณ
                </h2>
                <Link href="/coupons" className="text-[11px] font-extrabold text-brand">
                  คูปองของฉัน
                </Link>
              </div>
              <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
                {!productCouponsLoaded
                  ? [0, 1].map((item) => (
                      <div
                        key={item}
                        className="home-panel-shadow relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white ring-1 ring-brand/10 md:min-w-0"
                      >
                        <div className="h-[5.75rem] w-24 shrink-0 animate-pulse bg-brand/15" />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-28 animate-pulse rounded-full bg-surface-muted" />
                            <div className="h-3 w-36 animate-pulse rounded-full bg-surface-muted" />
                            <div className="h-3 w-24 animate-pulse rounded-full bg-surface-muted" />
                          </div>
                          <div className="h-9 w-14 shrink-0 animate-pulse rounded-full bg-surface-muted" />
                        </div>
                        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--background)]" />
                      </div>
                    ))
                  : displayProductCoupons.map((coupon) => {
                  const isClaimed = coupon.isClaimed;
                  const canClaim = coupon.canClaim && !isClaimed;
                  const isClaiming = claimingProductCouponIds.includes(coupon.id);
                  return (
                    <article
                      key={coupon.id}
                      className="home-panel-shadow relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white ring-1 ring-brand/10 md:min-w-0"
                    >
                      <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-brand px-2 py-4 text-center text-white">
                        <span className="text-xl font-extrabold leading-none">{coupon.value}</span>
                        <span className="mt-1 text-[10px] font-bold leading-tight text-white/80">{coupon.minimumLabel}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-ink">{coupon.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink-soft">{coupon.detail}</p>
                          <p className="mt-1 truncate text-[10px] font-bold uppercase text-ink-soft">
                            CODE {coupon.code}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isClaiming || (!isClaimed && !canClaim)}
                          onClick={() =>
                            isClaimed
                              ? handleUseProductCoupon(coupon)
                              : claimProductCoupon(coupon)
                          }
                          className={cn(
                            "flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold transition active:scale-95 disabled:shadow-none",
                            isClaimed
                              ? "brand-button text-white"
                              : canClaim
                                ? "brand-button text-white"
                                : "bg-surface-muted text-ink-soft"
                          )}
                          aria-label={isClaimed ? "ใช้คูปอง" : "เก็บคูปอง"}
                        >
                          {isClaiming ? "..." : isClaimed ? "ใช้เลย" : "เก็บ"}
                        </button>
                      </div>
                      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--background)]" />
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Detail tabs ── */}
          <div
            ref={deferredDetailRef}
            className="product-detail-wide app-panel-shadow mt-2 bg-white overflow-hidden"
          >
            {/* Tab bar */}
            <div className="flex border-b border-black/[0.06]">
              {(["detail", "shipping", "review"] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setDeferredDetailReady(true);
                    setActiveTab(tab);
                  }}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold transition",
                    activeTab === tab
                      ? "border-b-2 border-brand text-brand"
                      : "text-ink-soft"
                  )}
                >
                  {tab === "detail" ? "รายละเอียดสินค้า" : tab === "shipping" ? "การจัดส่ง" : `รีวิว (${totalReviewsLabel})`}
                </button>
              ))}
            </div>

            <div className="px-4 py-4">
              {!deferredDetailReady ? (
                <div className="space-y-3">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-surface-muted" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-surface-muted" />
                  <div className="h-3 w-11/12 animate-pulse rounded-full bg-surface-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-surface-muted" />
                </div>
              ) : (
                <>
              {/* ── Detail tab ── */}
              {activeTab === "detail" && (
                <div className="space-y-4">
                  {lazyRichDescription ? (
                    <div
                      className="overflow-hidden text-sm leading-7 text-ink-soft [&_*]:!max-w-full [&_img]:!block [&_img]:!h-auto [&_img]:!w-full [&_img]:!max-w-full [&_img]:rounded-xl [&_table]:!w-full"
                      dangerouslySetInnerHTML={{ __html: lazyRichDescription }}
                    />
                  ) : summaryText ? (
                    <p className="text-sm leading-7 text-ink-soft">{summaryText}</p>
                  ) : null}

                  {detailContent.sizeGuide && (
                    <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
                      <div className="bg-brand px-4 py-2.5 text-xs font-bold text-white">
                        {detailContent.sizeGuide.title}
                      </div>
                      <div
                        className="grid bg-white text-center text-xs"
                        style={{ gridTemplateColumns: `repeat(${detailContent.sizeGuide.headers.length}, minmax(0,1fr))` }}
                      >
                        {detailContent.sizeGuide.headers.map((h) => (
                          <div key={h} className="bg-brand-soft px-2 py-2 font-bold text-brand">{h}</div>
                        ))}
                        {detailContent.sizeGuide.rows.flatMap((row) =>
                          row.map((cell, i) => (
                            <div key={`${row[0]}-${i}`} className="border-t border-black/[0.04] px-2 py-2 text-ink-soft">
                              {cell}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {detailSections.map((section) => (
                    <div key={section.title} className="rounded-2xl bg-[#faf9f8] p-4">
                      <h3 className="text-sm font-bold text-ink">{section.title}</h3>
                      {section.body && (
                        <p className="mt-2 text-sm leading-7 text-ink-soft">{section.body}</p>
                      )}
                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {section.bullets.map((b) => (
                            <li key={b} className="flex gap-2 text-sm text-ink-soft">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Shipping tab ── */}
              {activeTab === "shipping" && (
                <div className="space-y-3">
                  {[
                    {
                      icon: Truck,
                      title: "จัดส่งทุกวัน",
                      body: "รับออเดอร์ก่อน 12.00 น. จัดส่งวันเดียวกัน · คาดว่าได้รับภายใน 1–3 วันทำการ",
                    },
                    {
                      icon: PackageCheck,
                      title: "แพ็กพิถีพิถัน",
                      body: "แพ็กกันกระแทกทุกออเดอร์ พร้อมถ่ายรูปก่อนส่งเสมอ",
                    },
                    {
                      icon: ShieldCheck,
                      title: "ประกันสินค้า",
                      body: "หากสินค้าเสียหายระหว่างขนส่ง แจ้งร้านภายใน 24 ชม. ยินดีเปลี่ยนให้ฟรี",
                    },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex items-start gap-3 rounded-2xl bg-[#faf9f8] p-3.5">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                      <div>
                        <p className="text-sm font-bold text-ink">{title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Review tab ── */}
              {activeTab === "review" && (
                <div>
                  <div className="mb-4 flex items-center gap-4 rounded-2xl bg-brand px-4 py-3.5 text-white">
                    <div>
                      <p className="text-3xl font-extrabold leading-none">{averageRatingLabel}</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{totalReviewsLabel} รีวิว</p>
                      <p className="text-xs text-white/70">จากลูกค้าที่ซื้อจริง</p>
                    </div>
                  </div>

                  <div className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1">
                    {reviewFilters.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setReviewFilter(f.value)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95",
                          reviewFilter === f.value
                            ? "bg-brand text-white"
                            : "bg-[#f0efed] text-ink-soft"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {reviewsLoading && (
                    <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-[#faf9f8] px-4 py-6 text-sm font-bold text-ink-soft">
                      <Loader2 className="h-4 w-4 animate-spin text-brand" />
                      กำลังโหลดรีวิว
                    </div>
                  )}
                  {reviewsError && !reviewsLoading && (
                    <div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                      {reviewsError}
                    </div>
                  )}

                  <div className="space-y-3">
                    {filteredReviews.slice(0, 3).map((review) => (
                      <article key={review.id} className="rounded-2xl bg-[#faf9f8] p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ReviewAvatar name={review.name} avatarUrl={review.avatarUrl} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-ink">{review.name}</p>
                              <p className="text-[10px] text-ink-soft">{review.tag}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400" /> {review.rating}.0
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                          &quot;{review.text}&quot;
                        </p>
                        <p className="mt-1 text-[10px] text-ink-soft/60">{review.date}</p>
                        {review.media.length > 0 && (
                          <div className="mt-2.5 flex gap-2">
                            {review.media.map((media, idx) => (
                              <button
                                key={`${review.id}-${idx}`}
                                type="button"
                                onClick={() => setActiveReviewMedia(media as ReviewMedia)}
                                className="relative h-14 w-14 overflow-hidden rounded-xl ring-1 ring-black/[0.04]"
                                aria-label={media.type === "video" ? "เปิดวิดีโอรีวิว" : "เปิดรูปรีวิว"}
                              >
                                <ReviewMediaThumbnail media={media} product={product} />
                                {media.type === "video" && (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white pl-0.5 text-[9px] font-bold text-brand">▶</span>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                    {filteredReviews.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setReviewsOpen(true)}
                        className="w-full rounded-2xl bg-[#f0efed] py-3 text-xs font-bold text-ink-soft transition active:scale-[0.99]"
                      >
                        ดูรีวิวทั้งหมด {filteredReviews.length} รายการ →
                      </button>
                    )}
                    {filteredReviews.length === 0 && !reviewsLoading && (
                      <div className="rounded-2xl bg-[#faf9f8] px-4 py-8 text-center">
                        <Star className="mx-auto h-6 w-6 text-ink-soft/30" />
                        <p className="mt-2 text-sm font-bold text-ink">ยังไม่มีรีวิวในหมวดนี้</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </div>

          {deferredDetailReady && relatedProducts.length > 0 && (
            <section className="product-detail-wide app-panel-shadow mt-2 bg-white px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-ink">
                  สินค้าที่เกี่ยวข้อง
                </h2>
                <Link
                  href={`/products?category=${encodeURIComponent(product.categoryId)}`}
                  className="text-[11px] font-extrabold text-brand"
                >
                  ดูทั้งหมด
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
                {relatedProducts.map((relatedProduct, index) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="product-detail-action-spacer product-detail-wide" />
        </div>

        {/* ── Sticky bottom action bar ── */}
        <div className="product-detail-action-bar promo-action-bar fixed inset-x-0 bottom-above-nav z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur">
          <div className="product-detail-action-inner mx-auto">
            <div className="product-detail-action-summary hidden md:block">
              <p className="truncate text-sm font-bold text-ink">{product.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <Price value={product.price} compareAt={product.compareAtPrice} size="sm" />
                <span className="text-xs font-medium text-ink-soft">{quantityStockLabel}</span>
              </div>
              {!hasSelectedAllOptions && !allVariantsSoldOut && (
                <p className="mt-1 text-xs font-bold text-brand">
                  กรุณาเลือก {missingOptions.map((o) => o.label).join(" และ ")} ก่อน
                </p>
              )}
            </div>

            <div className="md:hidden">
              {!hasSelectedAllOptions && !allVariantsSoldOut && (
                <p className="mb-2 text-center text-xs font-bold text-brand">
                  กรุณาเลือก {missingOptions.map((o) => o.label).join(" และ ")} ก่อน
                </p>
              )}
            </div>

            <div className="product-detail-action-buttons flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-12 flex-1 whitespace-nowrap border-brand/20 bg-brand-soft/70 px-3 text-sm font-bold shadow-none hover:bg-brand-soft md:h-13"
                onClick={handleAdd}
                disabled={purchaseDisabled}
              >
                {added ? (
                  <><Check className="mr-1.5 h-4 w-4" /> เพิ่มแล้ว</>
                ) : allVariantsSoldOut ? (
                  "สินค้าหมด"
                ) : isEditingCartItem ? (
                  <><ShoppingCart className="mr-1.5 h-4 w-4" /> อัปเดตตะกร้า</>
                ) : (
                  <><ShoppingCart className="mr-1.5 h-4 w-4" /> เพิ่มลงตะกร้า</>
                )}
              </Button>
              <Button
                size="lg"
                className="h-12 flex-[1.2] px-3 text-sm font-bold shadow-md shadow-brand/20 md:h-13"
                onClick={handleBuyNow}
                disabled={purchaseDisabled}
              >
                {allVariantsSoldOut ? "แจ้งเตือนเมื่อมีสินค้า" : "ซื้อทันที"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Review full modal ── */}
      {reviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="mx-auto flex max-h-[78dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:max-h-[82dvh] md:max-w-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.05] px-4 py-3">
              <div>
                <h2 className="text-lg font-extrabold text-ink">รีวิวทั้งหมด</h2>
                <p className="text-xs font-semibold text-ink-soft">จากลูกค้าที่สั่งซื้อสินค้า PonPon</p>
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
                    <p className="text-xs font-semibold text-white/75">คะแนนรวม</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Star className="h-6 w-6 fill-amber-300 text-amber-300" />
                      <span className="text-3xl font-extrabold">{averageRatingLabel}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white/85">{totalReviewsLabel} รีวิว</p>
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
                      reviewFilter === filter.value ? "bg-brand text-white" : "bg-surface-muted text-ink-soft"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredReviews.map((review) => (
                  <article key={review.id} className="rounded-3xl bg-[#fff8f6] p-3.5 ring-1 ring-black/[0.03]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ReviewAvatar name={review.name} avatarUrl={review.avatarUrl} size="md" />
                        <div>
                          <p className="text-sm font-extrabold text-ink">{review.name}</p>
                          <p className="text-[10px] font-bold text-ink-soft">{review.tag}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink-soft/80">{review.date}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {review.rating}.0
                      </span>
                    </div>
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn(
                            "h-3.5 w-3.5",
                            index < review.rating ? "fill-amber-400 text-amber-500" : "fill-surface-muted text-surface-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">&quot;{review.text}&quot;</p>
                    {review.media.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {review.media.map((media, index) => (
                          <button
                            key={`${review.id}-${media.type}-${index}`}
                            type="button"
                            onClick={() => setActiveReviewMedia(media as ReviewMedia)}
                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"
                            aria-label={media.type === "video" ? "เปิดวิดีโอรีวิว" : "เปิดรูปรีวิว"}
                          >
                            <ReviewMediaThumbnail
                              media={media}
                              product={product}
                              className="rounded-2xl"
                            />
                            {media.type === "video" && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white pl-0.5 text-xs font-extrabold text-brand shadow-sm">▶</span>
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {filteredReviews.length === 0 && !reviewsLoading && (
                  <div className="rounded-3xl bg-surface-muted px-4 py-10 text-center">
                    <Star className="mx-auto h-7 w-7 text-ink-soft/35" />
                    <p className="mt-2 text-sm font-extrabold text-ink">ยังไม่มีรีวิวในหมวดนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Review media modal ── */}
      {activeReviewMedia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="flex min-h-[62dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl md:min-h-[70dvh] md:max-w-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  {activeReviewMedia.type === "video" ? "วิดีโอรีวิว" : "รูปรีวิว"}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">จากลูกค้าที่ซื้อสินค้านี้</p>
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
                  poster={activeReviewMedia.thumbnailUrl ?? undefined}
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
                  className="h-full min-h-[48dvh] w-full bg-white md:min-h-[62dvh]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowLeft")
              setLightboxIndex((i) =>
                i !== null ? (i - 1 + lightboxImages.length) % lightboxImages.length : null
              );
            if (e.key === "ArrowRight")
              setLightboxIndex((i) =>
                i !== null ? (i + 1) % lightboxImages.length : null
              );
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < 40) return;
              setLightboxIndex((i) =>
                i !== null
                  ? delta < 0
                    ? (i + 1) % lightboxImages.length
                    : (i - 1 + lightboxImages.length) % lightboxImages.length
                  : null
              );
            }}
          >
            <Image
              src={lightboxImages[lightboxIndex]}
              alt="Product image"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-5 rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              {lightboxIndex + 1}/{lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

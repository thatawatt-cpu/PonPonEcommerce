import type { Product, ProductBadge } from "@/types/product";
import type { Category } from "@/types/common";
import type {
  ApiProductListItem,
  ApiProductDetail,
  ApiCategory,
} from "@/types/api";

function deriveBadges(
  product: ApiProductListItem | ApiProductDetail
): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if ("isBestSeller" in product && product.isBestSeller) badges.push("ขายดี");
  if ("isFeatured" in product && product.isFeatured) badges.push("แนะนำ");
  if (
    "promotionBadge" in product &&
    product.promotionBadge
  )
    badges.push("ลดราคา");
  return badges;
}

function getSoldCount(product: ApiProductListItem | ApiProductDetail): number | undefined {
  return product.soldCount > 0 ? product.soldCount : undefined;
}

export function mapApiProductToProduct(api: ApiProductListItem): Product {
  return {
    id: api.id,
    sku: api.sku || api.baseSku,
    name: api.name,
    slug: api.slug ?? api.baseSku.toLowerCase().replace(/\s+/g, "-"),
    description: "",
    price: api.sellPrice,
    imageUrl: api.imageUrl ?? "",
    emoji: "📦",
    categoryId: api.categoryName ?? "",
    categoryName: api.categoryName ?? "",
    badges: deriveBadges(api),
    stock: api.availableStock,
    soldCount: getSoldCount(api),
    isFeatured: false,
    isBestSeller: false,
  };
}

export function mapApiProductDetailToProduct(api: ApiProductDetail): Product {
  const sortedImages = api.images?.slice().sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const primaryImageObj = sortedImages.find((img) => img.isPrimary) ?? sortedImages[0];
  const primaryImage = primaryImageObj?.url ?? api.imageUrl ?? "";

  const galleryImages = sortedImages
    .filter((img) => img.id !== primaryImageObj?.id)
    .map((img) => ({ id: img.id, label: "รูปสินค้า", imageUrl: img.url }));

  const activeVariants = api.variants?.filter((v) => v.isActiveFromZort) ?? [];

  return {
    id: api.id,
    sku: api.sku || api.baseSku,
    zortCategoryId: api.zortCategoryId,
    name: api.name,
    slug: api.slug ?? api.baseSku.toLowerCase().replace(/\s+/g, "-"),
    description: api.description ?? "",
    price: api.sellPrice,
    compareAtPrice:
      api.originalPrice && api.originalPrice > api.sellPrice
        ? api.originalPrice
        : undefined,
    imageUrl: primaryImage,
    gallery: galleryImages,
    emoji: "📦",
    categoryId: api.categoryName ?? "",
    categoryName: api.categoryName ?? "",
    badges: deriveBadges(api),
    stock: api.availableStock,
    soldCount: getSoldCount(api),
    isFeatured: api.isFeatured,
    isBestSeller: api.isBestSeller,
    detailContent: {
      summary: api.description ?? undefined,
      richDescription: api.richDescription ?? undefined,
      highlights: api.highlights
        ? api.highlights
            .split("\n")
            .map((h) => h.trim())
            .filter(Boolean)
        : [],
    },
    options: (() => {
      if (activeVariants.length === 0) return undefined;
      // Derive option dimensions from OptionJson on each variant
      const allOptions = activeVariants.flatMap((v) => v.options ?? []);
      if (allOptions.length > 0) {
        const optionNames = [...new Set(allOptions.map((o) => o.name))];
        return optionNames.map((name) => ({
          name,
          label: name,
          choices: [
            ...new Map(
              activeVariants
                .flatMap((v) =>
                  (v.options ?? [])
                    .filter((o) => o.name === name)
                    .map((o) => [
                      o.value,
                      {
                        label: o.value,
                        value: o.value,
                        imageUrl: v.imageUrl ?? undefined,
                      },
                    ] as [string, { label: string; value: string; imageUrl: string | undefined }])
                )
            ).values(),
          ],
        }));
      }
      // Fallback: SKU-based selector
      return [
        {
          name: "variant",
          label: "รุ่น",
          choices: activeVariants.map((v) => ({
            label: v.sku,
            value: v.variantCode,
            imageUrl: v.imageUrl ?? undefined,
          })),
        },
      ];
    })(),
    variants:
      activeVariants.length > 0
        ? activeVariants.map((v) => ({
            id: v.id,
            sku: v.sku,
            variantCode: v.variantCode,
            options:
              v.options && v.options.length > 0
                ? Object.fromEntries(v.options.map((o) => [o.name, o.value]))
                : { variant: v.variantCode },
            stock: v.availableStock,
            imageUrl: v.imageUrl ?? undefined,
          }))
        : undefined,
  };
}

const categoryThaiNames: Record<string, string> = {
  "Beauty&Care Products": "ความงาม",
  Cleaning: "ทำความสะอาด",
  "Fashion&Accessories": "แฟชั่น",
  Gadgets: "แกดเจ็ต",
  "Home Suppliers": "ของใช้บ้าน",
  "Kitchen Utensils": "ของใช้ครัว",
  "Light&Digital": "ไฟ & ดิจิทัล",
  "Pet Care": "สัตว์เลี้ยง",
  "Storage&Organization": "จัดเก็บ",
  ขนม: "ขนม",
  เครื่องดื่ม: "เครื่องดื่ม",
  แฟชั่น: "แฟชั่น",
  เสื้อผ้า: "เสื้อผ้า",
  ความงาม: "ความงาม",
  ของใช้: "ของใช้",
};

export function mapApiCategoryToCategory(api: ApiCategory): Category {
  return {
    id: api.name,
    name: categoryThaiNames[api.name] ?? api.name,
    emoji: getCategoryEmoji(api.name),
  };
}

function getCategoryEmoji(name: string): string {
  const map: Record<string, string> = {
    "Beauty&Care Products": "💄",
    Cleaning: "🧹",
    "Fashion&Accessories": "👗",
    Gadgets: "📱",
    "Home Suppliers": "🏠",
    "Kitchen Utensils": "🍳",
    "Light&Digital": "💡",
    "Pet Care": "🐾",
    "Storage&Organization": "📦",
    ขนม: "🍪",
    เครื่องดื่ม: "🥤",
    แฟชั่น: "👕",
    เสื้อผ้า: "👕",
    ความงาม: "💄",
    ของใช้: "🧸",
  };
  return map[name] ?? "🛍️";
}

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

export function mapApiProductToProduct(api: ApiProductListItem): Product {
  return {
    id: api.id,
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
    isFeatured: false,
    isBestSeller: false,
  };
}

export function mapApiProductDetailToProduct(api: ApiProductDetail): Product {
  const primaryImage =
    api.images?.find((img) => img.isPrimary)?.url ?? api.imageUrl ?? "";
  const galleryImages =
    api.images
      ?.filter((img) => !img.isPrimary)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        label: "รูปสินค้า",
        imageUrl: img.url,
      })) ?? [];

  const activeVariants =
    api.variants?.filter(
      (v) => v.isActiveFromZort && v.status === "Active"
    ) ?? [];

  return {
    id: api.id,
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
    options:
      activeVariants.length > 0
        ? [
            {
              name: "variant",
              label: "รุ่น",
              choices: activeVariants.map((v) => ({
                label: v.sku,
                value: v.variantCode,
                imageUrl: v.imageUrl ?? undefined,
              })),
            },
          ]
        : undefined,
    variants:
      activeVariants.length > 0
        ? activeVariants.map((v) => ({
            id: v.id,
            options: { variant: v.variantCode },
            stock: v.availableStock,
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

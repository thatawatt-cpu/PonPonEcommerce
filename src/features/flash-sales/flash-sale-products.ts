import type { ApiFlashSale } from "@/types/api";
import type { Product } from "@/types/product";

function createFlashSaleFallbackProduct(
  item: ApiFlashSale["products"][number]
): Product {
  return {
    id: item.productId,
    name: item.productName,
    slug: item.productId,
    description: "",
    price: item.salePrice,
    compareAtPrice: item.originalPrice,
    imageUrl: item.imageUrl ?? "",
    emoji: "📦",
    categoryId: "",
    categoryName: "",
    badges: ["ลดราคา"],
    stock: 0,
    isFeatured: false,
    isBestSeller: false,
  };
}

export function buildFlashSaleProducts(
  products: Product[],
  flashSale: ApiFlashSale | null
): Product[] {
  if (!flashSale?.products.length) return [];

  const productMap = new Map(products.map((product) => [product.id, product]));

  return flashSale.products.map((item) => {
    const product = productMap.get(item.productId);
    return product
      ? {
          ...product,
          price: item.salePrice,
          compareAtPrice: item.originalPrice,
          imageUrl: product.imageUrl || item.imageUrl || "",
        }
      : createFlashSaleFallbackProduct(item);
  });
}

export function mergeFlashSaleProducts(
  products: Product[],
  flashSaleProducts: Product[]
): Product[] {
  if (flashSaleProducts.length === 0) return products;

  const existingIds = new Set(products.map((product) => product.id));
  const missingFlashSaleProducts = flashSaleProducts.filter(
    (product) => !existingIds.has(product.id)
  );

  return [
    ...products.map((product) => {
      const flashSaleProduct = flashSaleProducts.find(
        (item) => item.id === product.id
      );
      return flashSaleProduct ?? product;
    }),
    ...missingFlashSaleProducts,
  ];
}

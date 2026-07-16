import type { ApiFlashSale } from "@/types/api";
import type { Product } from "@/types/product";

function createFlashSaleFallbackProduct(
  item: ApiFlashSale["products"][number],
  flashSaleId: string
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
    priceSource: "flash_sale",
    activeFlashSaleId: flashSaleId,
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
          priceSource: "flash_sale",
          activeFlashSaleId: flashSale.id,
          imageUrl: product.imageUrl || item.imageUrl || "",
        }
      : createFlashSaleFallbackProduct(item, flashSale.id);
  });
}

export function mergeFlashSaleProducts(
  products: Product[],
  flashSaleProducts: Product[],
  options: { includeMissing?: boolean } = {}
): Product[] {
  if (flashSaleProducts.length === 0) return products;
  const includeMissing = options.includeMissing ?? true;

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
    ...(includeMissing ? missingFlashSaleProducts : []),
  ];
}

export interface CartItem {
  productId: string;
  productSlug?: string | null;
  variantId?: string | null;
  name: string;
  price: number;
  imageUrl: string;
  emoji: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

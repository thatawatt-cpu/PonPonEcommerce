export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  imageUrl: string;
  emoji: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

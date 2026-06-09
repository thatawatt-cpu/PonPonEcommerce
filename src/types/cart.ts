export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  emoji: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

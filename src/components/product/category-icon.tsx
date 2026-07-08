import {
  Cookie,
  Cpu,
  Droplets,
  Gift,
  Home,
  Lightbulb,
  Milk,
  PawPrint,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

const categoryIconMap: Record<string, LucideIcon> = {
  // English API names
  "Beauty&Care Products": Sparkles,
  Cleaning: Droplets,
  "Fashion&Accessories": Shirt,
  Gadgets: Cpu,
  "Home Suppliers": Home,
  "Kitchen Utensils": UtensilsCrossed,
  "Light&Digital": Lightbulb,
  "Pet Care": PawPrint,
  "Storage&Organization": Package,
  // Thai names
  ทั้งหมด: ShoppingBag,
  ขนม: Cookie,
  เครื่องดื่ม: Milk,
  แฟชั่น: Shirt,
  เสื้อผ้า: Shirt,
  ความงาม: Sparkles,
  ของใช้: Gift,
  // Legacy English IDs
  all: ShoppingBag,
  snack: Cookie,
  drink: Milk,
  fashion: Shirt,
  beauty: Sparkles,
  gadget: Gift,
  "flash-sale": Zap,
};

interface CategoryIconProps {
  categoryId: string;
  className?: string;
}

export function CategoryIcon({ categoryId, className }: CategoryIconProps) {
  const Icon = categoryIconMap[categoryId] ?? Gift;
  return <Icon className={className} strokeWidth={1.8} />;
}

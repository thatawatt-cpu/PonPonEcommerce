import {
  Cookie,
  Gift,
  Milk,
  Shirt,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  all: ShoppingBag,
  snack: Cookie,
  drink: Milk,
  fashion: Shirt,
  beauty: Sparkles,
  gadget: Gift,
};

interface CategoryIconProps {
  categoryId: string;
  className?: string;
}

export function CategoryIcon({
  categoryId,
  className,
}: CategoryIconProps) {
  const Icon = categoryIcons[categoryId] ?? Gift;

  return <Icon className={className} strokeWidth={1.8} />;
}

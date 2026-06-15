import type { CartItem } from "@/types/cart";

export type PromotionScope = "order" | "shipping" | "product" | "bundle";

export interface PromotionDefinition {
  code: string;
  title: string;
  description: string;
  value: string;
  minimumSpend: string;
  expireAt: string;
  scope: PromotionScope;
  discountAmount?: number;
  minimumSubtotal?: number;
  eligibleProductIds?: string[];
  requiredProductIds?: string[];
}

export interface PromotionResult {
  code?: string;
  message: string;
  error: boolean;
  discountAmount: number;
  discountLabel: string;
  scope?: PromotionScope;
  eligibleProductIds: string[];
  title?: string;
}

export const availablePromotions: PromotionDefinition[] = [
  {
    code: "PONPON50",
    title: "คูปองร้านค้า ลด ฿50",
    description: "ใช้กับยอดรวมทั้งออเดอร์ เมื่อซื้อสินค้าครบตามเงื่อนไข",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿499",
    expireAt: "หมดอายุ 15 มิ.ย. 2569",
    scope: "order",
    discountAmount: 50,
    minimumSubtotal: 499,
  },
  {
    code: "PONFRIEND50",
    title: "คูปองเพื่อนใหม่ ลด ฿50",
    description: "รางวัลสำหรับผู้ใช้รหัสแนะนำเพื่อนครั้งแรก",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿299",
    expireAt: "หมดอายุ 30 วันหลังรับคูปอง",
    scope: "order",
    discountAmount: 50,
    minimumSubtotal: 299,
  },
  {
    code: "PONTHANK50",
    title: "คูปองขอบคุณที่แนะนำเพื่อน ลด ฿50",
    description: "รางวัลสำหรับผู้แนะนำเมื่อเพื่อนสั่งซื้อสำเร็จ",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿299",
    expireAt: "หมดอายุ 30 วันหลังได้รับรางวัล",
    scope: "order",
    discountAmount: 50,
    minimumSubtotal: 299,
  },
  {
    code: "FREESHIP",
    title: "ส่งฟรีเมื่อซื้อครบ",
    description: "ลดค่าจัดส่งสำหรับออเดอร์ที่เข้าเงื่อนไข",
    value: "FREE",
    minimumSpend: "ซื้อครบ ฿399",
    expireAt: "หมดอายุ 18 มิ.ย. 2569",
    scope: "shipping",
    minimumSubtotal: 399,
  },
  {
    code: "COOKIE20",
    title: "คุกกี้ลดทันที ฿20",
    description: "ใช้ได้เฉพาะคุกกี้เนยสดป๋องป๋อง",
    value: "฿20",
    minimumSpend: "เฉพาะคุกกี้",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    scope: "product",
    discountAmount: 20,
    eligibleProductIds: ["1"],
  },
  {
    code: "MILKTEA10",
    title: "ชานมลดทันที ฿10",
    description: "ใช้ได้เฉพาะชานมไข่มุกป๋องป๋อง",
    value: "฿10",
    minimumSpend: "เฉพาะชานม",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    scope: "product",
    discountAmount: 10,
    eligibleProductIds: ["2"],
  },
  {
    code: "LIP15",
    title: "ลิปทินต์ลดทันที ฿15",
    description: "ใช้ได้เฉพาะลิปทินต์ป๋องป๋อง",
    value: "฿15",
    minimumSpend: "เฉพาะลิปทินต์",
    expireAt: "หมดอายุ 22 มิ.ย. 2569",
    scope: "product",
    discountAmount: 15,
    eligibleProductIds: ["4"],
  },
  {
    code: "BUNDLE20",
    title: "ซื้อคู่แล้วคุ้ม",
    description: "ลด ฿20 เมื่อมีคุกกี้และชานมในออเดอร์เดียวกัน",
    value: "฿20",
    minimumSpend: "คุกกี้ + ชานม",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    scope: "bundle",
    discountAmount: 20,
    requiredProductIds: ["1", "2"],
  },
];

export function getPromotionsForProduct(productId: string) {
  return availablePromotions.filter(
    (promotion) =>
      promotion.scope === "product" &&
      promotion.eligibleProductIds?.includes(productId),
  );
}

export function evaluatePromotion(
  codeValue: string,
  items: CartItem[],
  subtotal: number,
  shippingFee: number,
): PromotionResult {
  const code = codeValue.trim().toUpperCase();
  const promotion = availablePromotions.find((item) => item.code === code);

  if (!promotion) {
    return {
      message: "ไม่พบโค้ดนี้ หรือโค้ดหมดอายุแล้ว",
      error: true,
      discountAmount: 0,
      discountLabel: "ส่วนลด",
      eligibleProductIds: [],
    };
  }

  if (
    promotion.minimumSubtotal &&
    subtotal < promotion.minimumSubtotal
  ) {
    return {
      message: `ยอดสินค้าไม่ถึง ฿${promotion.minimumSubtotal.toLocaleString()} ขาดอีก ฿${(
        promotion.minimumSubtotal - subtotal
      ).toLocaleString()}`,
      error: true,
      discountAmount: 0,
      discountLabel: "ส่วนลด",
      eligibleProductIds: [],
    };
  }

  const cartProductIds = new Set(items.map((item) => item.productId));
  const eligibleProductIds =
    promotion.scope === "bundle"
      ? (promotion.requiredProductIds ?? [])
      : (promotion.eligibleProductIds ?? []);

  if (
    promotion.scope === "product" &&
    !eligibleProductIds.some((productId) => cartProductIds.has(productId))
  ) {
    return {
      message: "คูปองนี้ใช้ได้กับสินค้าที่กำหนดเท่านั้น และยังไม่มีสินค้านั้นในตะกร้า",
      error: true,
      discountAmount: 0,
      discountLabel: "ส่วนลดสินค้า",
      eligibleProductIds,
      scope: promotion.scope,
      title: promotion.title,
    };
  }

  if (
    promotion.scope === "bundle" &&
    !eligibleProductIds.every((productId) => cartProductIds.has(productId))
  ) {
    return {
      message: "เพิ่มคุกกี้และชานมให้ครบชุดเพื่อใช้คูปองนี้",
      error: true,
      discountAmount: 0,
      discountLabel: "ส่วนลดชุดสินค้า",
      eligibleProductIds,
      scope: promotion.scope,
      title: promotion.title,
    };
  }

  const eligibleTotal = items
    .filter((item) => eligibleProductIds.includes(item.productId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requestedDiscount =
    promotion.scope === "shipping"
      ? shippingFee
      : (promotion.discountAmount ?? 0);
  const discountAmount =
    promotion.scope === "product" || promotion.scope === "bundle"
      ? Math.min(requestedDiscount, eligibleTotal)
      : requestedDiscount;
  const discountLabel =
    promotion.scope === "shipping"
      ? "ส่วนลดค่าจัดส่ง"
      : promotion.scope === "bundle"
        ? "ส่วนลดชุดสินค้า"
        : promotion.scope === "product"
          ? "ส่วนลดสินค้า"
          : "ส่วนลดคูปองร้านค้า";

  return {
    code: promotion.code,
    message:
      promotion.scope === "shipping"
        ? "รับส่วนลดค่าจัดส่ง"
        : `${promotion.title} ใช้สำเร็จ`,
    error: false,
    discountAmount,
    discountLabel,
    scope: promotion.scope,
    eligibleProductIds,
    title: promotion.title,
  };
}

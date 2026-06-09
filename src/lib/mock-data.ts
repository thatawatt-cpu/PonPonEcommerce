import type { Category } from "@/types/common";
import type { Product } from "@/types/product";
import type { CustomerProfile } from "@/types/customer";
import type { Order, OrderTimelineStep } from "@/types/order";

export const categories: Category[] = [
  { id: "all", name: "ทั้งหมด", emoji: "🛍️" },
  { id: "snack", name: "ขนม", emoji: "🍪" },
  { id: "drink", name: "เครื่องดื่ม", emoji: "🥤" },
  { id: "fashion", name: "แฟชั่น", emoji: "👕" },
  { id: "beauty", name: "ความงาม", emoji: "💄" },
  { id: "gadget", name: "ของใช้", emoji: "🧸" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "คุกกี้เนยสดป๋องป๋อง",
    slug: "ponpon-butter-cookies",
    description:
      "คุกกี้เนยสดอบใหม่ทุกวัน หอมเนย กรอบนอกนุ่มใน บรรจุกล่องน่ารักสไตล์ Pon Pon เหมาะเป็นของฝากสุดๆ",
    price: 159,
    compareAtPrice: 199,
    imageUrl: "/images/products/product-1.png",
    emoji: "🍪",
    categoryId: "snack",
    categoryName: "ขนม",
    badges: ["ขายดี", "ลดราคา"],
    stock: 48,
    options: [
      {
        name: "size",
        label: "ขนาดกล่อง",
        choices: [
          { label: "เล็ก (6 ชิ้น)", value: "small" },
          { label: "ใหญ่ (12 ชิ้น)", value: "large" },
        ],
      },
    ],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "2",
    name: "ชานมไข่มุกป๋องป๋อง",
    slug: "ponpon-milk-tea",
    description:
      "ชานมรสเข้มข้น หวานกำลังดี พร้อมไข่มุกหนึบเคี้ยวเพลิน ชงสดทุกแก้ว เลือกระดับความหวานได้",
    price: 65,
    imageUrl: "/images/products/product-2.png",
    emoji: "🧋",
    categoryId: "drink",
    categoryName: "เครื่องดื่ม",
    badges: ["ขายดี"],
    stock: 120,
    options: [
      {
        name: "sweetness",
        label: "ระดับความหวาน",
        choices: [
          { label: "หวานน้อย", value: "less" },
          { label: "หวานปกติ", value: "normal" },
          { label: "หวานมาก", value: "more" },
        ],
      },
    ],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "3",
    name: "เสื้อยืดลาย Pon Pon",
    slug: "ponpon-tee",
    description:
      "เสื้อยืดคอตตอน 100% นุ่มใส่สบาย พิมพ์ลายมาสคอต Pon Pon สุดน่ารัก ใส่ได้ทั้งหญิงและชาย",
    price: 290,
    compareAtPrice: 350,
    imageUrl: "/images/products/product-3.png",
    emoji: "👕",
    categoryId: "fashion",
    categoryName: "แฟชั่น",
    badges: ["มาใหม่", "ลดราคา"],
    stock: 30,
    options: [
      {
        name: "size",
        label: "ไซซ์",
        choices: [
          { label: "S", value: "s" },
          { label: "M", value: "m" },
          { label: "L", value: "l" },
          { label: "XL", value: "xl" },
        ],
      },
      {
        name: "color",
        label: "สี",
        choices: [
          { label: "ขาว", value: "white" },
          { label: "แดง", value: "red" },
          { label: "ดำ", value: "black" },
        ],
      },
    ],
    isFeatured: true,
    isBestSeller: false,
  },
  {
    id: "4",
    name: "ลิปทินต์ป๋องป๋อง",
    slug: "ponpon-lip-tint",
    description:
      "ลิปทินต์เนื้อบางเบา ติดทนนาน ให้สีแดงสดใสสไตล์เกาหลี ไม่ตกร่อง บำรุงริมฝีปากด้วยวิตามินอี",
    price: 219,
    imageUrl: "/images/products/product-4.png",
    emoji: "💄",
    categoryId: "beauty",
    categoryName: "ความงาม",
    badges: ["แนะนำ", "มาใหม่"],
    stock: 64,
    options: [
      {
        name: "shade",
        label: "เฉดสี",
        choices: [
          { label: "Cherry Red", value: "cherry" },
          { label: "Coral Pink", value: "coral" },
          { label: "Rose Brown", value: "rose" },
        ],
      },
    ],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    id: "5",
    name: "ตุ๊กตาหมีป๋องป๋อง",
    slug: "ponpon-teddy",
    description:
      "ตุ๊กตาหมีขนนุ่มฟู กอดสบาย ขนาดกำลังดี เป็นของขวัญสุดน่ารักในธีม Pon Pon",
    price: 459,
    imageUrl: "/images/products/product-1.png",
    emoji: "🧸",
    categoryId: "gadget",
    categoryName: "ของใช้",
    badges: ["แนะนำ"],
    stock: 18,
    isFeatured: false,
    isBestSeller: false,
  },
  {
    id: "6",
    name: "ขนมปังสังขยาใบเตย",
    slug: "ponpon-pandan-bread",
    description:
      "ขนมปังนุ่มสอดไส้สังขยาใบเตยหอมหวาน ทำสดใหม่ หอมกลิ่นใบเตยแท้",
    price: 89,
    imageUrl: "/images/products/product-2.png",
    emoji: "🍞",
    categoryId: "snack",
    categoryName: "ขนม",
    badges: ["ขายดี"],
    stock: 75,
    isFeatured: false,
    isBestSeller: true,
  },
  {
    id: "7",
    name: "กาแฟสดป๋องป๋อง",
    slug: "ponpon-coffee",
    description:
      "กาแฟอาราบิก้าคั่วกลาง กลมกล่อม หอมละมุน เลือกร้อน/เย็นได้ตามใจ",
    price: 75,
    imageUrl: "/images/products/product-3.png",
    emoji: "☕",
    categoryId: "drink",
    categoryName: "เครื่องดื่ม",
    badges: ["แนะนำ"],
    stock: 90,
    options: [
      {
        name: "temp",
        label: "ร้อน / เย็น",
        choices: [
          { label: "ร้อน", value: "hot" },
          { label: "เย็น", value: "iced" },
        ],
      },
    ],
    isFeatured: true,
    isBestSeller: false,
  },
  {
    id: "8",
    name: "กระเป๋าผ้า Pon Pon",
    slug: "ponpon-tote-bag",
    description:
      "กระเป๋าผ้าแคนวาสหนา ทนทาน ใส่ของได้เยอะ พิมพ์ลายมาสคอตสุดคิวต์ รักษ์โลกสุดๆ",
    price: 199,
    imageUrl: "/images/products/product-4.png",
    emoji: "👜",
    categoryId: "fashion",
    categoryName: "แฟชั่น",
    badges: ["มาใหม่"],
    stock: 40,
    isFeatured: false,
    isBestSeller: false,
  },
];

export const mockCustomerProfile: CustomerProfile = {
  displayName: "Pon Pon Customer",
  lineUserId: "Uxxxxxxxxxxxxxxxx",
  pictureUrl: "/images/mock-avatar.png",
};

/**
 * Reusable timeline factory. Given the current status, marks earlier steps as
 * completed, the current one active, and later ones pending.
 */
export const mockOrderTimeline: OrderTimelineStep[] = [
  { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "8 มิ.ย. 2026 10:24" },
  { key: "reviewing_payment", label: "รอตรวจสอบสลิป", state: "active", at: "8 มิ.ย. 2026 10:31" },
  { key: "paid", label: "ชำระเงินแล้ว", state: "pending" },
  { key: "preparing", label: "กำลังเตรียมสินค้า", state: "pending" },
  { key: "shipped", label: "จัดส่งแล้ว", state: "pending" },
  { key: "completed", label: "สำเร็จ", state: "pending" },
];

export const mockOrders: Order[] = [
  {
    id: "o-001",
    orderNo: "ORD001",
    customerName: "Pon Pon Customer",
    phone: "081-234-5678",
    address: "123/45 หมู่บ้านน่ารัก ถ.สุขใจ แขวงป๋องป๋อง เขตยิ้มแย้ม กรุงเทพฯ 10110",
    note: "ฝากวางไว้หน้าบ้านได้เลยค่ะ",
    items: [
      {
        productId: "1",
        name: "คุกกี้เนยสดป๋องป๋อง",
        price: 159,
        imageUrl: "/images/products/product-1.png",
        emoji: "🍪",
        quantity: 2,
        selectedOptions: { size: "large" },
      },
      {
        productId: "2",
        name: "ชานมไข่มุกป๋องป๋อง",
        price: 65,
        imageUrl: "/images/products/product-2.png",
        emoji: "🧋",
        quantity: 1,
        selectedOptions: { sweetness: "less" },
      },
    ],
    subtotal: 383,
    shippingFee: 40,
    total: 423,
    paymentMethod: "promptpay",
    paymentStatus: "reviewing",
    orderStatus: "reviewing_payment",
    timeline: mockOrderTimeline,
    createdAt: "2026-06-08T10:24:00+07:00",
  },
  {
    id: "o-002",
    orderNo: "ORD002",
    customerName: "Pon Pon Customer",
    phone: "081-234-5678",
    address: "123/45 หมู่บ้านน่ารัก ถ.สุขใจ แขวงป๋องป๋อง เขตยิ้มแย้ม กรุงเทพฯ 10110",
    items: [
      {
        productId: "4",
        name: "ลิปทินต์ป๋องป๋อง",
        price: 219,
        imageUrl: "/images/products/product-4.png",
        emoji: "💄",
        quantity: 1,
        selectedOptions: { shade: "cherry" },
      },
    ],
    subtotal: 219,
    shippingFee: 40,
    total: 259,
    paymentMethod: "cod",
    paymentStatus: "paid",
    orderStatus: "shipped",
    timeline: [
      { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "5 มิ.ย. 2026 09:10" },
      { key: "reviewing_payment", label: "รอตรวจสอบสลิป", state: "completed", at: "5 มิ.ย. 2026 09:12" },
      { key: "paid", label: "ชำระเงินแล้ว", state: "completed", at: "5 มิ.ย. 2026 11:00" },
      { key: "preparing", label: "กำลังเตรียมสินค้า", state: "completed", at: "6 มิ.ย. 2026 14:20" },
      { key: "shipped", label: "จัดส่งแล้ว", state: "active", at: "7 มิ.ย. 2026 08:45" },
      { key: "completed", label: "สำเร็จ", state: "pending" },
    ],
    createdAt: "2026-06-05T09:10:00+07:00",
  },
];

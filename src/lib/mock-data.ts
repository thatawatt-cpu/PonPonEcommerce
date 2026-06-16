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
    imageUrl: "/images/products/cookies.png",
    gallery: [
      {
        id: "pair-milk-tea",
        label: "ทานคู่ชานม",
        imageUrl: "/images/products/milk-tea.png",
      },
      {
        id: "gift-set",
        label: "เซ็ตของฝาก",
        imageUrl: "/images/products/teddy.png",
      },
      {
        id: "coffee-pair",
        label: "คู่กาแฟ",
        imageUrl: "/images/products/coffee.png",
      },
      {
        id: "carry-gift",
        label: "แพ็กใส่ถุง",
        imageUrl: "/images/products/tote-bag.png",
      },
    ],
    emoji: "🍪",
    categoryId: "snack",
    categoryName: "ขนม",
    badges: ["ขายดี", "ลดราคา"],
    stock: 48,
    soldCount: 23000,
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
    imageUrl: "/images/products/milk-tea.png",
    gallery: [
      {
        id: "pair-cookie",
        label: "ทานคู่คุกกี้",
        imageUrl: "/images/products/cookies.png",
      },
      {
        id: "drink-menu",
        label: "เมนูเครื่องดื่ม",
        imageUrl: "/images/products/coffee.png",
      },
    ],
    detailContent: {
      title: "รายละเอียดสินค้า",
      summary:
        "ชานมรสเข้มข้น หวานกำลังดี พร้อมไข่มุกหนึบเคี้ยวเพลิน ชงสดทุกแก้ว เลือกระดับความหวานได้",
      highlights: [
        "ชงสดตามออเดอร์",
        "เลือกระดับความหวานได้",
        "แนะนำดื่มภายในวันที่ได้รับ",
      ],
      infoCards: [
        { label: "เหมาะสำหรับ", value: "ซื้อใช้เองหรือเป็นของฝาก" },
        { label: "การจัดส่ง", value: "แพ็กกันกระแทกก่อนส่งทุกออเดอร์" },
      ],
      sections: [
        {
          title: "วิธีเก็บรักษา",
          body: "ควรดื่มทันทีหลังได้รับสินค้า หากยังไม่ดื่มให้เก็บในตู้เย็นและหลีกเลี่ยงแสงแดดโดยตรง",
          bullets: ["เขย่าก่อนดื่ม", "แยกน้ำแข็งเมื่อจัดส่งระยะไกลได้", "เหมาะสำหรับดื่มภายในวันเดียวกัน"],
        },
        {
          title: "หมายเหตุการจัดส่ง",
          body: "ร้านจะแพ็กแก้วและฝาให้แน่นหนา พร้อมกันกระแทกก่อนส่งทุกออเดอร์",
        },
      ],
    },
    emoji: "🧋",
    categoryId: "drink",
    categoryName: "เครื่องดื่ม",
    badges: ["ขายดี"],
    stock: 120,
    soldCount: 18000,
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
    imageUrl: "/images/products/tshirt.png",
    emoji: "👕",
    categoryId: "fashion",
    categoryName: "แฟชั่น",
    badges: ["มาใหม่", "ลดราคา"],
    stock: 30,
    soldCount: 860,
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
          {
            label: "ขาว",
            value: "white",
            imageUrl: "/images/products/tshirt.png",
            swatchColor: "#f5f2eb",
          },
          {
            label: "แดง",
            value: "red",
            imageUrl: "/images/products/tshirt.png",
            swatchColor: "#d92830",
          },
          {
            label: "ดำ",
            value: "black",
            imageUrl: "/images/products/tshirt.png",
            swatchColor: "#202124",
          },
        ],
      },
    ],
    variants: [
      { options: { size: "s", color: "white" }, stock: 0 },
      { options: { size: "s", color: "red" }, stock: 3 },
      { options: { size: "s", color: "black" }, stock: 2 },
      { options: { size: "m", color: "white" }, stock: 4 },
      { options: { size: "m", color: "red" }, stock: 6 },
      { options: { size: "m", color: "black" }, stock: 5 },
      { options: { size: "l", color: "white" }, stock: 4 },
      { options: { size: "l", color: "red" }, stock: 3 },
      { options: { size: "l", color: "black" }, stock: 2 },
      { options: { size: "xl", color: "white" }, stock: 1 },
      { options: { size: "xl", color: "red" }, stock: 0 },
      { options: { size: "xl", color: "black" }, stock: 0 },
    ],
    isFeatured: true,
    isBestSeller: false,
  },
  {
    id: "9",
    name: "เสื้อยืด Pon Pon รุ่นหมดสต็อก",
    slug: "ponpon-tee-sold-out",
    description:
      "เสื้อยืดคอตตอนรุ่นตัวอย่างสำหรับแสดงสถานะสินค้าหมดทุกสีและทุกไซซ์",
    price: 290,
    compareAtPrice: 350,
    imageUrl: "/images/products/tshirt.png",
    emoji: "👕",
    categoryId: "fashion",
    categoryName: "แฟชั่น",
    badges: ["ลดราคา"],
    stock: 0,
    soldCount: 210,
    options: [
      {
        name: "size",
        label: "ไซซ์",
        choices: [
          { label: "S", value: "s" },
          { label: "M", value: "m" },
        ],
      },
      {
        name: "color",
        label: "สี",
        choices: [
          {
            label: "ขาว",
            value: "white",
            imageUrl: "/images/products/tshirt.png",
            swatchColor: "#f5f2eb",
          },
          {
            label: "แดง",
            value: "red",
            imageUrl: "/images/products/tshirt.png",
            swatchColor: "#d92830",
          },
        ],
      },
    ],
    variants: [
      { options: { size: "s", color: "white" }, stock: 0 },
      { options: { size: "s", color: "red" }, stock: 0 },
      { options: { size: "m", color: "white" }, stock: 0 },
      { options: { size: "m", color: "red" }, stock: 0 },
    ],
    isFeatured: false,
    isBestSeller: false,
  },
  {
    id: "4",
    name: "ลิปทินต์ป๋องป๋อง",
    slug: "ponpon-lip-tint",
    description:
      "ลิปทินต์เนื้อบางเบา ติดทนนาน ให้สีแดงสดใสสไตล์เกาหลี ไม่ตกร่อง บำรุงริมฝีปากด้วยวิตามินอี",
    price: 219,
    imageUrl: "/images/products/lip-tint.png",
    emoji: "💄",
    categoryId: "beauty",
    categoryName: "ความงาม",
    badges: ["แนะนำ", "มาใหม่"],
    stock: 64,
    soldCount: 5200,
    options: [
      {
        name: "shade",
        label: "เฉดสี",
        choices: [
          {
            label: "Cherry Red",
            value: "cherry",
            imageUrl: "/images/products/lip-tint.png",
            swatchColor: "#c91f37",
          },
          {
            label: "Coral Pink",
            value: "coral",
            imageUrl: "/images/products/lip-tint.png",
            swatchColor: "#f47b78",
          },
          {
            label: "Rose Brown",
            value: "rose",
            imageUrl: "/images/products/lip-tint.png",
            swatchColor: "#8b4b47",
          },
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
    imageUrl: "/images/products/teddy.png",
    emoji: "🧸",
    categoryId: "gadget",
    categoryName: "ของใช้",
    badges: ["แนะนำ"],
    stock: 18,
    soldCount: 430,
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
    imageUrl: "/images/products/pandan-bread.png",
    emoji: "🍞",
    categoryId: "snack",
    categoryName: "ขนม",
    badges: ["ขายดี"],
    stock: 75,
    soldCount: 3900,
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
    imageUrl: "/images/products/coffee.png",
    emoji: "☕",
    categoryId: "drink",
    categoryName: "เครื่องดื่ม",
    badges: ["แนะนำ"],
    stock: 90,
    soldCount: 1500,
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
    imageUrl: "/images/products/tote-bag.png",
    emoji: "👜",
    categoryId: "fashion",
    categoryName: "แฟชั่น",
    badges: ["มาใหม่"],
    stock: 40,
    soldCount: 720,
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
  { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "8 มิ.ย. 2569 10:24" },
  { key: "reviewing_payment", label: "รอตรวจสอบการชำระเงิน", state: "active", at: "8 มิ.ย. 2569 10:31" },
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
        imageUrl: "/images/products/cookies.png",
        emoji: "🍪",
        quantity: 2,
        selectedOptions: { size: "large" },
      },
      {
        productId: "2",
        name: "ชานมไข่มุกป๋องป๋อง",
        price: 65,
        imageUrl: "/images/products/milk-tea.png",
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
        imageUrl: "/images/products/lip-tint.png",
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
      { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "5 มิ.ย. 2569 09:10" },
      { key: "reviewing_payment", label: "รอตรวจสอบการชำระเงิน", state: "completed", at: "5 มิ.ย. 2569 09:12" },
      { key: "paid", label: "ชำระเงินแล้ว", state: "completed", at: "5 มิ.ย. 2569 11:00" },
      { key: "preparing", label: "กำลังเตรียมสินค้า", state: "completed", at: "6 มิ.ย. 2569 14:20" },
      { key: "shipped", label: "จัดส่งแล้ว", state: "active", at: "7 มิ.ย. 2569 08:45" },
      { key: "completed", label: "สำเร็จ", state: "pending" },
    ],
    createdAt: "2026-06-05T09:10:00+07:00",
  },
  {
    id: "o-003",
    orderNo: "ORD003",
    customerName: "Pon Pon Customer",
    phone: "081-234-5678",
    address: "123/45 หมู่บ้านน่ารัก ถ.สุขใจ แขวงป๋องป๋อง เขตยิ้มแย้ม กรุงเทพฯ 10110",
    items: [
      {
        productId: "5",
        name: "ตุ๊กตาหมีป๋องป๋อง",
        price: 459,
        imageUrl: "/images/products/teddy.png",
        emoji: "🧸",
        quantity: 1,
      },
    ],
    subtotal: 459,
    shippingFee: 40,
    total: 499,
    paymentMethod: "promptpay",
    paymentStatus: "paid",
    orderStatus: "completed",
    timeline: [
      { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "28 พ.ค. 2569 13:15" },
      { key: "reviewing_payment", label: "รอตรวจสอบการชำระเงิน", state: "completed", at: "28 พ.ค. 2569 13:20" },
      { key: "paid", label: "ชำระเงินแล้ว", state: "completed", at: "28 พ.ค. 2569 14:05" },
      { key: "preparing", label: "กำลังเตรียมสินค้า", state: "completed", at: "29 พ.ค. 2569 10:30" },
      { key: "shipped", label: "จัดส่งแล้ว", state: "completed", at: "30 พ.ค. 2569 09:20" },
      { key: "completed", label: "สำเร็จ", state: "active", at: "31 พ.ค. 2569 16:45" },
    ],
    createdAt: "2026-05-28T13:15:00+07:00",
  },
  {
    id: "o-004",
    orderNo: "ORD004",
    customerName: "Pon Pon Customer",
    phone: "081-234-5678",
    address: "123/45 หมู่บ้านน่ารัก ถ.สุขใจ แขวงป๋องป๋อง เขตยิ้มแย้ม กรุงเทพฯ 10110",
    items: [
      {
        productId: "8",
        name: "กระเป๋าผ้า Pon Pon",
        price: 199,
        imageUrl: "/images/products/tote-bag.png",
        emoji: "👜",
        quantity: 1,
      },
    ],
    subtotal: 199,
    shippingFee: 40,
    total: 239,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "cancelled",
    timeline: [
      { key: "pending", label: "สร้างคำสั่งซื้อ", state: "completed", at: "20 พ.ค. 2569 18:42" },
      { key: "cancelled", label: "ยกเลิก", state: "active", at: "20 พ.ค. 2569 19:10" },
    ],
    createdAt: "2026-05-20T18:42:00+07:00",
  },
];

import { notFound } from "next/navigation";
import { getProductBySlugServer } from "@/features/products/product-service.server";
import { ProductDetailClient } from "./product-detail-client";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const product = await getProductBySlugServer(slug);

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}

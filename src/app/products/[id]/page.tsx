import { notFound } from "next/navigation";
import {
  getProductByIdServer,
  getProductBySlugServer,
} from "@/features/products/product-service.server";
import { ProductDetailClient } from "./product-detail-client";

function parseInitialOptions(value?: string): Record<string, string> | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, optionValue]) => typeof optionValue === "string")
        .map(([name, optionValue]) => [name, optionValue as string])
    );
  } catch {
    return null;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    cartItemKey?: string;
    options?: string;
    quantity?: string;
  }>;
}) {
  const { id } = await params;
  const { cartItemKey, options, quantity } = await searchParams;
  const product = isUuid(id)
    ? await getProductByIdServer(id)
    : (await getProductBySlugServer(id)) ?? (await getProductByIdServer(id));

  if (!product) notFound();

  return (
    <ProductDetailClient
      product={product}
      cartEditItemKey={cartItemKey}
      initialQuantity={quantity ? Number(quantity) : undefined}
      initialSelectedOptions={parseInitialOptions(options) ?? undefined}
    />
  );
}

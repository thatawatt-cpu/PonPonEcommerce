"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  CustomerAddress,
  CustomerAddressCreateRequest,
} from "@/lib/address-storage";

async function readAddressJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function readAddressError(response: Response, fallback: string) {
  const err = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  return err?.message ?? err?.error ?? `${fallback} (${response.status})`;
}

export async function fetchCustomerAddresses(): Promise<CustomerAddress[]> {
  const response = await ponponFetch("/api/customer-addresses", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await readAddressError(response, "Load addresses failed"));
  }

  return response.json();
}

export async function createCustomerAddress(
  body: CustomerAddressCreateRequest
): Promise<CustomerAddress | null> {
  const response = await ponponFetch("/api/customer-addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readAddressError(response, "Create address failed"));
  }

  return readAddressJson<CustomerAddress>(response);
}

export async function updateCustomerAddress(
  id: string,
  body: CustomerAddressCreateRequest
): Promise<CustomerAddress | null> {
  const response = await ponponFetch(
    `/api/customer-addresses/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(await readAddressError(response, "Update address failed"));
  }

  return readAddressJson<CustomerAddress>(response);
}

export async function deleteCustomerAddress(id: string): Promise<void> {
  const response = await ponponFetch(
    `/api/customer-addresses/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(await readAddressError(response, "Delete address failed"));
  }
}

export async function setDefaultCustomerAddress(
  id: string
): Promise<CustomerAddress | null> {
  const response = await ponponFetch(
    `/api/customer-addresses/${encodeURIComponent(id)}/default`,
    {
      method: "PUT",
    }
  );

  if (!response.ok) {
    throw new Error(
      await readAddressError(response, "Set default address failed")
    );
  }

  return readAddressJson<CustomerAddress>(response);
}

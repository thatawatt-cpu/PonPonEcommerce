import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

function buildHeaders(auth: string | null, hasBody = false): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    headers.Authorization = auth;
  }

  return headers;
}

function unauthorizedOrWarn(auth: string | null) {
  if (auth) return null;
  if (!SKIP_AUTH) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.warn(
    "[customer-addresses] NEXT_PUBLIC_SKIP_LINE_LIFF=true; forwarding without Authorization"
  );
  return null;
}

async function toProxyResponse(response: Response) {
  const body = await response.text().catch(() => "");

  if (!body || response.status === 204) {
    return new NextResponse(null, { status: response.status });
  }

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function forwardCustomerAddressRequest(
  request: NextRequest,
  path: string,
  init: { method?: string; body?: BodyInit | null } = {}
) {
  const auth = request.headers.get("Authorization");
  const unauthorized = unauthorizedOrWarn(auth);
  if (unauthorized) return unauthorized;

  try {
    const response = await fetch(`${PONPON_BACKEND_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: buildHeaders(auth, init.body !== undefined),
      body: init.body,
      cache: "no-store",
    });

    return toProxyResponse(response);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

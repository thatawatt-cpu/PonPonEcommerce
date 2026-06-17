import { NextResponse } from "next/server";
import { PONPON_AUTH_BACKEND_ME_URL } from "@/lib/server/auth-backend";

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim() || null;
}

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization Bearer token." },
      { status: 401 }
    );
  }

  const backendResponse = await fetch(PONPON_AUTH_BACKEND_ME_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const responseText = await backendResponse.clone().text();

  console.info("[ponpon-auth] me response", {
    status: backendResponse.status,
    contentType,
    body: responseText.slice(0, 500),
  });

  if (contentType.includes("application/json")) {
    const json = await backendResponse.json().catch(() => null);
    return NextResponse.json(json, { status: backendResponse.status });
  }

  return new NextResponse(responseText, {
    status: backendResponse.status,
    headers: {
      "content-type": contentType || "text/plain; charset=utf-8",
    },
  });
}

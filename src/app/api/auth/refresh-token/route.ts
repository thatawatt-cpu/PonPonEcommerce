import { NextResponse } from "next/server";
import { PONPON_AUTH_BACKEND_REFRESH_URL } from "@/lib/server/auth-backend";

type RefreshBody = {
  refreshToken?: string;
};

export async function POST(request: Request) {
  let body: RefreshBody;

  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body.refreshToken) {
    return NextResponse.json(
      { error: "Missing refreshToken." },
      { status: 400 }
    );
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(PONPON_AUTH_BACKEND_REFRESH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refreshToken: body.refreshToken,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[ponpon-auth] refresh backend fetch failed", error);
    return NextResponse.json(
      { error: "Failed to reach auth backend." },
      { status: 502 }
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const responseText = await backendResponse.clone().text();
  console.info("[ponpon-auth] refresh backend response", {
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

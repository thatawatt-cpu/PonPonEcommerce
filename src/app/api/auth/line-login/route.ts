import { NextResponse } from "next/server";
import { PONPON_AUTH_BACKEND_URL } from "@/lib/server/auth-backend";

type LoginBody = {
  idToken?: string;
  accessToken?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body.idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  console.info("[ponpon-auth] proxying line-login request", {
    backend: PONPON_AUTH_BACKEND_URL,
  });

  let backendResponse: Response;

  try {
    backendResponse = await fetch(PONPON_AUTH_BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        idToken: body.idToken,
        accessToken: body.accessToken,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[ponpon-auth] backend fetch failed", error);
    return NextResponse.json(
      { error: "Failed to reach auth backend." },
      { status: 502 }
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const responseText = await backendResponse.clone().text();
  console.info("[ponpon-auth] backend response", {
    status: backendResponse.status,
    contentType,
    body: responseText.slice(0, 500),
  });

  if (contentType.includes("application/json")) {
    const json = await backendResponse.json().catch(() => null);
    return NextResponse.json(json, { status: backendResponse.status });
  }

  const text = await backendResponse.text();
  return new NextResponse(text, {
    status: backendResponse.status,
    headers: {
      "content-type": contentType || "text/plain; charset=utf-8",
    },
  });
}

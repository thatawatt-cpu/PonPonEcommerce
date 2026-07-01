import { NextRequest, NextResponse } from "next/server";

function isAllowedQrUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "api.omise.co";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl || !isAllowedQrUrl(imageUrl)) {
    return NextResponse.json({ message: "Invalid QR image URL" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, { cache: "no-store" });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { message: "QR image request failed" },
        { status: response.status || 502 }
      );
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("Content-Type") ?? "image/png",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "QR image request failed" },
      { status: 502 }
    );
  }
}

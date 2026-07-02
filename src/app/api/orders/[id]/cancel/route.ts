import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

async function readBackendError(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  return {
    message:
      data?.message ??
      data?.error ??
      `Order cancel request failed (${response.status})`,
  };
}

interface CancelOrderRequest {
  reason?: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.warn(
      "[orders/cancel] NEXT_PUBLIC_SKIP_LINE_LIFF=true; cancelling order without Authorization"
    );
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | CancelOrderRequest
    | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json(
      { message: "กรุณาเลือกเหตุผลในการยกเลิกออเดอร์" },
      { status: 400 }
    );
  }

  if (reason.length > 1000) {
    return NextResponse.json(
      { message: "รายละเอียดเหตุผลยาวเกินกำหนด" },
      { status: 400 }
    );
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (auth) headers.Authorization = auth;

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/orders/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
        cache: "no-store",
      }
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    if (response.ok) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("Content-Type") ?? "application/json",
        },
      });
    }

    return NextResponse.json(await readBackendError(response), {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 502 }
    );
  }
}

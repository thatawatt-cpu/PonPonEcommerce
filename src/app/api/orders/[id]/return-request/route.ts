import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";
const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function readBackendError(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { message?: string; error?: string; title?: string; detail?: string }
    | null;

  return {
    message:
      data?.message ??
      data?.error ??
      data?.detail ??
      data?.title ??
      `Return request failed (${response.status})`,
  };
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof File !== "undefined" && value instanceof File;
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
      "[orders/return-request] NEXT_PUBLIC_SKIP_LINE_LIFF=true; creating return request without Authorization"
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { message: "กรุณาส่งข้อมูลแบบ multipart/form-data" },
      { status: 400 }
    );
  }

  const reasonValue = formData.get("reason");
  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";
  const photos = formData
    .getAll("photos")
    .filter((value): value is File => isFile(value) && value.size > 0);

  if (!reason || reason.length > 2000) {
    return NextResponse.json(
      { message: "กรุณาระบุเหตุผลในการขอคืนสินค้าไม่เกิน 2000 ตัวอักษร" },
      { status: 400 }
    );
  }

  if (photos.length < 1 || photos.length > MAX_PHOTOS) {
    return NextResponse.json(
      { message: `กรุณาแนบรูปประกอบ 1-${MAX_PHOTOS} รูป` },
      { status: 400 }
    );
  }

  const invalidPhoto = photos.find(
    (photo) =>
      photo.size > MAX_PHOTO_SIZE || !ALLOWED_PHOTO_TYPES.has(photo.type)
  );
  if (invalidPhoto) {
    return NextResponse.json(
      { message: "รองรับเฉพาะไฟล์ JPEG, PNG, WebP และไม่เกิน 10 MB ต่อรูป" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const backendFormData = new FormData();
  backendFormData.append("reason", reason);
  for (const photo of photos) {
    backendFormData.append("photos", photo, photo.name);
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (auth) headers.Authorization = auth;

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/orders/${encodeURIComponent(
        id
      )}/return-request`,
      {
        method: "POST",
        headers,
        body: backendFormData,
        cache: "no-store",
      }
    );

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
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

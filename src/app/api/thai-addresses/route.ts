import { NextRequest, NextResponse } from "next/server";
import provinceRows from "province/dist/provinces.js";

export const runtime = "nodejs";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "th")
  );
}

export async function GET(request: NextRequest) {
  const province = request.nextUrl.searchParams.get("province")?.trim() ?? "";
  const district = request.nextUrl.searchParams.get("district")?.trim() ?? "";

  if (!province) {
    return NextResponse.json(
      { items: uniqueSorted(provinceRows.map((item) => item.city_th)) },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  const addresses = provinceRows.filter((item) => item.city_th === province);

  if (!district) {
    return NextResponse.json(
      { items: uniqueSorted(addresses.map((item) => item.district_th)) },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  const subdistricts = addresses
    .filter((item) => item.district_th === district)
    .map((item) => ({
      name: item.subdistrict_th,
      postcode: String(item.zip),
    }))
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) =>
            candidate.name === item.name &&
            candidate.postcode === item.postcode
        ) === index
    )
    .sort((left, right) => left.name.localeCompare(right.name, "th"));

  return NextResponse.json(
    { items: subdistricts },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}

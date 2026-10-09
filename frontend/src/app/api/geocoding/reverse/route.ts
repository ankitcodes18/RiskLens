import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { LocationSource } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const source = (searchParams.get("source") as LocationSource) || "gps";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon parameter" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinate bounds" }, { status: 400 });
  }

  try {
    const location = await reverseGeocode(lat, lon, source);
    return NextResponse.json({ location });
  } catch (error) {
    console.error("Reverse geocoding API route error:", error);
    return NextResponse.json({ error: "Failed to reverse geocode coordinates" }, { status: 500 });
  }
}

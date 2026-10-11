import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { fetchAreaComparisons } from "@/lib/services/area-comparison.service";
import { MeasurementUnit } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const units = (searchParams.get("units") as MeasurementUnit) || "metric";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  try {
    const location = await reverseGeocode(lat, lon);
    const areaData = await fetchAreaComparisons(location, units);
    return NextResponse.json(areaData);
  } catch (error) {
    console.error("Forecast areas API error:", error);
    return NextResponse.json({ error: "Failed to fetch area comparison data" }, { status: 500 });
  }
}

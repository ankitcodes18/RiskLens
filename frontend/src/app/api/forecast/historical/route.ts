import { NextRequest, NextResponse } from "next/server";
import { fetchHistoricalWeatherData } from "@/lib/services/historical-provider.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const daysStr = searchParams.get("days") || "14";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const days = parseInt(daysStr, 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinate bounds" }, { status: 400 });
  }

  try {
    const historicalData = await fetchHistoricalWeatherData(lat, lon, days);
    return NextResponse.json(historicalData);
  } catch (err) {
    console.error("Historical forecast API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch historical weather baseline" },
      { status: 500 }
    );
  }
}

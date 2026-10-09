import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { fetchRawWeatherData } from "@/lib/services/weather-provider.service";
import { fetchOfficialAlerts } from "@/lib/services/alerts-provider.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  try {
    const location = await reverseGeocode(lat, lon);
    const weather = await fetchRawWeatherData(lat, lon);
    const alerts = await fetchOfficialAlerts(location, weather);

    return NextResponse.json({
      location,
      alerts,
      disclaimer:
        "Official warnings are sourced directly from meteorological and civil protection agencies. RiskLens analytical signals highlight extreme threshold exceedances.",
    });
  } catch (error) {
    console.error("Forecast alerts API error:", error);
    return NextResponse.json({ error: "Failed to fetch hazard alerts" }, { status: 500 });
  }
}

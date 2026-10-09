import { NextRequest, NextResponse } from "next/server";
import { fetchRawWeatherData, formatDailyForecast } from "@/lib/services/weather-provider.service";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { MeasurementUnit } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const units = (searchParams.get("units") as MeasurementUnit) || "metric";
  const days = parseInt(searchParams.get("days") || "14", 10);

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  try {
    const location = await reverseGeocode(lat, lon);
    const weather = await fetchRawWeatherData(lat, lon);
    const dailyForecast = formatDailyForecast(weather, units, days);

    return NextResponse.json({
      location,
      units,
      days: dailyForecast,
    });
  } catch (error) {
    console.error("Daily forecast API error:", error);
    return NextResponse.json({ error: "Failed to fetch daily forecast" }, { status: 500 });
  }
}

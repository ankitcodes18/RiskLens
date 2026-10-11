import { NextRequest, NextResponse } from "next/server";
import { fetchRawWeatherData, formatHourlyForecast } from "@/lib/services/weather-provider.service";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { HourlyForecastResponse, MeasurementUnit } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const units = (searchParams.get("units") as MeasurementUnit) || "metric";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  try {
    const location = await reverseGeocode(lat, lon);
    const weather = await fetchRawWeatherData(lat, lon);
    const hours = formatHourlyForecast(weather, dateStr, units);

    const response: HourlyForecastResponse = {
      date: dateStr,
      location,
      hours,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Hourly forecast API error:", error);
    return NextResponse.json({ error: "Failed to fetch hourly forecast" }, { status: 500 });
  }
}

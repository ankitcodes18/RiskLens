import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { fetchRawWeatherData } from "@/lib/services/weather-provider.service";
import { fetchFloodData } from "@/lib/services/flood-provider.service";
import { fetchTimeSeriesData } from "@/lib/services/timeseries.service";
import { MeasurementUnit } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const range = (searchParams.get("range") as "7d" | "30d" | "3m") || "7d";
  const units = (searchParams.get("units") as MeasurementUnit) || "metric";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  try {
    const location = await reverseGeocode(lat, lon);
    const weather = await fetchRawWeatherData(lat, lon);
    const flood = await fetchFloodData(lat, lon);

    const tsData = await fetchTimeSeriesData(location, weather, flood, range, units);
    return NextResponse.json(tsData);
  } catch (error) {
    console.error("Forecast timeseries API error:", error);
    return NextResponse.json({ error: "Failed to generate forecast timeseries" }, { status: 500 });
  }
}

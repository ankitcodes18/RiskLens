import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { fetchRawWeatherData } from "@/lib/services/weather-provider.service";
import { getMapLayersData } from "@/lib/services/map-layers.service";

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
    const mapData = await getMapLayersData(location, weather);
    return NextResponse.json(mapData);
  } catch (error) {
    console.error("Map layers API error:", error);
    return NextResponse.json({ error: "Failed to fetch map layers data" }, { status: 500 });
  }
}

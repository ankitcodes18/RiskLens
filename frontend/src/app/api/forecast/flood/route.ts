import { NextRequest, NextResponse } from "next/server";
import { fetchFloodData } from "@/lib/services/flood-provider.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinate bounds" }, { status: 400 });
  }

  try {
    const floodData = await fetchFloodData(lat, lon);
    return NextResponse.json(floodData);
  } catch (err) {
    console.error("Flood API route error:", err);
    return NextResponse.json(
      { error: "Failed to fetch river discharge flood telemetry" },
      { status: 500 }
    );
  }
}

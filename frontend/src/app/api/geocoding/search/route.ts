import { NextRequest, NextResponse } from "next/server";
import { searchLocations } from "@/lib/services/geocoding.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ locations: [] });
  }

  try {
    const locations = await searchLocations(q);
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Geocoding search API route error:", error);
    return NextResponse.json({ error: "Failed to perform location search" }, { status: 500 });
  }
}

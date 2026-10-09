import { serverCache } from "@/lib/cache";

export interface FloodProviderData {
  daily?: {
    time: string[];
    river_discharge?: number[];
    river_discharge_median?: number[];
    river_discharge_max?: number[];
  };
  isAvailable: boolean;
  notes?: string;
}

export async function fetchFloodData(lat: number, lon: number): Promise<FloodProviderData> {
  const cacheKey = `flood_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = serverCache.get<FloodProviderData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_median,river_discharge_max&forecast_days=14`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.daily && data.daily.river_discharge && data.daily.river_discharge.length > 0) {
        const result: FloodProviderData = {
          daily: data.daily,
          isAvailable: true,
        };
        serverCache.set(cacheKey, result, 3600);
        return result;
      }
    }
  } catch (err) {
    console.error("Open-Meteo flood API fetch error:", err);
  }

  const fallback: FloodProviderData = {
    isAvailable: false,
    notes: "River discharge model is not active for this specific catchment coordinate.",
  };
  serverCache.set(cacheKey, fallback, 3600);
  return fallback;
}

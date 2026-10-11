import { serverCache } from "@/lib/cache";

export interface HistoricalProviderData {
  time: string[];
  tempMax: number[];
  tempMin: number[];
  precipSum: number[];
  isAvailable: boolean;
  notes?: string;
}

export async function fetchHistoricalWeatherData(
  lat: number,
  lon: number,
  days = 14
): Promise<HistoricalProviderData> {
  const cacheKey = `historical_${lat.toFixed(2)}_${lon.toFixed(2)}_${days}`;
  const cached = serverCache.get<HistoricalProviderData>(cacheKey);
  if (cached) return cached;

  try {
    // Determine date range for 1 year ago today
    const now = new Date();
    const endDateObj = new Date(now);
    endDateObj.setFullYear(now.getFullYear() - 1);
    endDateObj.setDate(endDateObj.getDate() + days - 1);

    const startDateObj = new Date(now);
    startDateObj.setFullYear(now.getFullYear() - 1);

    const startDate = startDateObj.toISOString().split("T")[0];
    const endDate = endDateObj.toISOString().split("T")[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24-hour cache
    if (res.ok) {
      const data = await res.json();
      if (data.daily && data.daily.time) {
        const result: HistoricalProviderData = {
          time: data.daily.time || [],
          tempMax: data.daily.temperature_2m_max || [],
          tempMin: data.daily.temperature_2m_min || [],
          precipSum: data.daily.precipitation_sum || [],
          isAvailable: true,
        };
        serverCache.set(cacheKey, result, 86400);
        return result;
      }
    }
  } catch (err) {
    console.error("Open-Meteo Historical Weather API error:", err);
  }

  const fallback: HistoricalProviderData = {
    time: [],
    tempMax: [],
    tempMin: [],
    precipSum: [],
    isAvailable: false,
    notes: "Historical climatological archive telemetry is unavailable for this coordinate range.",
  };
  serverCache.set(cacheKey, fallback, 3600);
  return fallback;
}

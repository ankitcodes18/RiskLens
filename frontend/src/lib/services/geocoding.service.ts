import { NormalizedLocation, LocationSource } from "@/types/forecast";
import { serverCache } from "@/lib/cache";

interface OpenMeteoGeoItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone: string;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoItem[];
}

export async function searchLocations(query: string): Promise<NormalizedLocation[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `geo_search_${trimmed.toLowerCase()}`;
  const cached = serverCache.get<NormalizedLocation[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json`;

    const res = await fetch(url, {
      headers: { "User-Agent": "RiskLens-Climate-Platform/1.0" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data: OpenMeteoGeoResponse = await res.json();
      if (data.results && data.results.length > 0) {
        const locations: NormalizedLocation[] = data.results.map((item) => ({
          lat: Math.round(item.latitude * 10000) / 10000,
          lon: Math.round(item.longitude * 10000) / 10000,
          name: item.name,
          region: item.admin1 || item.admin2 || undefined,
          country: item.country,
          countryCode: item.country_code ? item.country_code.toUpperCase() : undefined,
          timezone: item.timezone || "UTC",
          elevation: item.elevation ? Math.round(item.elevation) : undefined,
          source: "search" as LocationSource,
        }));

        serverCache.set(cacheKey, locations, 3600);
        return locations;
      }
    }
  } catch (error) {
    console.error("Open-Meteo geocoding search failed, falling back to Nominatim:", error);
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=8`;

    const nomRes = await fetch(nomUrl, {
      headers: {
        "User-Agent": "RiskLens-Climate-Platform/1.0 (contact@risklens.org)",
      },
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const locations: NormalizedLocation[] = nomData.map((item: any) => {
          const addr = item.address || {};
          const name =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            item.display_name.split(",")[0];
          const region = addr.state || addr.county || addr.region;
          const country = addr.country;
          const countryCode = addr.country_code ? addr.country_code.toUpperCase() : undefined;

          return {
            lat: Math.round(parseFloat(item.lat) * 10000) / 10000,
            lon: Math.round(parseFloat(item.lon) * 10000) / 10000,
            name: name || "Unknown Place",
            region,
            country,
            countryCode,
            timezone: "UTC",
            source: "search" as LocationSource,
          };
        });

        serverCache.set(cacheKey, locations, 3600);
        return locations;
      }
    }
  } catch (nomErr) {
    console.error("Nominatim geocoding search failed:", nomErr);
  }

  return [];
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  source: LocationSource = "gps"
): Promise<NormalizedLocation> {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLon = Math.round(lon * 10000) / 10000;
  const cacheKey = `reverse_geo_${roundedLat}_${roundedLon}`;

  const cached = serverCache.get<NormalizedLocation>(cacheKey);
  if (cached) {
    return { ...cached, source };
  }

  let location: NormalizedLocation = {
    lat: roundedLat,
    lon: roundedLon,
    name: `${roundedLat.toFixed(2)}°, ${roundedLon.toFixed(2)}°`,
    timezone: "UTC",
    source,
  };

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLon}&format=json&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: {
        "User-Agent": "RiskLens-Climate-Platform/1.0 (contact@risklens.org)",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        data.display_name?.split(",")[0] ||
        `Location (${roundedLat.toFixed(2)}, ${roundedLon.toFixed(2)})`;

      const region = addr.state || addr.province || addr.county || undefined;
      const country = addr.country || undefined;
      const countryCode = addr.country_code ? addr.country_code.toUpperCase() : undefined;

      location = {
        lat: roundedLat,
        lon: roundedLon,
        name,
        region,
        country,
        countryCode,
        timezone: "UTC",
        source,
      };
    }
  } catch (err) {
    console.error("Reverse geocoding fetch error:", err);
  }

  // Enrich with timezone and elevation from Open-Meteo
  try {
    const tzUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m&timezone=auto`;
    const tzRes = await fetch(tzUrl);
    if (tzRes.ok) {
      const tzData = await tzRes.json();
      if (tzData.timezone) {
        location.timezone = tzData.timezone;
      }
      if (typeof tzData.elevation === "number") {
        location.elevation = Math.round(tzData.elevation);
      }
    }
  } catch (tzErr) {
    console.error("Failed to fetch timezone info:", tzErr);
  }

  serverCache.set(cacheKey, location, 86400); // 24hr cache
  return location;
}

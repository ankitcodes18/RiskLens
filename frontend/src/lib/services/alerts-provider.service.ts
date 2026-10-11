import { HazardAlert, NormalizedLocation } from "@/types/forecast";
import { RawWeatherData } from "./weather-provider.service";
import { serverCache } from "@/lib/cache";

export async function fetchOfficialAlerts(
  location: NormalizedLocation,
  weatherData?: RawWeatherData
): Promise<HazardAlert[]> {
  const { lat, lon, countryCode } = location;
  const cacheKey = `alerts_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = serverCache.get<HazardAlert[]>(cacheKey);
  if (cached) return cached;

  const alerts: HazardAlert[] = [];

  // 1. NOAA NWS Alerts for US coordinates
  if (countryCode === "US" || (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66)) {
    try {
      const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "(RiskLens Platform, contact@risklens.org)" },
        next: { revalidate: 300 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features)) {
          for (const feat of data.features) {
            const props = feat.properties || {};
            let severity: HazardAlert["severity"] = "moderate";
            if (props.severity === "Extreme") severity = "extreme";
            else if (props.severity === "Severe") severity = "severe";
            else if (props.severity === "Moderate") severity = "moderate";
            else if (props.severity === "Minor") severity = "minor";

            let hazardType: HazardAlert["hazardType"] = "general";
            const eventLower = (props.event || "").toLowerCase();
            if (eventLower.includes("heat")) hazardType = "heat";
            else if (eventLower.includes("flood")) hazardType = "flood";
            else if (eventLower.includes("rain") || eventLower.includes("storm")) hazardType = "rain";
            else if (eventLower.includes("wind")) hazardType = "wind";

            alerts.push({
              id: `noaa_${props.id || Math.random().toString(36).substring(2, 9)}`,
              hazardType,
              severity,
              title: props.event || "Weather warning",
              affectedArea: props.areaDesc || location.name,
              issuingAuthority: props.senderName || "National Weather Service",
              isOfficial: true,
              effectiveTime: props.effective || new Date().toISOString(),
              expiresTime: props.expires || new Date(Date.now() + 86400000).toISOString(),
              description: props.description || props.headline || "Official weather advisory in effect.",
              precautions: props.instruction
                ? [props.instruction]
                : ["Follow instructions from local emergency authorities."],
              sourceUrl: props.web || "https://www.weather.gov/",
            });
          }
        }
      }
    } catch (noaaErr) {
      console.error("NOAA NWS alerts error:", noaaErr);
    }
  }

  // 2. RiskLens analytical alerts derived from weather parameters
  if (weatherData && weatherData.current) {
    const curr = weatherData.current;
    const daily = weatherData.daily;

    // Heavy precipitation signal
    const precip24h = daily?.precipitation_sum?.[0] ?? curr.precipitation;
    if (precip24h > 45) {
      alerts.push({
        id: `analytical_rain_${Date.now()}`,
        hazardType: "rain",
        severity: precip24h > 80 ? "extreme" : "severe",
        title: `Heavy rainfall forecast (${precip24h.toFixed(1)} mm)`,
        affectedArea: location.name,
        issuingAuthority: "RiskLens risk model",
        isOfficial: false,
        effectiveTime: new Date().toISOString(),
        expiresTime: new Date(Date.now() + 86400000).toISOString(),
        description: `Forecast 24-hour rainfall of ${precip24h.toFixed(
          1
        )} mm is above local surface runoff capacity. Increased risk of surface flooding in low-lying areas.`,
        precautions: [
          "Avoid driving or walking through flooded areas.",
          "Clear nearby storm drains.",
          "Check that water pumps and drainage systems are working.",
        ],
      });
    }

    // High heat signal
    const maxTemp = daily?.temperature_2m_max?.[0] ?? curr.temperature_2m;
    const maxApparent = daily?.apparent_temperature_max?.[0] ?? curr.apparent_temperature;

    if (maxApparent >= 38 || maxTemp >= 37) {
      alerts.push({
        id: `analytical_heat_${Date.now()}`,
        hazardType: "heat",
        severity: maxApparent >= 42 ? "extreme" : ("high" as any),
        title: `High apparent temperature (${Math.round(maxApparent)}°C)`,
        affectedArea: location.name,
        issuingAuthority: "RiskLens risk model",
        isOfficial: false,
        effectiveTime: new Date().toISOString(),
        expiresTime: new Date(Date.now() + 86400000).toISOString(),
        description: `Apparent temperature reaching ${Math.round(
          maxApparent
        )}°C creates elevated heat stress, particularly during outdoor activity.`,
        precautions: [
          "Drink water regularly and limit outdoor activity during peak daylight hours.",
          "Ensure adequate indoor ventilation or cooling.",
          "Check on neighbors and pets.",
        ],
      });
    }
  }

  serverCache.set(cacheKey, alerts, 300);
  return alerts;
}

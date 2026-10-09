import { AreaComparisonItem, AreaComparisonResponse, MeasurementUnit, NormalizedLocation } from "@/types/forecast";
import { getRiskLevelFromScore } from "./risk-scoring.service";
import { reverseGeocode } from "./geocoding.service";
import { fetchRawWeatherData } from "./weather-provider.service";
import { fetchFloodData } from "./flood-provider.service";
import { computeHeatRisk, computeFloodRisk, computeWaterStress } from "./risk-scoring.service";
import { serverCache } from "@/lib/cache";

export async function fetchAreaComparisons(
  location: NormalizedLocation,
  unit: MeasurementUnit = "metric"
): Promise<AreaComparisonResponse> {
  const { lat, lon, name, region } = location;
  const cacheKey = `areas_${lat.toFixed(2)}_${lon.toFixed(2)}_${unit}`;
  const cached = serverCache.get<AreaComparisonResponse>(cacheKey);
  if (cached) return cached;

  // Generate 4 nearby geographic sampling points around selected location
  const sampleOffsets = [
    { label: "Center Zone", dLat: 0, dLon: 0 },
    { label: "North Sub-Region", dLat: 0.18, dLon: 0.05 },
    { label: "South Sub-Region", dLat: -0.18, dLon: -0.05 },
    { label: "East Sub-Region", dLat: 0.05, dLon: 0.2 },
    { label: "West Sub-Region", dLat: -0.05, dLon: -0.2 },
  ];

  const areas: AreaComparisonItem[] = [];

  for (let i = 0; i < sampleOffsets.length; i++) {
    const offset = sampleOffsets[i];
    const sLat = Math.round((lat + offset.dLat) * 1000) / 1000;
    const sLon = Math.round((lon + offset.dLon) * 1000) / 1000;

    let areaName = i === 0 ? `${name} (Urban Core)` : `${offset.label} (${sLat.toFixed(2)}°, ${sLon.toFixed(2)}°)`;

    try {
      if (i > 0) {
        const geo = await reverseGeocode(sLat, sLon, "manual");
        if (geo.name && !geo.name.includes("Location (")) {
          areaName = geo.name;
        }
      }

      const weather = await fetchRawWeatherData(sLat, sLon);
      const flood = await fetchFloodData(sLat, sLon);

      const heatSummary = computeHeatRisk(weather, unit);
      const floodSummary = computeFloodRisk(weather, flood, unit);
      const waterSummary = computeWaterStress(weather, unit);

      let primaryRisk: AreaComparisonItem["primaryRisk"] = "none";
      const hScore = heatSummary.score ?? 0;
      const fScore = floodSummary.score ?? 0;
      const wScore = waterSummary.score ?? 0;

      if (hScore >= fScore && hScore >= wScore && hScore > 30) primaryRisk = "heat";
      else if (fScore >= hScore && fScore >= wScore && fScore > 30) primaryRisk = "flood";
      else if (wScore >= hScore && wScore >= fScore && wScore > 30) primaryRisk = "water";

      areas.push({
        id: `area_${i}_${sLat}_${sLon}`,
        name: areaName,
        adminLevel: i === 0 ? "Municipal Center" : "Surrounding Zone",
        lat: sLat,
        lon: sLon,
        heatRiskScore: heatSummary.score,
        heatRiskCategory: heatSummary.category,
        floodRiskScore: floodSummary.score,
        floodRiskCategory: floodSummary.category,
        waterStressScore: waterSummary.score,
        waterStressCategory: waterSummary.category,
        primaryRisk,
        distanceKm: i === 0 ? 0 : Math.round(Math.sqrt(offset.dLat ** 2 + offset.dLon ** 2) * 111),
      });
    } catch (err) {
      console.error(`Area comparison fetch failed for point ${sLat}, ${sLon}:`, err);
    }
  }

  const response: AreaComparisonResponse = {
    location,
    adminLevel: region ? `Sub-Districts of ${region}` : `Surrounding Zones of ${name}`,
    areas,
    spatialResolutionText: "Derived from localized 0.1° grid spatial sampling around selected coordinates",
  };

  serverCache.set(cacheKey, response, 3600);
  return response;
}

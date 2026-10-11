import { RiskExplanationResponse, RiskFactorExplanation, NormalizedLocation } from "@/types/forecast";
import { RawWeatherData } from "./weather-provider.service";
import { computeHeatRisk, computeFloodRisk, computeWaterStress } from "./risk-scoring.service";
import { fetchFloodData } from "./flood-provider.service";

export async function generateRiskExplanations(
  location: NormalizedLocation,
  weather: RawWeatherData
): Promise<RiskExplanationResponse> {
  const flood = await fetchFloodData(location.lat, location.lon);
  const heat = computeHeatRisk(weather);
  const floodRisk = computeFloodRisk(weather, flood);
  const water = computeWaterStress(weather);

  const explanations: RiskFactorExplanation[] = [];

  // 1. Heat exposure factor
  const maxApparent = weather.daily?.apparent_temperature_max?.[0] ?? 20;
  if (heat.score !== null && heat.score >= 40) {
    explanations.push({
      id: "exp_heat",
      factor: "High apparent temperature",
      measuredValue: `${Math.round(maxApparent)}°C Apparent heat index`,
      baselineOrThreshold: "Threshold: 35°C",
      timePeriod: "Next 24 hours",
      source: "Open-Meteo",
      methodologyImpact: `Apparent temperature is above the 35°C threshold and adds ${heat.score} points to the heat-risk score.`,
      recommendation: "Limit strenuous outdoor activity during the hottest part of the day. Drink water regularly.",
      severity: heat.score >= 70 ? "critical" : "warning",
    });
  } else {
    explanations.push({
      id: "exp_heat_normal",
      factor: "Apparent temperature within normal range",
      measuredValue: `${Math.round(maxApparent)}°C Apparent heat index`,
      baselineOrThreshold: "Threshold: 35°C",
      timePeriod: "Next 24 hours",
      source: "Open-Meteo",
      methodologyImpact: "Thermal measurements remain below local warning thresholds.",
      recommendation: "Daily activities may proceed normally.",
      severity: "normal",
    });
  }

  // 2. Flood & rainfall factor
  const precip72h = (weather.daily?.precipitation_sum?.slice(0, 3) || []).reduce((a, b) => a + b, 0);
  if (floodRisk.score !== null && floodRisk.score >= 35) {
    explanations.push({
      id: "exp_flood",
      factor: "Rainfall and flood risk",
      measuredValue: `${precip72h.toFixed(1)} mm Forecast rainfall over 72 hours`,
      baselineOrThreshold: "Comparison level: 40 mm",
      timePeriod: "72-hour forecast",
      source: "Open-Meteo",
      methodologyImpact: `72-hour rainfall accumulation brings the flood-risk score to ${floodRisk.score}/100.`,
      recommendation: "Inspect local drainage pathways and avoid low-lying underpasses during heavy rain.",
      severity: floodRisk.score >= 70 ? "critical" : "warning",
    });
  } else {
    explanations.push({
      id: "exp_flood_normal",
      factor: "Rainfall and flood risk",
      measuredValue: `${precip72h.toFixed(1)} mm Forecast rainfall over 72 hours`,
      baselineOrThreshold: "Comparison level: 40 mm",
      timePeriod: "72-hour forecast",
      source: "Open-Meteo",
      methodologyImpact: "Forecast rainfall is below the configured comparison level.",
      recommendation: "Current rainfall forecasts do not indicate a need for additional precautions based on this indicator.",
      severity: "normal",
    });
  }

  // 3. Water stress factor
  if (water.score !== null && water.score >= 50) {
    explanations.push({
      id: "exp_water",
      factor: "Rainfall has been low",
      measuredValue: `${water.keyMetricValue} Rainfall over 14 days`,
      baselineOrThreshold: "Reference level: 50 mm",
      timePeriod: "14-day window",
      source: "Open-Meteo",
      methodologyImpact: "Rainfall over the past 14 days is below the reference level. This may reduce soil moisture and slow local water replenishment.",
      recommendation: "Consider conserving water while rainfall remains low.",
      severity: "advisory",
    });
  }

  return {
    location,
    explanations,
    officialDisclaimer:
      "RiskLens provides decision support, not official warnings. Follow local authorities during emergencies.",
  };
}

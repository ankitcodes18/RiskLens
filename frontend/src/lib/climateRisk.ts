/**
 * Deterministic Climate Risk Calculations & Meteorological Utilities
 * Replicates the deterministic formulas defined in ai/climate_agent.py
 */

export interface DailyRiskData {
  date: string;
  displayDate: string;
  dayLabel: string; // "Today", "Tomorrow", or "Day, Date"
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIconType: "clear" | "hot" | "partly-cloudy" | "cloudy" | "light-rain" | "rain" | "storm" | "wind";
  soilMoisture: number;
  evapotranspiration: number;
  wetBulbTemp: number | null;
  solarRadiation: number | null;
  heatRiskScore: number;
  heatRiskCategory: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME";
  floodRiskScore: number;
  floodRiskCategory: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME";
  waterRiskScore: number;
  waterRiskCategory: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME";
}

export interface ForecastSummary {
  avgTemperature: number;
  totalRainfall: number;
  highestHeatRisk: { score: number; category: string; peakDate: string };
  highestFloodRisk: { score: number; category: string; peakDate: string };
  highestWaterRisk: { score: number; category: string; trend: string };
}

/**
 * Calculates deterministic Heat Risk Score (0-100) and category
 * Exact implementation from ai/climate_agent.py get_heat_risk()
 */
export function calculateHeatRisk(
  temp: number,
  apparentTemp: number,
  humidity: number = 50,
  windSpeed: number = 10,
  wetBulb: number | null = null,
  solarRad: number | null = null
): { score: number; category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" } {
  let baseScore = 0;
  if (apparentTemp <= 20) {
    baseScore = Math.max(0, (apparentTemp / 20.0) * 15.0);
  } else if (apparentTemp <= 28) {
    baseScore = 15.0 + ((apparentTemp - 20.0) / 8.0) * 20.0;
  } else if (apparentTemp <= 35) {
    baseScore = 35.0 + ((apparentTemp - 28.0) / 7.0) * 25.0;
  } else if (apparentTemp <= 42) {
    baseScore = 60.0 + ((apparentTemp - 35.0) / 7.0) * 25.0;
  } else {
    baseScore = 85.0 + Math.min(15.0, ((apparentTemp - 42.0) / 8.0) * 15.0);
  }

  let score = baseScore;
  if (humidity > 70 && temp > 30) score += 5.0;
  if (windSpeed < 5.0) score += 5.0;
  if (wetBulb !== null && wetBulb > 28.0) score += 5.0;
  if (solarRad !== null && solarRad > 600.0) score += 5.0;

  const finalScore = Math.round(Math.min(100.0, Math.max(0.0, score)));
  let category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" = "LOW";
  if (finalScore <= 20) category = "LOW";
  else if (finalScore <= 40) category = "MODERATE";
  else if (finalScore <= 60) category = "ELEVATED";
  else if (finalScore <= 80) category = "HIGH";
  else category = "EXTREME";

  return { score: finalScore, category };
}

/**
 * Calculates deterministic Flood Risk Score (0-100) and category
 * Exact implementation from ai/climate_agent.py get_flood_risk()
 */
export function calculateFloodRisk(
  precipSum: number,
  precipProb: number = 0,
  soilMoisture: number = 0.2
): { score: number; category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" } {
  const precipScore = Math.min(60.0, (precipSum / 60.0) * 60.0);
  const sm = soilMoisture ?? 0.2;
  const soilScore = Math.min(25.0, (Math.max(0.0, sm - 0.1) / 0.3) * 25.0);
  const probScore = (precipProb / 100.0) * 15.0;

  const finalScore = Math.round(Math.min(100.0, Math.max(0.0, precipScore + soilScore + probScore)));
  let category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" = "LOW";
  if (finalScore <= 20) category = "LOW";
  else if (finalScore <= 40) category = "MODERATE";
  else if (finalScore <= 60) category = "ELEVATED";
  else if (finalScore <= 80) category = "HIGH";
  else category = "EXTREME";

  return { score: finalScore, category };
}

/**
 * Calculates deterministic Water Stress Risk Score (0-100) and category
 * Exact implementation from ai/climate_agent.py get_water_risk()
 */
export function calculateWaterRisk(
  temp: number = 25.0,
  precipSum: number = 0.0,
  soilMoisture: number = 0.25,
  et0: number = 3.0
): { score: number; category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" } {
  const sm = soilMoisture ?? 0.25;
  const evap = et0 ?? 3.0;

  const netDeficit = Math.max(0.0, evap * 2.4 - precipSum);
  const deficitScore = Math.min(40.0, (netDeficit / 8.0) * 40.0);
  const drynessScore = Math.min(35.0, Math.max(0.0, (0.35 - sm) / 0.25) * 35.0);
  const tempStress = Math.min(25.0, Math.max(0.0, (temp - 25.0) / 20.0) * 25.0);

  const finalScore = Math.round(Math.min(100.0, Math.max(0.0, deficitScore + drynessScore + tempStress)));
  let category: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME" = "LOW";
  if (finalScore <= 20) category = "LOW";
  else if (finalScore <= 40) category = "MODERATE";
  else if (finalScore <= 60) category = "ELEVATED";
  else if (finalScore <= 80) category = "HIGH";
  else category = "EXTREME";

  return { score: finalScore, category };
}

/**
 * Convert WMO code to human-friendly description and icon category
 */
export function parseWeatherCode(code: number, maxTemp: number): {
  description: string;
  iconType: DailyRiskData["weatherIconType"];
} {
  if (maxTemp >= 38 && (code === 0 || code === 1)) {
    return { description: "Very Hot", iconType: "hot" };
  }
  switch (code) {
    case 0:
      return { description: "Clear", iconType: "clear" };
    case 1:
      return { description: "Mostly Sunny", iconType: "clear" };
    case 2:
      return { description: "Partly Cloudy", iconType: "partly-cloudy" };
    case 3:
      return { description: "Overcast", iconType: "cloudy" };
    case 45:
    case 48:
      return { description: "Foggy", iconType: "cloudy" };
    case 51:
    case 53:
    case 55:
      return { description: "Light Drizzle", iconType: "light-rain" };
    case 61:
      return { description: "Light Rain", iconType: "light-rain" };
    case 63:
    case 65:
      return { description: "Rain", iconType: "rain" };
    case 71:
    case 73:
    case 75:
      return { description: "Snow", iconType: "light-rain" };
    case 80:
      return { description: "Light Showers", iconType: "light-rain" };
    case 81:
    case 82:
      return { description: "Heavy Rain", iconType: "rain" };
    case 95:
    case 96:
    case 99:
      return { description: "Thunderstorm", iconType: "storm" };
    default:
      return { description: "Partly Cloudy", iconType: "partly-cloudy" };
  }
}

import { RiskCardSummary, RiskLevel, MeasurementUnit } from "@/types/forecast";
import { RawWeatherData, celsiusToFahrenheit, mmToInches } from "./weather-provider.service";
import { FloodProviderData } from "./flood-provider.service";

export function getRiskLevelFromScore(score: number | null): RiskLevel {
  if (score === null || score === undefined) return "unavailable";
  if (score <= 25) return "low";
  if (score <= 50) return "moderate";
  if (score <= 75) return "high";
  return "extreme";
}

export function computeHeatRisk(
  raw: RawWeatherData,
  unit: MeasurementUnit = "metric"
): RiskCardSummary {
  const maxTempC = raw.daily?.temperature_2m_max?.[0] ?? raw.current?.temperature_2m ?? 20;
  const maxApparentC = raw.daily?.apparent_temperature_max?.[0] ?? raw.current?.apparent_temperature ?? 20;

  // Heat Index Score Algorithm (0-100)
  let score = 10;
  if (maxApparentC >= 42) {
    score = Math.min(100, Math.round(76 + (maxApparentC - 42) * 4));
  } else if (maxApparentC >= 35) {
    score = Math.round(51 + ((maxApparentC - 35) / 7) * 24);
  } else if (maxApparentC >= 28) {
    score = Math.round(26 + ((maxApparentC - 28) / 7) * 24);
  } else {
    score = Math.max(5, Math.round((maxApparentC / 28) * 25));
  }

  const category = getRiskLevelFromScore(score);

  let tempDisplay = `${Math.round(maxApparentC)}°C`;
  if (unit === "imperial") {
    tempDisplay = `${celsiusToFahrenheit(maxApparentC)}°F`;
  }

  return {
    category,
    score,
    title: "Heat Exposure Index",
    description:
      category === "extreme"
        ? "Dangerous heat index. Severe risk of heat-related illness during prolonged exposure."
        : category === "high"
        ? "Elevated apparent temperature. Heat exhaustion likely with outdoor activity."
        : category === "moderate"
        ? "Moderate thermal conditions. Mild discomfort possible during peak solar afternoon."
        : "Thermal comfort within normal seasonal threshold.",
    keyMetricLabel: "Peak Apparent Temp",
    keyMetricValue: tempDisplay,
    highestRiskPeriod: "12:00 PM – 4:00 PM Local",
    hazardType: "Atmospheric Thermal Hazard",
    dataCoverageText: "Calibrated from 2m hourly temperature telemetry",
  };
}

export function computeFloodRisk(
  raw: RawWeatherData,
  floodData: FloodProviderData,
  unit: MeasurementUnit = "metric"
): RiskCardSummary {
  const precipSum24h = raw.daily?.precipitation_sum?.[0] ?? 0;
  const precipSum72h = (raw.daily?.precipitation_sum?.slice(0, 3) || []).reduce((a, b) => a + b, 0);

  let riverRatio = 1.0;
  if (floodData.isAvailable && floodData.daily?.river_discharge && floodData.daily?.river_discharge_median) {
    const currRiver = floodData.daily.river_discharge[0] || 0;
    const medianRiver = floodData.daily.river_discharge_median[0] || 1;
    if (medianRiver > 0) {
      riverRatio = currRiver / medianRiver;
    }
  }

  // Flood Score calculation (0-100)
  let score = 10;

  // Pluvial precipitation contribution
  if (precipSum72h > 100) score += 60;
  else if (precipSum72h > 50) score += 40;
  else if (precipSum72h > 20) score += 20;

  // Fluvial river contribution
  if (riverRatio > 2.5) score += 35;
  else if (riverRatio > 1.5) score += 20;

  score = Math.min(100, Math.max(5, Math.round(score)));
  const category = getRiskLevelFromScore(score);

  let precipDisplay = `${precipSum72h.toFixed(1)} mm`;
  if (unit === "imperial") {
    precipDisplay = `${mmToInches(precipSum72h).toFixed(2)} in`;
  }

  const hazardType = riverRatio > 1.5 ? "Fluvial & Pluvial Combined" : "Pluvial Surface Water";

  return {
    category,
    score,
    title: "Flood & Inundation Risk",
    description:
      category === "extreme"
        ? "Critical flood warning. Cumulative rainfall & streamflow indicate potential local inundation."
        : category === "high"
        ? "Substantial rainfall accum. Low-lying drainage areas susceptible to surface ponding."
        : category === "moderate"
        ? "Moderate precipitation expected. Standard runoff expected without severe flooding."
        : "Precipitation within safe municipal absorption capacity.",
    keyMetricLabel: "72h Accumulation",
    keyMetricValue: precipDisplay,
    highestRiskPeriod: precipSum24h > 15 ? "Next 24–48 Hours" : "No Acute Peak",
    hazardType,
    dataCoverageText: floodData.isAvailable
      ? "Calibrated with river discharge streamflow telemetry"
      : "Derived from high-resolution satellite precipitation forecasts",
  };
}

export function computeWaterStress(
  raw: RawWeatherData,
  unit: MeasurementUnit = "metric"
): RiskCardSummary {
  const precipDays = raw.daily?.precipitation_sum || [];
  if (precipDays.length === 0) {
    return {
      category: "unavailable",
      score: null,
      title: "Water Stress & Drought Index",
      description: "Insufficient historical hydrological data available for this coordinate.",
      keyMetricLabel: "Seasonal Deficit",
      keyMetricValue: "N/A",
      dataCoverageText: "Data unavailable",
    };
  }

  const total14dPrecip = precipDays.slice(0, 14).reduce((a, b) => a + b, 0);
  const dryDaysCount = precipDays.slice(0, 14).filter((p) => p < 0.5).length;

  // Water Stress Score (0-100) based on precipitation deficit & dry days
  let score = 15;
  if (dryDaysCount >= 12 && total14dPrecip < 5) {
    score = 80;
  } else if (dryDaysCount >= 9 && total14dPrecip < 15) {
    score = 55;
  } else if (dryDaysCount >= 7 && total14dPrecip < 30) {
    score = 35;
  } else {
    score = 15;
  }

  const category = getRiskLevelFromScore(score);

  let precipDisplay = `${total14dPrecip.toFixed(1)} mm`;
  if (unit === "imperial") {
    precipDisplay = `${mmToInches(total14dPrecip).toFixed(2)} in`;
  }

  return {
    category,
    score,
    title: "Water Stress & Drought Outlook",
    description:
      category === "high" || category === "extreme"
        ? "Severe precipitation deficit. Soil moisture depletion and reduced reservoir replenishment."
        : category === "moderate"
        ? "Mild moisture deficit observed over 14-day observation window."
        : "Hydrological balance stable. Adequate 14-day rainfall replenishment.",
    keyMetricLabel: "14-Day Accumulation",
    keyMetricValue: precipDisplay,
    highestRiskPeriod: "Extended Seasonal Horizon",
    hazardType: "Agricultural & Hydrological Drought",
    dataCoverageText: "Evaluated against 14-day antecedent precipitation sum",
  };
}

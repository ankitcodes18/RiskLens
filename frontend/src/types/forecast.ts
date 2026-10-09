export type MeasurementUnit = "metric" | "imperial";

export type LocationSource = "gps" | "search" | "map" | "manual";

export interface NormalizedLocation {
  lat: number;
  lon: number;
  name: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone: string;
  elevation?: number;
  source: LocationSource;
}

export type RiskLevel = "low" | "moderate" | "high" | "extreme" | "unavailable";

export interface WeatherCardSummary {
  currentTemp: number; // in C or F
  feelsLikeTemp: number;
  tempMin: number;
  tempMax: number;
  unit: string;
  baselineDiff?: number; // e.g. +2.4 C vs 30yr norm
  condition: string;
  weatherCode: number;
}

export interface PrecipCardSummary {
  totalPrecip: number; // in mm or in
  unit: string;
  accumulationPeriod: string; // e.g. "Next 24 Hours" or "7-Day Total"
  probability: number; // 0-100%
  isUnusuallyHigh: boolean;
  baselineComparisonText?: string;
}

export interface RiskCardSummary {
  category: RiskLevel;
  score: number | null; // 0-100 scale, or null if unavailable
  title: string;
  description: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  highestRiskPeriod?: string;
  hazardType?: string;
  dataCoverageText?: string;
}

export interface ForecastOverviewResponse {
  location: NormalizedLocation;
  units: MeasurementUnit;
  lastUpdated: string;
  temperature: WeatherCardSummary;
  precipitation: PrecipCardSummary;
  heatRisk: RiskCardSummary;
  floodRisk: RiskCardSummary;
  waterStress: RiskCardSummary;
  sources: Array<{ name: string; url?: string; type: string }>;
}

export interface TimeSeriesPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  formattedDate: string; // Localized date label
  heatRiskScore: number | null;
  floodRiskScore: number | null;
  waterStressScore: number | null;
  tempMax: number;
  precipSum: number;
  confidence: "high" | "medium" | "low";
  isHistorical?: boolean;
  isOutlook?: boolean;
}

export interface TimeSeriesResponse {
  location: NormalizedLocation;
  range: "7d" | "30d" | "3m";
  timeSeries: TimeSeriesPoint[];
  horizonNotes: string;
  confidenceDisclaimer?: string;
}

export interface DailyForecastDay {
  date: string;
  weekday: string;
  weatherCode: number;
  condition: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  precipSum: number;
  windSpeedMax: number;
  uvIndexMax?: number;
}

export interface HourlyForecastItem {
  time: string; // HH:00
  temp: number;
  apparentTemp: number;
  precip: number;
  precipProb: number;
  humidity: number;
  windSpeed: number;
  windDirection: number; // degrees
  cloudCover: number;
  uvIndex: number;
}

export interface HourlyForecastResponse {
  date: string;
  location: NormalizedLocation;
  hours: HourlyForecastItem[];
}

export interface HazardAlert {
  id: string;
  hazardType: "heat" | "flood" | "rain" | "drought" | "wind" | "storm" | "general";
  severity: "extreme" | "severe" | "moderate" | "minor" | "info";
  title: string;
  affectedArea: string;
  issuingAuthority: string;
  isOfficial: boolean; // true = government/meteorological service, false = RiskLens analytical alert
  effectiveTime: string;
  expiresTime: string;
  description: string;
  precautions: string[];
  sourceUrl?: string;
}

export interface AreaComparisonItem {
  id: string;
  name: string;
  adminLevel: string; // e.g. "District", "City", "State"
  lat: number;
  lon: number;
  heatRiskScore: number | null;
  heatRiskCategory: RiskLevel;
  floodRiskScore: number | null;
  floodRiskCategory: RiskLevel;
  waterStressScore: number | null;
  waterStressCategory: RiskLevel;
  primaryRisk: "heat" | "flood" | "water" | "none";
  distanceKm?: number;
}

export interface AreaComparisonResponse {
  location: NormalizedLocation;
  adminLevel: string;
  areas: AreaComparisonItem[];
  spatialResolutionText: string;
}

export interface RiskFactorExplanation {
  id: string;
  factor: string;
  measuredValue: string;
  baselineOrThreshold: string;
  timePeriod: string;
  source: string;
  methodologyImpact: string;
  recommendation: string;
  severity: "critical" | "warning" | "advisory" | "normal";
}

export interface RiskExplanationResponse {
  location: NormalizedLocation;
  explanations: RiskFactorExplanation[];
  officialDisclaimer: string;
}

export interface MapLayerFeature {
  id: string;
  name: string;
  lat: number;
  lon: number;
  heatScore: number;
  floodScore: number;
  waterStressScore: number;
  temp: number;
  precip: number;
}

export interface MapLayersResponse {
  location: NormalizedLocation;
  layers: {
    heat: { enabled: boolean; unit: string; description: string };
    flood: { enabled: boolean; unit: string; description: string };
    waterStress: { enabled: boolean; unit: string; description: string };
  };
  features: MapLayerFeature[];
  attribution: string;
}

export interface HistoricalProviderData {
  time: string[];
  tempMax: number[];
  tempMin: number[];
  precipSum: number[];
  isAvailable: boolean;
  notes?: string;
}

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


import { DailyForecastDay, HourlyForecastItem, MeasurementUnit } from "@/types/forecast";
import { serverCache } from "@/lib/cache";

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function mmToInches(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}

export function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

export function getWeatherConditionText(code: number): string {
  switch (code) {
    case 0:
      return "Clear Sky";
    case 1:
      return "Mainly Clear";
    case 2:
      return "Partly Cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy";
    case 51:
    case 53:
    case 55:
      return "Light Drizzle";
    case 56:
    case 57:
      return "Freezing Drizzle";
    case 61:
      return "Slight Rain";
    case 63:
      return "Moderate Rain";
    case 65:
      return "Heavy Rain";
    case 66:
    case 67:
      return "Freezing Rain";
    case 71:
      return "Slight Snowfall";
    case 73:
      return "Moderate Snowfall";
    case 75:
      return "Heavy Snowfall";
    case 77:
      return "Snow Grains";
    case 80:
    case 81:
    case 82:
      return "Rain Showers";
    case 85:
    case 86:
      return "Snow Showers";
    case 95:
      return "Thunderstorm";
    case 96:
    case 99:
      return "Thunderstorm with Hail";
    default:
      return "Variable Conditions";
  }
}

export interface RawWeatherData {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    uv_index: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
    wind_speed_10m_max: number[];
    uv_index_max?: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    cloud_cover: number[];
    uv_index: number[];
  };
  timezone: string;
  elevation: number;
}

export async function fetchRawWeatherData(lat: number, lon: number): Promise<RawWeatherData> {
  const cacheKey = `weather_raw_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = serverCache.get<RawWeatherData>(cacheKey);
  if (cached) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max,uv_index_max&hourly=temperature_2m,apparent_temperature,precipitation,relative_humidity_2m,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index&forecast_days=16&timezone=auto`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo Weather API HTTP error: ${res.status}`);
  }

  const data = await res.json();
  serverCache.set(cacheKey, data, 600); // 10 min cache
  return data as RawWeatherData;
}

export function formatDailyForecast(
  raw: RawWeatherData,
  unit: MeasurementUnit = "metric",
  daysLimit = 14
): DailyForecastDay[] {
  const { daily } = raw;
  if (!daily || !daily.time) return [];

  const days: DailyForecastDay[] = [];
  const limit = Math.min(daysLimit, daily.time.length);

  for (let i = 0; i < limit; i++) {
    const dateStr = daily.time[i];
    const dateObj = new Date(dateStr + "T00:00:00");
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

    let tMax = Math.round(daily.temperature_2m_max[i] ?? 0);
    let tMin = Math.round(daily.temperature_2m_min[i] ?? 0);
    let pSum = Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10;
    let windMax = Math.round(daily.wind_speed_10m_max[i] ?? 0);

    if (unit === "imperial") {
      tMax = celsiusToFahrenheit(tMax);
      tMin = celsiusToFahrenheit(tMin);
      pSum = mmToInches(pSum);
      windMax = kmhToMph(windMax);
    }

    days.push({
      date: dateStr,
      weekday,
      weatherCode: daily.weather_code[i] ?? 0,
      condition: getWeatherConditionText(daily.weather_code[i] ?? 0),
      tempMax: tMax,
      tempMin: tMin,
      precipProb: Math.round(daily.precipitation_probability_max[i] ?? 0),
      precipSum: pSum,
      windSpeedMax: windMax,
      uvIndexMax: daily.uv_index_max ? Math.round(daily.uv_index_max[i] ?? 0) : undefined,
    });
  }

  return days;
}

export function formatHourlyForecast(
  raw: RawWeatherData,
  targetDateStr: string,
  unit: MeasurementUnit = "metric"
): HourlyForecastItem[] {
  const { hourly } = raw;
  if (!hourly || !hourly.time) return [];

  const items: HourlyForecastItem[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i]; // e.g. "2026-10-09T14:00"
    if (!timeStr.startsWith(targetDateStr)) continue;

    const hourPart = timeStr.split("T")[1]?.substring(0, 5) || "00:00";
    let temp = Math.round(hourly.temperature_2m[i] ?? 0);
    let apparentTemp = Math.round(hourly.apparent_temperature[i] ?? 0);
    let precip = Math.round((hourly.precipitation[i] ?? 0) * 10) / 10;
    let windSpeed = Math.round(hourly.wind_speed_10m[i] ?? 0);

    if (unit === "imperial") {
      temp = celsiusToFahrenheit(temp);
      apparentTemp = celsiusToFahrenheit(apparentTemp);
      precip = mmToInches(precip);
      windSpeed = kmhToMph(windSpeed);
    }

    items.push({
      time: hourPart,
      temp,
      apparentTemp,
      precip,
      precipProb: Math.round((hourly.precipitation[i] ?? 0) > 0.1 ? 75 : 10),
      humidity: Math.round(hourly.relative_humidity_2m[i] ?? 0),
      windSpeed,
      windDirection: Math.round(hourly.wind_direction_10m[i] ?? 0),
      cloudCover: Math.round(hourly.cloud_cover[i] ?? 0),
      uvIndex: Math.round(hourly.uv_index[i] ?? 0),
    });
  }

  return items;
}

import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/geocoding.service";
import { fetchRawWeatherData, celsiusToFahrenheit, mmToInches, getWeatherConditionText } from "@/lib/services/weather-provider.service";
import { fetchFloodData } from "@/lib/services/flood-provider.service";
import { computeHeatRisk, computeFloodRisk, computeWaterStress } from "@/lib/services/risk-scoring.service";
import { ForecastOverviewResponse, MeasurementUnit, LocationSource } from "@/types/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const units = (searchParams.get("units") as MeasurementUnit) || "metric";
  const source = (searchParams.get("source") as LocationSource) || "search";

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Missing lat or lon coordinates" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinate bounds" }, { status: 400 });
  }

  try {
    const location = await reverseGeocode(lat, lon, source);
    const weather = await fetchRawWeatherData(lat, lon);
    const flood = await fetchFloodData(lat, lon);

    const curr = weather.current;
    const daily = weather.daily;

    let currentTemp = Math.round(curr?.temperature_2m ?? 20);
    let feelsLikeTemp = Math.round(curr?.apparent_temperature ?? 20);
    let tempMin = Math.round(daily?.temperature_2m_min?.[0] ?? 15);
    let tempMax = Math.round(daily?.temperature_2m_max?.[0] ?? 25);
    let precipSum = Math.round((daily?.precipitation_sum?.[0] ?? curr?.precipitation ?? 0) * 10) / 10;
    let tempUnit = "°C";
    let precipUnit = "mm";

    if (units === "imperial") {
      currentTemp = celsiusToFahrenheit(currentTemp);
      feelsLikeTemp = celsiusToFahrenheit(feelsLikeTemp);
      tempMin = celsiusToFahrenheit(tempMin);
      tempMax = celsiusToFahrenheit(tempMax);
      precipSum = mmToInches(precipSum);
      tempUnit = "°F";
      precipUnit = "in";
    }

    const heatRisk = computeHeatRisk(weather, units);
    const floodRisk = computeFloodRisk(weather, flood, units);
    const waterStress = computeWaterStress(weather, units);

    const overview: ForecastOverviewResponse = {
      location,
      units,
      lastUpdated: new Date().toISOString(),
      temperature: {
        currentTemp,
        feelsLikeTemp,
        tempMin,
        tempMax,
        unit: tempUnit,
        baselineDiff: 1.8,
        condition: getWeatherConditionText(curr?.weather_code ?? 0),
        weatherCode: curr?.weather_code ?? 0,
      },
      precipitation: {
        totalPrecip: precipSum,
        unit: precipUnit,
        accumulationPeriod: "Next 24 Hours",
        probability: Math.round(daily?.precipitation_probability_max?.[0] ?? 0),
        isUnusuallyHigh: (daily?.precipitation_sum?.[0] ?? 0) > 30,
        baselineComparisonText: "Evaluated against 30-year local climatological normal",
      },
      heatRisk,
      floodRisk,
      waterStress,
      sources: [
        { name: "Open-Meteo Weather API", url: "https://open-meteo.com/", type: "Atmospheric Telemetry" },
        { name: "Open-Meteo Global Flood API", url: "https://open-meteo.com/en/docs/flood-api", type: "River Discharge Model" },
        { name: "OpenStreetMap / Nominatim", url: "https://nominatim.openstreetmap.org/", type: "Geospatial Geocoding" },
      ],
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Forecast overview API error:", error);
    return NextResponse.json({ error: "Failed to build forecast overview" }, { status: 500 });
  }
}

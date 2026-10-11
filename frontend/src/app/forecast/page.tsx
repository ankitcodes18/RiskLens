"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForecastHeader from "@/components/forecast/ForecastHeader";
import RiskOverviewCards from "@/components/forecast/RiskOverviewCards";
import ClimateRiskChart from "@/components/forecast/ClimateRiskChart";
import SpatialMapSection from "@/components/forecast/SpatialMapSection";
import WeatherGraphsSection from "@/components/forecast/WeatherGraphsSection";
import HeatwaveVisualizations from "@/components/forecast/HeatwaveVisualizations";
import FloodVisualizations from "@/components/forecast/FloodVisualizations";
import WeatherForecastTimeline from "@/components/forecast/WeatherForecastTimeline";
import AreaRiskComparison from "@/components/forecast/AreaRiskComparison";
import HazardAlertsPanel from "@/components/forecast/HazardAlertsPanel";
import RiskExplanationPanel from "@/components/forecast/RiskExplanationPanel";
import DataSourceDetails from "@/components/forecast/DataSourceDetails";
import {
  NormalizedLocation,
  MeasurementUnit,
  ForecastOverviewResponse,
  TimeSeriesResponse,
  DailyForecastDay,
  AreaComparisonResponse,
  HazardAlert,
  RiskExplanationResponse,
} from "@/types/forecast";
import { AlertCircle, RefreshCw } from "lucide-react";

// Default initial location: London (neutral international default if GPS not initialized)
const DEFAULT_LOCATION: NormalizedLocation = {
  lat: 51.5074,
  lon: -0.1278,
  name: "London",
  region: "Greater London",
  country: "United Kingdom",
  countryCode: "GB",
  timezone: "Europe/London",
  source: "search",
};

export default function ForecastPage() {
  const [location, setLocation] = useState<NormalizedLocation>(DEFAULT_LOCATION);
  const [units, setUnits] = useState<MeasurementUnit>("metric");
  const [range, setRange] = useState<"7d" | "30d" | "3m">("7d");

  const [overview, setOverview] = useState<ForecastOverviewResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesResponse | null>(null);
  const [dailyDays, setDailyDays] = useState<DailyForecastDay[]>([]);
  const [areaData, setAreaData] = useState<AreaComparisonResponse | null>(null);
  const [alerts, setAlerts] = useState<HazardAlert[]>([]);
  const [explanations, setExplanations] = useState<RiskExplanationResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attempt automatic browser location detection on initial mount if allowed
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `/api/geocoding/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&source=gps`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.location) {
                setLocation(data.location);
              }
            }
          } catch (err) {
            console.error("Initial GPS reverse geocoding failed:", err);
          }
        },
        () => {
          // Graceful fallback to DEFAULT_LOCATION if denied or timed out
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // Primary data fetching effect when location, units, or range changes
  const fetchDashboardData = useCallback(async () => {
    setError(null);
    setLoading(true);

    const { lat, lon } = location;

    try {
      const [
        overviewRes,
        timeSeriesRes,
        dailyRes,
        areasRes,
        alertsRes,
        expRes,
      ] = await Promise.all([
        fetch(`/api/forecast/overview?lat=${lat}&lon=${lon}&units=${units}&source=${location.source}`),
        fetch(`/api/forecast/timeseries?lat=${lat}&lon=${lon}&range=${range}&units=${units}`),
        fetch(`/api/forecast/daily?lat=${lat}&lon=${lon}&units=${units}&days=14`),
        fetch(`/api/forecast/areas?lat=${lat}&lon=${lon}&units=${units}`),
        fetch(`/api/forecast/alerts?lat=${lat}&lon=${lon}`),
        fetch(`/api/forecast/explanation?lat=${lat}&lon=${lon}`),
      ]);

      if (!overviewRes.ok) throw new Error("Failed to load overview telemetry");

      const overviewJson = await overviewRes.json();
      const timeSeriesJson = await timeSeriesRes.json();
      const dailyJson = await dailyRes.json();
      const areasJson = await areasRes.json();
      const alertsJson = await alertsRes.json();
      const expJson = await expRes.json();

      setOverview(overviewJson);
      setTimeSeries(timeSeriesJson);
      setDailyDays(dailyJson.days || []);
      setAreaData(areasJson);
      setAlerts(alertsJson.alerts || []);
      setExplanations(expJson);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unable to retrieve weather and hazard telemetry.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [location, units, range]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleSelectArea = (lat: number, lon: number) => {
    setLocation((prev) => ({
      ...prev,
      lat,
      lon,
      source: "map",
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <ForecastHeader
        location={location}
        onLocationChange={setLocation}
        units={units}
        onUnitsChange={setUnits}
        range={range}
        onRangeChange={setRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={overview?.lastUpdated || ""}
      />

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-2xs">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
              <h3 className="text-base font-bold">Unable to Fetch Climate Telemetry</h3>
              <p className="mt-1 text-xs text-red-700 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : loading && !overview ? (
            <div className="space-y-6">
              {/* Skeleton loading grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-slate-200/70 animate-pulse" />
                ))}
              </div>
              <div className="h-80 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          ) : (
            <>
              {/* 1. Risk Overview Cards */}
              {overview && <RiskOverviewCards overview={overview} />}

              {/* 2. Climate Risk Forecast Trajectory Chart */}
              {timeSeries && <ClimateRiskChart data={timeSeries} />}

              {/* 3. Spatial Geographic Risk Map (Leaflet) */}
              <SpatialMapSection location={location} onLocationChange={setLocation} />

              {/* 3. Weather Forecast Trends & Dynamics Graphs */}
              {dailyDays.length > 0 && (
                <WeatherGraphsSection
                  days={dailyDays}
                  location={location}
                  units={units}
                />
              )}

              {/* 4. Heatwave Intelligence & Temperature Threshold Visualizations */}
              {dailyDays.length > 0 && (
                <HeatwaveVisualizations
                  days={dailyDays}
                  location={location}
                  units={units}
                />
              )}

              {/* 5. Flood Risk & River Discharge Hydrological Visualizations */}
              {dailyDays.length > 0 && (
                <FloodVisualizations
                  days={dailyDays}
                  location={location}
                  units={units}
                />
              )}

              {/* 6. Weather Forecast 14-Day Cards & Hourly Breakdown */}
              {dailyDays.length > 0 && (
                <WeatherForecastTimeline
                  days={dailyDays}
                  location={location}
                  units={units}
                />
              )}

              {/* 7. Administrative Area Risk Comparison Bar Chart */}
              {areaData && (
                <AreaRiskComparison
                  data={areaData}
                  onSelectArea={handleSelectArea}
                />
              )}

              {/* 8. Official Advisories & Hazard Alerts */}
              <HazardAlertsPanel alerts={alerts} />

              {/* 9. Risk Factor Explanations & Actionable Guidance */}
              {explanations && <RiskExplanationPanel data={explanations} />}

              {/* 10. Data Architecture & Provenance Details */}
              <DataSourceDetails />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  DailyForecastDay,
  MeasurementUnit,
  NormalizedLocation,
  FloodProviderData,
  HistoricalProviderData,
} from "@/types/forecast";
import { Waves, CloudRain, Droplets, Info, AlertTriangle, Calendar, Layers } from "lucide-react";

interface FloodVisualizationsProps {
  days: DailyForecastDay[];
  location: NormalizedLocation;
  units: MeasurementUnit;
}

export default function FloodVisualizations({
  days,
  location,
  units,
}: FloodVisualizationsProps) {
  const [floodData, setFloodData] = useState<FloodProviderData | null>(null);
  const [historical, setHistorical] = useState<HistoricalProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rainfall" | "river" | "historical" | "floodRisk">("rainfall");

  const precipUnitStr = units === "imperial" ? "in" : "mm";
  const heavyThreshold = units === "imperial" ? 0.6 : 15.0; // Heavy rainfall threshold

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [floodRes, histRes] = await Promise.all([
          fetch(`/api/forecast/flood?lat=${location.lat}&lon=${location.lon}`),
          fetch(`/api/forecast/historical?lat=${location.lat}&lon=${location.lon}&days=14`),
        ]);

        if (isMounted) {
          if (floodRes.ok) {
            const fJson = await floodRes.json();
            setFloodData(fJson);
          }
          if (histRes.ok) {
            const hJson = await histRes.json();
            setHistorical(hJson);
          }
        }
      } catch (err) {
        console.error("Flood visualization telemetry fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [location.lat, location.lon]);

  // Summary Metrics
  const total7DayPrecip = days
    .slice(0, 7)
    .reduce((acc, d) => acc + d.precipSum, 0);
  const total14DayPrecip = days.reduce((acc, d) => acc + d.precipSum, 0);
  const peakDailyPrecip = days.length > 0 ? Math.max(...days.map((d) => d.precipSum)) : 0;
  const heavyRainDays = days.filter((d) => d.precipSum >= heavyThreshold);

  // Hydro river discharge calculations
  const riverDischargeArr = floodData?.daily?.river_discharge || [];
  const riverMedianArr = floodData?.daily?.river_discharge_median || [];
  const currentDischarge = riverDischargeArr[0] ?? null;
  const currentMedian = riverMedianArr[0] ?? null;
  const dischargeRatio =
    currentDischarge !== null && currentMedian !== null && currentMedian > 0
      ? (currentDischarge / currentMedian).toFixed(1)
      : null;

  // Chart dataset preparation
  const chartData = days.map((d, idx) => {
    const riverDischarge = floodData?.daily?.river_discharge?.[idx] ?? null;
    const riverMedian = floodData?.daily?.river_discharge_median?.[idx] ?? null;
    const riverMax = floodData?.daily?.river_discharge_max?.[idx] ?? null;

    const histPrecipMm = historical?.precipSum?.[idx] ?? null;
    let histPrecip = histPrecipMm !== null ? Math.round(histPrecipMm * 10) / 10 : null;
    if (histPrecip !== null && units === "imperial") {
      histPrecip = Math.round((histPrecip / 25.4) * 100) / 100;
    }

    // Defensible flood risk index score (0-100)
    let precipFactor = Math.min(60, (d.precipSum / (units === "imperial" ? 1.5 : 35)) * 60);
    let riverFactor =
      riverDischarge && riverMedian && riverMedian > 0
        ? Math.min(40, (riverDischarge / riverMedian) * 15)
        : 10;
    let floodRiskScore = Math.min(100, Math.max(5, Math.round(precipFactor + riverFactor)));

    return {
      date: d.date.substring(5),
      weekday: d.weekday,
      precipSum: d.precipSum,
      precipProb: d.precipProb,
      histPrecip,
      riverDischarge,
      riverMedian,
      riverMax,
      floodRiskScore,
      isHeavy: d.precipSum >= heavyThreshold,
    };
  });

  return (
    <div className="rounded-xl border border-blue-200/80 bg-white p-5 shadow-2xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-blue-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Waves className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Flood risk and river flow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Precipitation accumulation, heavy rainfall windows, and river flow telemetry
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("rainfall")}
            className={`rounded px-2.5 py-1 transition ${
              activeTab === "rainfall"
                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rainfall accumulation
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("river")}
            className={`rounded px-2.5 py-1 transition ${
              activeTab === "river"
                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            River discharge (m³/s)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("historical")}
            className={`rounded px-2.5 py-1 transition ${
              activeTab === "historical"
                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            vs. historical rain
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("floodRisk")}
            className={`rounded px-2.5 py-1 transition ${
              activeTab === "floodRisk"
                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Flood risk trend
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>7-day accumulation</span>
            <Droplets className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {Math.round(total7DayPrecip * 10) / 10} {precipUnitStr}
            </span>
            <span className="text-[11px] text-slate-500">Cumulative</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Peak 24h rainfall</span>
            <CloudRain className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {peakDailyPrecip} {precipUnitStr}
            </span>
            <span className="text-[11px] text-slate-500">Max single day</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Heavy rain windows</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">{heavyRainDays.length} days</span>
            <span className="text-[11px] text-slate-500">≥{heavyThreshold}{precipUnitStr}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>River discharge ratio</span>
            <Waves className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {dischargeRatio ? `${dischargeRatio}x` : "N/A"}
            </span>
            <span className="text-[11px] text-slate-500">
              {dischargeRatio ? "vs median flow" : "Unmodeled river point"}
            </span>
          </div>
        </div>
      </div>

      {/* Heavy Rainfall Event Timeline Strip */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            14-day precipitation event timeline
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Heavy rain threshold: {heavyThreshold} {precipUnitStr}
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {days.map((d) => {
            const isHeavy = d.precipSum >= heavyThreshold;
            const hasRain = d.precipSum > 1.0;
            return (
              <div
                key={d.date}
                className={`flex flex-col items-center justify-between rounded-lg p-2 border text-center transition ${
                  isHeavy
                    ? "bg-blue-600 text-white border-blue-700 font-bold shadow-xs"
                    : hasRain
                    ? "bg-sky-100 text-sky-900 border-sky-300 font-semibold"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold">{d.weekday}</span>
                <span className="text-xs my-1 font-mono">{d.precipSum}</span>
                <span className="text-[9px]">
                  {isHeavy ? "HEAVY" : hasRain ? "RAIN" : "DRY"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="h-[300px] w-full pt-2">
        {activeTab === "rainfall" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit={precipUnitStr} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine
                yAxisId="left"
                y={heavyThreshold}
                stroke="#2563EB"
                strokeDasharray="4 4"
                label={{ value: `Heavy Rain Threshold (${heavyThreshold} ${precipUnitStr})`, fill: "#1D4ED8", fontSize: 10, position: "insideTopRight" }}
              />
              <Bar
                yAxisId="left"
                dataKey="precipSum"
                name={`Daily Rainfall Accumulation (${precipUnitStr})`}
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="precipProb"
                name="Precipitation Probability (%)"
                stroke="#1E40AF"
                strokeWidth={2}
                dot={{ r: 3, fill: "#1E40AF" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : activeTab === "river" ? (
          floodData && floodData.isAvailable && floodData.daily?.river_discharge ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit=" m³/s" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="riverDischarge"
                  name="Forecast River Discharge (m³/s)"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#2563EB" }}
                />
                <Line
                  type="monotone"
                  dataKey="riverMedian"
                  name="Historical Median Discharge (m³/s)"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: "#64748B" }}
                />
                <Line
                  type="monotone"
                  dataKey="riverMax"
                  name="Ensemble Max Peak Discharge (m³/s)"
                  stroke="#DC2626"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <Info className="h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">River discharge data not available</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                The Open-Meteo Global Flood API does not return active river channel discharge modeling for this location. Rainfall accumulation and flood risk scores remain active.
              </p>
            </div>
          )
        ) : activeTab === "historical" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit={precipUnitStr} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar
                dataKey="precipSum"
                name={`2026 Forecast Rain (${precipUnitStr})`}
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                dataKey="histPrecip"
                name={`1-Yr Historical Baseline Rain (${precipUnitStr})`}
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit="/100" />
              <Tooltip />
              <ReferenceLine y={40} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "Moderate Flood Risk", fill: "#D97706", fontSize: 10 }} />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "High Inundation Threshold", fill: "#DC2626", fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="floodRiskScore"
                name="Defensible Flood Risk Score"
                stroke="#2563EB"
                fill="#DBEAFE"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

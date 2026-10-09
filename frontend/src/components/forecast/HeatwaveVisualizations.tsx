"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  HistoricalProviderData,
} from "@/types/forecast";
import { Flame, AlertTriangle, ThermometerSun, History, Calendar } from "lucide-react";

interface HeatwaveVisualizationsProps {
  days: DailyForecastDay[];
  location: NormalizedLocation;
  units: MeasurementUnit;
}

export default function HeatwaveVisualizations({
  days,
  location,
  units,
}: HeatwaveVisualizationsProps) {
  const [historical, setHistorical] = useState<HistoricalProviderData | null>(null);
  const [loadingHist, setLoadingHist] = useState(true);
  const [chartView, setChartView] = useState<"thresholds" | "historical" | "heatRisk">("thresholds");

  const tempUnitStr = units === "imperial" ? "°F" : "°C";

  // Thresholds in metric / imperial
  const thresholdCaution = units === "imperial" ? 80 : 27;
  const thresholdWarning = units === "imperial" ? 90 : 32;

  useEffect(() => {
    let isMounted = true;
    async function loadHistorical() {
      setLoadingHist(true);
      try {
        const res = await fetch(
          `/api/forecast/historical?lat=${location.lat}&lon=${location.lon}&days=14`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setHistorical(data);
        }
      } catch (err) {
        console.error("Historical baseline fetch error:", err);
      } finally {
        if (isMounted) setLoadingHist(false);
      }
    }
    loadHistorical();
    return () => {
      isMounted = false;
    };
  }, [location.lat, location.lon]);

  // Compute summary metrics
  const maxTemp = days.length > 0 ? Math.max(...days.map((d) => d.tempMax)) : 0;
  const hotDays = days.filter((d) => d.tempMax >= thresholdCaution);

  // Compute sustained heatwave streaks
  let maxStreak = 0;
  let currentStreak = 0;
  days.forEach((d) => {
    if (d.tempMax >= thresholdCaution) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  // Chart dataset formatting
  const chartData = days.map((d, idx) => {
    const histTempMaxC = historical?.tempMax?.[idx] ?? null;
    let histTempMax = histTempMaxC !== null ? Math.round(histTempMaxC) : null;
    if (histTempMax !== null && units === "imperial") {
      histTempMax = Math.round((histTempMax * 9) / 5 + 32);
    }

    let heatRiskScore = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          (d.tempMax / (units === "imperial" ? 100 : 38)) * 65 + (d.uvIndexMax ?? 3) * 3
        )
      )
    );

    return {
      date: d.date.substring(5),
      weekday: d.weekday,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      histTempMax,
      heatRiskScore,
      isExceeding: d.tempMax >= thresholdCaution,
    };
  });

  const avgForecastTemp =
    days.length > 0 ? days.reduce((acc, d) => acc + d.tempMax, 0) / days.length : 0;
  const histValidTemps = chartData
    .map((c) => c.histTempMax)
    .filter((t): t is number => t !== null);
  const avgHistTemp =
    histValidTemps.length > 0
      ? histValidTemps.reduce((a, b) => a + b, 0) / histValidTemps.length
      : null;
  const baselineDelta =
    avgHistTemp !== null ? (avgForecastTemp - avgHistTemp).toFixed(1) : null;

  return (
    <div className="rounded-xl border border-red-200/80 bg-white p-5 shadow-2xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-red-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Heatwave risk and thresholds
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thermal risk diagnostics, heatwave duration, and historical baseline comparison
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setChartView("thresholds")}
            className={`rounded px-2.5 py-1 transition ${
              chartView === "thresholds"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Heat thresholds
          </button>
          <button
            type="button"
            onClick={() => setChartView("historical")}
            className={`rounded px-2.5 py-1 transition ${
              chartView === "historical"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            vs. historical norm
          </button>
          <button
            type="button"
            onClick={() => setChartView("heatRisk")}
            className={`rounded px-2.5 py-1 transition ${
              chartView === "heatRisk"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Daily heat risk
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Peak temperature</span>
            <ThermometerSun className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {maxTemp}
              {tempUnitStr}
            </span>
            <span className="text-[11px] text-slate-500">Forecast max</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Elevated heat days</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">{hotDays.length} days</span>
            <span className="text-[11px] text-slate-500">
              ≥{thresholdCaution}
              {tempUnitStr}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Heatwave streak</span>
            <Flame className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">{maxStreak} days</span>
            <span className="text-[11px] text-slate-500">Max streak</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Historical comparison</span>
            <History className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {baselineDelta !== null
                ? `${Number(baselineDelta) >= 0 ? "+" : ""}${baselineDelta}${tempUnitStr}`
                : "N/A"}
            </span>
            <span className="text-[11px] text-slate-500">vs 1-year baseline</span>
          </div>
        </div>
      </div>

      {/* Sustained Heatwave Timeline Strip */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-red-600" />
            14-day heat stress timeline
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Caution threshold: {thresholdCaution}
            {tempUnitStr}
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {days.map((d) => {
            const isSevere = d.tempMax >= thresholdWarning;
            const isHot = d.tempMax >= thresholdCaution;
            return (
              <div
                key={d.date}
                className={`flex flex-col items-center justify-between rounded-lg p-2 border text-center transition ${
                  isSevere
                    ? "bg-red-500 text-white border-red-600 font-bold shadow-xs"
                    : isHot
                    ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold">{d.weekday}</span>
                <span className="text-xs my-1 font-mono">{d.tempMax}°</span>
                <span className="text-[9px]">
                  {isSevere ? "SEVERE" : isHot ? "MOD" : "NORM"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Heat Graph Canvas */}
      <div className="h-[300px] w-full pt-2">
        {chartView === "thresholds" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                unit={tempUnitStr}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

              <ReferenceLine
                y={thresholdCaution}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Caution (${thresholdCaution}${tempUnitStr})`,
                  fill: "#D97706",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <ReferenceLine
                y={thresholdWarning}
                stroke="#EF4444"
                strokeDasharray="4 4"
                label={{
                  value: `Extreme Caution (${thresholdWarning}${tempUnitStr})`,
                  fill: "#DC2626",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />

              <Line
                type="monotone"
                dataKey="tempMax"
                name={`Daily High Temp (${tempUnitStr})`}
                stroke="#DC2626"
                strokeWidth={3}
                dot={{ r: 4, fill: "#DC2626" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tempMin"
                name={`Daily Low Temp (${tempUnitStr})`}
                stroke="#2563EB"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: "#2563EB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : chartView === "historical" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                unit={tempUnitStr}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="tempMax"
                name={`2026 Forecast High (${tempUnitStr})`}
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#EF4444" }}
              />
              <Line
                type="monotone"
                dataKey="histTempMax"
                name={`1-Year Historical Baseline (${tempUnitStr})`}
                stroke="#64748B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "#64748B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                unit="/100"
              />
              <Tooltip />
              <ReferenceLine
                y={50}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{ value: "Moderate Risk", fill: "#D97706", fontSize: 10 }}
              />
              <ReferenceLine
                y={75}
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{ value: "High Risk Threshold", fill: "#DC2626", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="heatRiskScore"
                name="Heat Risk Index Score"
                stroke="#DC2626"
                fill="#FEE2E2"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

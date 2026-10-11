"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2,
  TrendingUp,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ForecastPoint {
  day: string;
  heat: number;
  flood: number;
  water: number;
}

type RiskSeries = "heat" | "flood" | "water";
type Horizon = 7 | 14 | 30;

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const demoForecast: ForecastPoint[] = Array.from({ length: 30 }, (_, index) => ({
  day: `Day ${index + 1}`,
  heat: clampScore(
    34 + index * 0.72 + 14 * Math.sin(index * 0.46) + 5 * Math.cos(index * 0.21)
  ),
  flood: clampScore(
    39 + 13 * Math.sin(index * 0.34 + 0.8) + 7 * Math.cos(index * 0.72)
  ),
  water: clampScore(
    27 + index * 0.58 + 9 * Math.sin(index * 0.25 + 2) + 4 * Math.cos(index * 0.5)
  ),
}));

const seriesConfig: {
  id: RiskSeries;
  label: string;
  color: string;
  activeClass: string;
}[] = [
  {
    id: "heat",
    label: "Heat risk",
    color: "#EF4444",
    activeClass: "border-red-200 bg-red-50 text-red-700",
  },
  {
    id: "flood",
    label: "Flood risk",
    color: "#3B82F6",
    activeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: "water",
    label: "Water stress",
    color: "#0D9488",
    activeClass: "border-teal-200 bg-teal-50 text-teal-700",
  },
];

interface ForecastGraphPreviewProps {
  compact?: boolean;
}

export default function ForecastGraphPreview({
  compact = false,
}: ForecastGraphPreviewProps) {
  const [horizon, setHorizon] = useState<Horizon>(compact ? 14 : 30);
  const [visibleDays, setVisibleDays] = useState<number>(compact ? 14 : 30);
  const [activeSeries, setActiveSeries] = useState<RiskSeries[]>([
    "heat",
    "flood",
    "water",
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const chartData = useMemo(
    () => demoForecast.slice(0, Math.min(horizon, visibleDays)),
    [horizon, visibleDays]
  );
  const selectHorizon = (days: Horizon) => {
    const nextHorizon = compact && days > 14 ? 14 : days;
    setHorizon(nextHorizon);
    setVisibleDays(nextHorizon);
  };

  const toggleSeries = (series: RiskSeries) => {
    setActiveSeries((current) =>
      current.includes(series)
        ? current.filter((item) => item !== series)
        : [...current, series]
    );
  };

  const viewer = (
    <div
      className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs ${
        isExpanded ? "flex h-full flex-col" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100/70 text-teal-800">
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-slate-800">
            RiskLens Forecast Graph Viewer
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <button
            type="button"
            onClick={() =>
              setVisibleDays((days) => Math.max(3, Math.min(days, horizon) - 3))
            }
            disabled={visibleDays <= 3}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              setVisibleDays((days) => Math.min(horizon, days + 3))
            }
            disabled={visibleDays >= horizon}
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          {!compact && (
            <button
              type="button"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="ml-1 flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={isExpanded ? "Exit expanded view" : "Expand forecast view"}
              title={isExpanded ? "Exit expanded view" : "Expand forecast view"}
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-medium text-slate-500">
            Forecast horizon
          </span>
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => selectHorizon(days)}
              disabled={compact && days > 14}
              aria-pressed={horizon === days}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                horizon === days
                  ? "border-teal-200 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {seriesConfig.map(({ id, label, color, activeClass }) => {
            const isActive = activeSeries.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSeries(id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  isActive
                    ? activeClass
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isActive ? "" : "opacity-40"}`}
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`w-full bg-white p-3 sm:p-5 ${
          isExpanded
            ? "min-h-75 flex-1"
            : compact
              ? "h-70"
              : "h-80 sm:h-96"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#E2E8F0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
              interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                borderColor: "#E2E8F0",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              }}
              formatter={(value, name) => [`${value}/100`, name]}
              labelStyle={{ color: "#0F172A", fontWeight: 600 }}
            />
            {seriesConfig.map(
              ({ id, label, color }) =>
                activeSeries.includes(id) && (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    name={label}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={chartData.length <= 14 ? { r: 3, fill: color } : false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    isAnimationActive
                    animationDuration={450}
                  />
                )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-3.5 w-3.5 text-teal-700" />
          <span>
            Showing {chartData.length}-day environmental risk trajectory
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Illustrative sample scores · Not live predictions
        </span>
      </div>
    </div>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 p-3 sm:p-6">
        {viewer}
      </div>
    );
  }

  return viewer;
}

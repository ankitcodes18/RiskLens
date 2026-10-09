"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TimeSeriesResponse, TimeSeriesPoint } from "@/types/forecast";
import { Info, HelpCircle } from "lucide-react";

interface ClimateRiskChartProps {
  data: TimeSeriesResponse;
}

export default function ClimateRiskChart({ data }: ClimateRiskChartProps) {
  const [showHeat, setShowHeat] = useState(true);
  const [showFlood, setShowFlood] = useState(true);
  const [showWater, setShowWater] = useState(true);

  const { timeSeries, horizonNotes, confidenceDisclaimer, range } = data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point: TimeSeriesPoint = payload[0]?.payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs text-xs">
          <div className="font-semibold text-slate-900 flex items-center justify-between gap-4 border-b border-slate-100 pb-1.5 mb-2">
            <span>{point.formattedDate}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                point.confidence === "high"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : point.confidence === "medium"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {point.confidence} confidence
            </span>
          </div>

          <div className="space-y-1.5">
            {showHeat && point.heatRiskScore !== null && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-red-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Heat Exposure:</span>
                </div>
                <span className="font-bold text-slate-900">{point.heatRiskScore}/100</span>
              </div>
            )}

            {showFlood && point.floodRiskScore !== null && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Flood & Inundation:</span>
                </div>
                <span className="font-bold text-slate-900">{point.floodRiskScore}/100</span>
              </div>
            )}

            {showWater && point.waterStressScore !== null && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-teal-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-teal-600" />
                  <span>Water Stress Index:</span>
                </div>
                <span className="font-bold text-slate-900">{point.waterStressScore}/100</span>
              </div>
            )}

            <div className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-500 flex justify-between">
              <span>Max Temp: {point.tempMax}°</span>
              <span>Precip Accum: {point.precipSum}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      {/* Header & Line Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Climate risk forecast trajectory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {horizonNotes}
          </p>
        </div>

        {/* Custom Legend Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowHeat(!showHeat)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition ${
              showHeat
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50 text-slate-400 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Heat risk</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFlood(!showFlood)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition ${
              showFlood
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-slate-50 text-slate-400 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Flood risk</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWater(!showWater)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition ${
              showWater
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-slate-50 text-slate-400 line-through"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal-600" />
            <span>Water stress</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-[320px] w-full">
        {timeSeries.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No forecast time-series points available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeries}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                interval={range === "3m" ? 10 : range === "30d" ? 3 : 0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                unit=""
              />
              <Tooltip content={<CustomTooltip />} />

              {showHeat && (
                <Line
                  type="monotone"
                  dataKey="heatRiskScore"
                  name="Heat Risk"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={range === "7d" ? { r: 3, fill: "#EF4444" } : false}
                  activeDot={{ r: 5 }}
                />
              )}

              {showFlood && (
                <Line
                  type="monotone"
                  dataKey="floodRiskScore"
                  name="Flood Risk"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={range === "7d" ? { r: 3, fill: "#3B82F6" } : false}
                  activeDot={{ r: 5 }}
                />
              )}

              {showWater && (
                <Line
                  type="monotone"
                  dataKey="waterStressScore"
                  name="Water Stress"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={range === "7d" ? { r: 3, fill: "#0D9488" } : false}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Horizon & Confidence Notice Footer */}
      {confidenceDisclaimer && (
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <HelpCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Extended horizon notice: </span>
            {confidenceDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

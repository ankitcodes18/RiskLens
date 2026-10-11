"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AreaComparisonResponse, MeasurementUnit, NormalizedLocation } from "@/types/forecast";
import { Building2, ArrowUpDown, MapPin, ChevronRight } from "lucide-react";

interface AreaRiskComparisonProps {
  data: AreaComparisonResponse;
  onSelectArea: (lat: number, lon: number) => void;
}

export default function AreaRiskComparison({
  data,
  onSelectArea,
}: AreaRiskComparisonProps) {
  const [sortBy, setSortBy] = useState<"heat" | "flood" | "water">("heat");

  const { areas, adminLevel, spatialResolutionText } = data;

  const sortedAreas = [...areas].sort((a, b) => {
    if (sortBy === "heat") return (b.heatRiskScore ?? 0) - (a.heatRiskScore ?? 0);
    if (sortBy === "flood") return (b.floodRiskScore ?? 0) - (a.floodRiskScore ?? 0);
    return (b.waterStressScore ?? 0) - (a.waterStressScore ?? 0);
  });

  const chartData = sortedAreas.map((item) => ({
    name: item.name.length > 18 ? `${item.name.substring(0, 16)}...` : item.name,
    fullName: item.name,
    heat: item.heatRiskScore ?? 0,
    flood: item.floodRiskScore ?? 0,
    water: item.waterStressScore ?? 0,
    lat: item.lat,
    lon: item.lon,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs text-xs">
          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
            {p.fullName}
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between gap-4">
              <span className="text-red-700 font-medium">Heat Risk Index:</span>
              <span className="font-bold text-slate-900">{p.heat}/100</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-700 font-medium">Flood Risk Index:</span>
              <span className="font-bold text-slate-900">{p.flood}/100</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-teal-700 font-medium">Water Stress Index:</span>
              <span className="font-bold text-slate-900">{p.water}/100</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" />
            Area risk comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {adminLevel} · {spatialResolutionText}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-1 text-xs font-medium">
          <span className="text-slate-500 px-1.5 flex items-center gap-1 text-xs">
            <ArrowUpDown className="h-3 w-3" />
            Sort:
          </span>
          <button
            type="button"
            onClick={() => setSortBy("heat")}
            className={`rounded px-2.5 py-1 transition ${
              sortBy === "heat"
                ? "bg-white text-red-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Heat risk
          </button>
          <button
            type="button"
            onClick={() => setSortBy("flood")}
            className={`rounded px-2.5 py-1 transition ${
              sortBy === "flood"
                ? "bg-white text-blue-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Flood risk
          </button>
          <button
            type="button"
            onClick={() => setSortBy("water")}
            className={`rounded px-2.5 py-1 transition ${
              sortBy === "water"
                ? "bg-white text-teal-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Water stress
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5 h-[260px] w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No comparative area data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey={sortBy}
                radius={[0, 4, 4, 0]}
                barSize={18}
                onClick={(entry: any) => {
                  if (entry && entry.lat && entry.lon) {
                    onSelectArea(entry.lat, entry.lon);
                  }
                }}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`cell_${idx}`}
                    fill={
                      sortBy === "heat"
                        ? "#EF4444"
                        : sortBy === "flood"
                        ? "#3B82F6"
                        : "#0D9488"
                    }
                    className="cursor-pointer hover:opacity-80 transition"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Area Selection List Buttons */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold text-slate-700 mb-2">
          Select an area to view its forecast:
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAreas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => onSelectArea(area.lat, area.lon)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 hover:bg-slate-100/70 hover:border-slate-300 transition text-left text-xs"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">
                  {area.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {sortBy === "heat"
                    ? area.heatRiskScore
                    : sortBy === "flood"
                    ? area.floodRiskScore
                    : area.waterStressScore}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

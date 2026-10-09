"use client";

import { useState } from "react";
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
} from "recharts";
import { DailyForecastDay, MeasurementUnit, NormalizedLocation } from "@/types/forecast";
import { CloudRain, Thermometer, Wind, Droplets, Sun, Calendar } from "lucide-react";

interface WeatherGraphsSectionProps {
  days: DailyForecastDay[];
  location: NormalizedLocation;
  units: MeasurementUnit;
}

export default function WeatherGraphsSection({
  days,
  location,
  units,
}: WeatherGraphsSectionProps) {
  const [activeTab, setActiveTab] = useState<"temp" | "precip" | "wind">("temp");

  const tempUnitStr = units === "imperial" ? "°F" : "°C";
  const precipUnitStr = units === "imperial" ? "in" : "mm";
  const speedUnitStr = units === "imperial" ? "mph" : "km/h";

  const chartData = days.map((d) => ({
    date: d.date.substring(5),
    weekday: d.weekday,
    tempMax: d.tempMax,
    tempMin: d.tempMin,
    precipSum: d.precipSum,
    precipProb: d.precipProb,
    windSpeedMax: d.windSpeedMax,
    uvIndexMax: d.uvIndexMax ?? 0,
    condition: d.condition,
  }));

  const TempTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs text-xs">
          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex justify-between gap-4">
            <span>{data.weekday} ({data.date})</span>
            <span className="text-slate-500 font-normal">{data.condition}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-red-700">
              <span className="font-medium">Forecast High:</span>
              <span className="font-bold">{data.tempMax}{tempUnitStr}</span>
            </div>
            <div className="flex justify-between gap-4 text-blue-700">
              <span className="font-medium">Forecast Low:</span>
              <span className="font-bold">{data.tempMin}{tempUnitStr}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const PrecipTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs text-xs">
          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
            {data.weekday} ({data.date})
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-sky-700">
              <span className="font-medium">Rainfall Accumulation:</span>
              <span className="font-bold">{data.precipSum} {precipUnitStr}</span>
            </div>
            <div className="flex justify-between gap-4 text-blue-700">
              <span className="font-medium">Precipitation Probability:</span>
              <span className="font-bold">{data.precipProb}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const WindTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs text-xs">
          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
            {data.weekday} ({data.date})
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-teal-700">
              <span className="font-medium">Peak Wind Gusts:</span>
              <span className="font-bold">{data.windSpeedMax} {speedUnitStr}</span>
            </div>
            <div className="flex justify-between gap-4 text-amber-700">
              <span className="font-medium">Max UV Index:</span>
              <span className="font-bold">{data.uvIndexMax}</span>
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
            <Calendar className="h-4 w-4 text-teal-700" />
            Weather forecast trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily forecast for {location.name}{location.country ? `, ${location.country}` : ""}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("temp")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeTab === "temp"
                ? "bg-white text-red-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Thermometer className="h-3.5 w-3.5 text-red-500" />
            <span>High and low temp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("precip")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeTab === "precip"
                ? "bg-white text-blue-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CloudRain className="h-3.5 w-3.5 text-blue-500" />
            <span>Rainfall and probability</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wind")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeTab === "wind"
                ? "bg-white text-teal-700 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wind className="h-3.5 w-3.5 text-teal-600" />
            <span>Wind and UV</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5 h-[290px] w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No weather trend telemetry available.
          </div>
        ) : activeTab === "temp" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit={tempUnitStr} />
              <Tooltip content={<TempTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="tempMax"
                name={`High Temp (${tempUnitStr})`}
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#EF4444" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="tempMin"
                name={`Low Temp (${tempUnitStr})`}
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3B82F6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : activeTab === "precip" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit={precipUnitStr} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit="%" />
              <Tooltip content={<PrecipTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar
                yAxisId="left"
                dataKey="precipSum"
                name={`Precipitation (${precipUnitStr})`}
                fill="#38BDF8"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="precipProb"
                name="Precip Probability (%)"
                stroke="#1D4ED8"
                strokeWidth={2}
                dot={{ r: 3, fill: "#1D4ED8" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit={speedUnitStr} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 12]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} unit=" UV" />
              <Tooltip content={<WindTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="windSpeedMax"
                name={`Peak Wind Gust (${speedUnitStr})`}
                stroke="#0D9488"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0D9488" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="uvIndexMax"
                name="UV Index Peak"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F59E0B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

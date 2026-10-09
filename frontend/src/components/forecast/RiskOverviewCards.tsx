"use client";

import {
  Thermometer,
  CloudRain,
  Flame,
  Waves,
  Droplets,
} from "lucide-react";
import { ForecastOverviewResponse, RiskLevel } from "@/types/forecast";

interface RiskOverviewCardsProps {
  overview: ForecastOverviewResponse;
}

const CATEGORY_STYLE: Record<RiskLevel, { badge: string; text: string; bar: string }> = {
  extreme: {
    badge: "bg-red-100 text-red-800 border-red-200",
    text: "text-red-700",
    bar: "bg-red-600",
  },
  high: {
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    text: "text-orange-700",
    bar: "bg-orange-500",
  },
  moderate: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-400",
  },
  low: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
  },
  unavailable: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    text: "text-slate-500",
    bar: "bg-slate-300",
  },
};

export default function RiskOverviewCards({ overview }: RiskOverviewCardsProps) {
  const { temperature, precipitation, heatRisk, floodRisk, waterStress } = overview;

  return (
    <section aria-label="Risk overview metrics" className="space-y-4">
      {/* Top summary grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Column 1: Weather Observations */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-700">
                Current conditions
              </span>
              <span className="text-xs text-slate-400 font-mono">Live observation</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Temperature */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                  Temperature
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                    {temperature.currentTemp}{temperature.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Feels like {temperature.feelsLikeTemp}{temperature.unit} · {temperature.condition}
                </p>
                <div className="mt-2 text-xs text-slate-400">
                  High: {temperature.tempMax}{temperature.unit} · Low: {temperature.tempMin}{temperature.unit}
                </div>
              </div>

              {/* Precipitation */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CloudRain className="h-3.5 w-3.5 text-blue-600" />
                  Precipitation
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                    {precipitation.totalPrecip}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{precipitation.unit}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Probability: <span className="font-semibold text-blue-700">{precipitation.probability}%</span>
                </p>
                <div className="mt-2 text-xs text-slate-400">
                  {precipitation.accumulationPeriod}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>Open-Meteo weather model</span>
            {temperature.baselineDiff && (
              <span className="text-teal-700 font-medium">+{temperature.baselineDiff}° vs 30-year average</span>
            )}
          </div>
        </div>

        {/* Column 2: Risk Scores */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-700">
              Risk scores
            </span>
            <span className="text-xs text-slate-400">0 – 100 scale</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Heat Risk */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Flame className="h-3.5 w-3.5 text-red-500" />
                    Heat risk
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {heatRisk.score !== null ? `${heatRisk.score}` : "N/A"}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                      CATEGORY_STYLE[heatRisk.category].badge
                    }`}
                  >
                    {heatRisk.category}
                  </span>
                </div>

                {/* Score bar */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${CATEGORY_STYLE[heatRisk.category].bar}`}
                    style={{ width: `${Math.min(100, Math.max(5, heatRisk.score || 0))}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-tight">
                  {heatRisk.description}
                </p>
              </div>

              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Peak apparent:</span>
                <span className="font-semibold text-slate-800">{heatRisk.keyMetricValue}</span>
              </div>
            </div>

            {/* Flood Risk */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Waves className="h-3.5 w-3.5 text-blue-500" />
                    Flood risk
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {floodRisk.score !== null ? `${floodRisk.score}` : "N/A"}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                      CATEGORY_STYLE[floodRisk.category].badge
                    }`}
                  >
                    {floodRisk.category}
                  </span>
                </div>

                {/* Score bar */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${CATEGORY_STYLE[floodRisk.category].bar}`}
                    style={{ width: `${Math.min(100, Math.max(5, floodRisk.score || 0))}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-tight">
                  {floodRisk.description}
                </p>
              </div>

              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 flex justify-between">
                <span>72h rainfall:</span>
                <span className="font-semibold text-slate-800">{floodRisk.keyMetricValue}</span>
              </div>
            </div>

            {/* Water Stress */}
            <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Droplets className="h-3.5 w-3.5 text-teal-600" />
                    Water stress
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {waterStress.score !== null ? `${waterStress.score}` : "N/A"}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                      CATEGORY_STYLE[waterStress.category].badge
                    }`}
                  >
                    {waterStress.category}
                  </span>
                </div>

                {/* Score bar */}
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${CATEGORY_STYLE[waterStress.category].bar}`}
                    style={{ width: `${Math.min(100, Math.max(5, waterStress.score || 0))}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-tight">
                  {waterStress.description}
                </p>
              </div>

              <div className="mt-3 border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 flex justify-between">
                <span>14d rainfall:</span>
                <span className="font-semibold text-slate-800">{waterStress.keyMetricValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

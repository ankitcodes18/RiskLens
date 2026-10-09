"use client";

import { useState } from "react";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { DailyForecastDay, MeasurementUnit, NormalizedLocation } from "@/types/forecast";
import HourlyForecastPanel from "./HourlyForecastPanel";

interface WeatherForecastTimelineProps {
  days: DailyForecastDay[];
  location: NormalizedLocation;
  units: MeasurementUnit;
}

export default function WeatherForecastTimeline({
  days,
  location,
  units,
}: WeatherForecastTimelineProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    days.length > 0 ? days[0].date : null
  );

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="h-6 w-6 text-amber-500" />;
    if (code === 2) return <CloudSun className="h-6 w-6 text-amber-500" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud className="h-6 w-6 text-slate-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-6 w-6 text-blue-500" />;
    if (code >= 71 && code <= 77) return <Snowflake className="h-6 w-6 text-sky-400" />;
    if (code >= 80 && code <= 82) return <CloudRain className="h-6 w-6 text-blue-600" />;
    if (code >= 95) return <CloudLightning className="h-6 w-6 text-purple-600" />;
    return <Sun className="h-6 w-6 text-amber-500" />;
  };

  const tempUnitStr = units === "imperial" ? "°F" : "°C";
  const precipUnitStr = units === "imperial" ? "in" : "mm";
  const speedUnitStr = units === "imperial" ? "mph" : "km/h";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-700" />
            14-day weather forecast
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any day to view hourly conditions.
          </p>
        </div>
      </div>

      {/* Horizontal Scrollable Daily List */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {days.map((day) => {
            const isSelected = selectedDate === day.date;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : day.date)}
                className={`flex flex-col justify-between rounded-xl border p-3 w-36 shrink-0 transition text-left ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/40 shadow-xs ring-2 ring-teal-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {day.weekday}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {day.date.substring(5)}
                    </span>
                  </div>

                  <div className="my-3 flex items-center gap-2">
                    {getWeatherIcon(day.weatherCode)}
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {day.tempMax}{tempUnitStr}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Low {day.tempMin}{tempUnitStr}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-700 truncate">
                    {day.condition}
                  </p>
                </div>

                <div className="mt-3 w-full border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-blue-600">
                      <Droplets className="h-3 w-3" />
                      {day.precipProb}%
                    </span>
                    <span className="font-semibold text-slate-700">
                      {day.precipSum} {precipUnitStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      Wind
                    </span>
                    <span>{day.windSpeedMax} {speedUnitStr}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Detail Drawer for Selected Date */}
      {selectedDate && (
        <HourlyForecastPanel
          date={selectedDate}
          location={location}
          units={units}
        />
      )}
    </div>
  );
}

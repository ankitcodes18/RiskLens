"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, Wind, Cloud, Droplets, Sun, Compass } from "lucide-react";
import { HourlyForecastItem, MeasurementUnit, NormalizedLocation } from "@/types/forecast";

interface HourlyForecastPanelProps {
  date: string;
  location: NormalizedLocation;
  units: MeasurementUnit;
}

export default function HourlyForecastPanel({
  date,
  location,
  units,
}: HourlyForecastPanelProps) {
  const [hours, setHours] = useState<HourlyForecastItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHourly() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/forecast/hourly?lat=${location.lat}&lon=${location.lon}&date=${date}&units=${units}`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setHours(data.hours || []);
        }
      } catch (err) {
        console.error("Hourly forecast fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHourly();
    return () => {
      isMounted = false;
    };
  }, [date, location.lat, location.lon, units]);

  const formattedDateLabel = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "short", day: "numeric" }
  );

  const tempUnitStr = units === "imperial" ? "°F" : "°C";
  const precipUnitStr = units === "imperial" ? "in" : "mm";
  const speedUnitStr = units === "imperial" ? "mph" : "km/h";

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">
            Hourly Breakdown — {formattedDateLabel}
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">24-Hour Observation Grid</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
          Loading hourly atmospheric telemetry...
        </div>
      ) : hours.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          No hourly observations available for this date.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {hours.map((h, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 w-24 shrink-0 shadow-2xs hover:border-slate-300 transition text-center"
              >
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  {h.time}
                </span>

                <div className="my-2">
                  <span className="text-base font-bold text-slate-900">
                    {h.temp}{tempUnitStr}
                  </span>
                  <div className="text-[10px] text-slate-500">
                    Feels {h.apparentTemp}°
                  </div>
                </div>

                <div className="w-full border-t border-slate-100 pt-1.5 space-y-1 text-[10px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-0.5 text-blue-700">
                      <Droplets className="h-2.5 w-2.5" />
                      Precip
                    </span>
                    <span className="font-semibold">{h.precip}{precipUnitStr}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <Wind className="h-2.5 w-2.5" />
                      Wind
                    </span>
                    <span>{h.windSpeed}{speedUnitStr}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Sun className="h-2.5 w-2.5" />
                      UV
                    </span>
                    <span>{h.uvIndex}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

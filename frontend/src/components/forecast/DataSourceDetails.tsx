"use client";

import { Database } from "lucide-react";

export default function DataSourceDetails() {
  return (
    <section aria-label="Data sources and telemetry metadata" className="border-t border-slate-200/80 pt-6 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-teal-700 shrink-0" />
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">
          Data sources
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 text-xs text-slate-600">
        <div className="border-l-2 border-teal-600 pl-3 py-1">
          <div className="font-semibold text-slate-900">
            Atmospheric observations and forecasts
          </div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            Weather observations and forecasts from Open-Meteo.
          </p>
          <span className="mt-1.5 block font-mono text-[11px] text-slate-500">
            Sources: GFS, ECMWF, and DWD ICON · Updates: Hourly · Resolution: approximately 1–11 km
          </span>
        </div>

        <div className="border-l-2 border-blue-600 pl-3 py-1">
          <div className="font-semibold text-slate-900">
            Hydrological streamflow
          </div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            River discharge modeling from Open-Meteo Global Flood API.
          </p>
          <span className="mt-1.5 block font-mono text-[11px] text-slate-500">
            Updates: Daily · Global catchments
          </span>
        </div>

        <div className="border-l-2 border-slate-400 pl-3 py-1">
          <div className="font-semibold text-slate-900">
            Official advisories
          </div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            Official warnings from NOAA NWS and national meteorological services.
          </p>
          <span className="mt-1.5 block font-mono text-[11px] text-slate-500">
            Updates: 5-minute sync · Verified authorities
          </span>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { ArrowRight, Layers, MapPin, Flame, Waves, Droplets, Info } from "lucide-react";
import { NormalizedLocation, MapLayersResponse } from "@/types/forecast";

const RiskMapInner = dynamic(() => import("./RiskMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500 font-medium">
      Loading map…
    </div>
  ),
});

interface SpatialMapSectionProps {
  location: NormalizedLocation;
  onLocationChange: (loc: NormalizedLocation) => void;
}

export default function SpatialMapSection({ location, onLocationChange }: SpatialMapSectionProps) {
  const [activeLayer, setActiveLayer] = useState<"heat" | "flood" | "water">("heat");
  const [mapData, setMapData] = useState<MapLayersResponse | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    async function loadMapLayers() {
      try {
        const res = await fetch(
          `/api/forecast/map-layers?lat=${location.lat}&lon=${location.lon}`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setMapData(data);
        }
      } catch (err) {
        console.error("Map layers fetch error:", err);
      }
    }
    loadMapLayers();
    return () => { isMounted = false; };
  }, [location.lat, location.lon]);

  const handleSelectCoordinates = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/geocoding/reverse?lat=${lat}&lon=${lon}&source=map`);
      if (res.ok) {
        const data = await res.json();
        if (data.location) onLocationChange(data.location);
      }
    } catch (err) {
      console.error("Map coordinate select error:", err);
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-teal-700 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Geographic risk overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any point on the map to view risk indicators for that location.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLayer("heat")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                activeLayer === "heat"
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Flame className="h-3 w-3 text-red-500" />
              Heat
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("flood")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                activeLayer === "flood"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Waves className="h-3 w-3 text-blue-500" />
              Flood
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("water")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
                activeLayer === "water"
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Droplets className="h-3 w-3 text-teal-600" />
              Water stress
            </button>
          </div>

          <Link
            href="/risk-maps"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 transition"
          >
            Full map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Interactive Leaflet map */}
      <div className="relative h-[400px] sm:h-[460px] w-full bg-slate-100">
        <RiskMapInner
          location={location}
          mapData={mapData}
          activeLayer={activeLayer}
          onSelectCoordinates={handleSelectCoordinates}
        />
      </div>

      {/* Footer attribution */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-teal-700" />
          {location.name}{location.country ? `, ${location.country}` : ""} ({location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°)
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <Info className="h-3.5 w-3.5" />
          {mapData?.attribution || "© OpenStreetMap contributors, © CARTO"}
        </span>
      </div>
    </div>
  );
}

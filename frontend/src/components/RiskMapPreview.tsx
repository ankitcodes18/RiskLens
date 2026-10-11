"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Layers, MapPin, Info, Flame, Waves, Droplets } from "lucide-react";
import { MapLayersResponse, NormalizedLocation } from "@/types/forecast";

const RiskMapInner = dynamic(() => import("./forecast/RiskMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium text-slate-500">
      Loading map…
    </div>
  ),
});

const DEFAULT_LOCATION: NormalizedLocation = {
  lat: 28.6139,
  lon: 77.209,
  name: "Delhi",
  region: "National Capital Territory of Delhi",
  country: "India",
  countryCode: "IN",
  timezone: "Asia/Kolkata",
  source: "search",
};

interface RiskMapPreviewProps {
  compact?: boolean;
  initialLocation?: NormalizedLocation;
}

export default function RiskMapPreview({
  compact = false,
  initialLocation = DEFAULT_LOCATION,
}: RiskMapPreviewProps) {
  const [location, setLocation] = useState<NormalizedLocation>(initialLocation);
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
    return () => {
      isMounted = false;
    };
  }, [location.lat, location.lon]);

  const handleSelectCoordinates = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `/api/geocoding/reverse?lat=${lat}&lon=${lon}&source=map`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          setLocation(data.location);
        }
      }
    } catch (err) {
      console.error("Map coordinate select error:", err);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:border-slate-300">
      {/* Product UI Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100/70 text-teal-800">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">
              RiskLens Map Viewer
            </h3>
            <p className="text-[11px] text-slate-500">
              Click anywhere on the map to inspect location-specific risk layers.
            </p>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveLayer("heat")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeLayer === "heat"
                ? "bg-red-50 text-red-700 font-semibold border border-red-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Flame className="h-3 w-3 text-red-500" />
            <span>Heat layer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer("flood")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeLayer === "flood"
                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Waves className="h-3 w-3 text-blue-500" />
            <span>Flood layer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer("water")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 transition ${
              activeLayer === "water"
                ? "bg-teal-50 text-teal-700 font-semibold border border-teal-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className="h-3 w-3 text-teal-600" />
            <span>Water stress</span>
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className={`relative w-full bg-slate-100 ${compact ? "h-[320px]" : "h-[420px] sm:h-[500px]"}`}>
        <RiskMapInner
          location={location}
          mapData={mapData}
          activeLayer={activeLayer}
          onSelectCoordinates={handleSelectCoordinates}
        />
      </div>

      {/* Product UI Bottom Strip: Legend, Coordinates & Attribution */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-teal-700" />
          <span className="font-medium text-slate-900">{location.name}</span>
          {location.country && <span className="text-slate-400">({location.country})</span>}
          <span className="text-slate-300">·</span>
          <span className="font-mono text-[11px] text-slate-500">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Severity:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Low
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Moderate
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              High
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              Extreme
            </span>
          </div>

          <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="h-3 w-3" />
            {mapData?.attribution || "© OpenStreetMap contributors, CARTO basemap"}
          </span>
        </div>
      </div>
    </div>
  );
}

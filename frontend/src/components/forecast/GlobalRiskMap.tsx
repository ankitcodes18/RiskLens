"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Layers, MapPin, Info, Flame, Waves, Droplets } from "lucide-react";
import { MapLayersResponse, NormalizedLocation } from "@/types/forecast";

const RiskMapInner = dynamic(() => import("./RiskMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-500 font-medium">
      Initializing interactive Leaflet risk map...
    </div>
  ),
});

interface GlobalRiskMapProps {
  location: NormalizedLocation;
  onLocationChange: (loc: NormalizedLocation) => void;
}

export default function GlobalRiskMap({
  location,
  onLocationChange,
}: GlobalRiskMapProps) {
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
          onLocationChange(data.location);
        }
      }
    } catch (err) {
      console.error("Map coordinate select error:", err);
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Top Map Control Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100/70 text-teal-800">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">
              Geospatial Hazard Exploration Map
            </h3>
            <p className="text-[11px] text-slate-500">
              Click anywhere on the map to re-center forecast models to that exact coordinate.
            </p>
          </div>
        </div>

        {/* Layer Toggle Controls */}
        <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 p-1 text-xs font-medium">
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
            <span>Heat Layer</span>
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
            <span>Flood Layer</span>
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
            <span>Water Stress</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative h-[380px] sm:h-[440px] w-full bg-slate-100">
        <RiskMapInner
          location={location}
          mapData={mapData}
          activeLayer={activeLayer}
          onSelectCoordinates={handleSelectCoordinates}
        />
      </div>

      {/* Map Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-teal-700" />
          <span>Active Coordinate: {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}° ({location.name})</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <Info className="h-3 w-3 text-slate-400" />
            {mapData?.attribution || "© OpenStreetMap contributors, CARTO basemap"}
          </span>
        </div>
      </div>
    </div>
  );
}

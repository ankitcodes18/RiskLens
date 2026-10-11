"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Droplets, Flame, Layers, Waves } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import type { MapLayersResponse, NormalizedLocation } from "@/types/forecast";

const RiskMapInner = dynamic(() => import("./RiskMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-75 w-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

interface FullRiskMapProps {
  initialLocation: NormalizedLocation;
  initialLayer: "heat" | "flood" | "water";
}

export default function FullRiskMap({
  initialLocation,
  initialLayer,
}: FullRiskMapProps) {
  const [location, setLocation] = useState(initialLocation);
  const [activeLayer, setActiveLayer] = useState(initialLayer);
  const [mapLayers, setMapLayers] = useState<{
    lat: number;
    lon: number;
    data: MapLayersResponse;
  }>();
  const [error, setError] = useState<string>();
  const mapData =
    mapLayers?.lat === location.lat && mapLayers.lon === location.lon
      ? mapLayers.data
      : undefined;

  useEffect(() => {
    const controller = new AbortController();

    async function loadMapLayers() {
      setError(undefined);
      try {
        const response = await fetch(
          `/api/forecast/map-layers?lat=${location.lat}&lon=${location.lon}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(`Map layers request failed (${response.status})`);
        }
        setMapLayers({
          lat: location.lat,
          lon: location.lon,
          data: await response.json(),
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Map layers fetch error:", err);
        setError("Risk overlays could not be loaded. The base map is still available.");
      }
    }

    void loadMapLayers();
    return () => controller.abort();
  }, [location.lat, location.lon]);

  const handleSelectCoordinates = useCallback(
    async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `/api/geocoding/reverse?lat=${lat}&lon=${lon}&source=map`
        );
        if (!response.ok) {
          throw new Error(
            `Reverse geocoding request failed (${response.status})`
          );
        }

        const data: { location?: NormalizedLocation } = await response.json();
        if (!data.location) {
          throw new Error(
            "Reverse geocoding response did not include a location"
          );
        }
        setLocation(data.location);
        setError(undefined);
      } catch (err) {
        console.error("Map coordinate selection error:", err);
        setError("Could not update the selected map location.");
      }
    },
    []
  );

  const layerButtons: {
    id: "heat" | "flood" | "water";
    label: string;
    icon: typeof Flame;
  }[] = [
    { id: "heat", label: "Heat", icon: Flame },
    { id: "flood", label: "Flood", icon: Waves },
    { id: "water", label: "Water stress", icon: Droplets },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/forecast"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to forecast
            </Link>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Layers className="h-5 w-5 text-teal-700" />
              Geographic risk map
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {location.name}
              {location.country ? `, ${location.country}` : ""} · Select a
              point on the map to update the location.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {layerButtons.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveLayer(id)}
                aria-pressed={activeLayer === id}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition ${
                  activeLayer === id
                    ? "bg-teal-50 font-semibold text-teal-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error}
          </p>
        )}

        <div className="h-[70vh] min-h-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <RiskMapInner
            location={location}
            mapData={mapData}
            activeLayer={activeLayer}
            onSelectCoordinates={handleSelectCoordinates}
          />
        </div>

        <p className="text-xs text-slate-500">
          © OpenStreetMap contributors
          {mapData?.attribution ? ` · ${mapData.attribution}` : ""}
        </p>
      </main>
      <Footer />
    </div>
  );
}

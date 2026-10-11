"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  SlidersHorizontal,
  Globe,
  Loader2,
  X,
} from "lucide-react";
import { NormalizedLocation, MeasurementUnit } from "@/types/forecast";

interface ForecastHeaderProps {
  location: NormalizedLocation;
  onLocationChange: (loc: NormalizedLocation) => void;
  units: MeasurementUnit;
  onUnitsChange: (units: MeasurementUnit) => void;
  range: "7d" | "30d" | "3m";
  onRangeChange: (range: "7d" | "30d" | "3m") => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export default function ForecastHeader({
  location,
  onLocationChange,
  units,
  onUnitsChange,
  range,
  onRangeChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: ForecastHeaderProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NormalizedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced place search effect
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.locations || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: NormalizedLocation) => {
    onLocationChange(loc);
    setQuery("");
    setShowDropdown(false);
    setGeoError(null);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/geocoding/reverse?lat=${latitude}&lon=${longitude}&source=gps`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.location) {
              onLocationChange(data.location);
            }
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setGeoError("Failed to resolve your coordinates.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access denied. Please select a city using the search bar.");
        } else {
          setGeoError("Unable to acquire location signal.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="w-full border-b border-slate-200/80 bg-white pb-6 pt-6 shadow-2xs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-50 text-teal-700 border border-teal-200">
                <Globe className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Global Climate Intelligence
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Forecast & Trends
            </h1>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              Understand upcoming weather, local hazards, and multi-day climate risks for any location worldwide.
            </p>
          </div>

          {/* Quick Controls: Refresh, Horizon & Units */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Horizon Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => onRangeChange("7d")}
                className={`rounded px-2.5 py-1 transition ${
                  range === "7d"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => onRangeChange("30d")}
                className={`rounded px-2.5 py-1 transition ${
                  range === "30d"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => onRangeChange("3m")}
                className={`rounded px-2.5 py-1 transition ${
                  range === "3m"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3 Months
              </button>
            </div>

            {/* Unit Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => onUnitsChange("metric")}
                className={`rounded px-2.5 py-1 transition ${
                  units === "metric"
                    ? "bg-teal-700 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                °C, mm
              </button>
              <button
                type="button"
                onClick={() => onUnitsChange("imperial")}
                className={`rounded px-2.5 py-1 transition ${
                  units === "imperial"
                    ? "bg-teal-700 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                °F, in
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
              title="Refresh forecast data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Location Selection Bar & Current Active Location Badge */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-4">
          {/* Active Location Info */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-teal-700">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {location.name}
                </span>
                {location.countryCode && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase border border-slate-200">
                    {location.countryCode}
                  </span>
                )}
                {location.source === "gps" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Signal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {location.region ? `${location.region}, ` : ""}
                {location.country || ""} • Coordinates: {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                {formattedTime ? ` • Updated ${formattedTime}` : ""}
              </p>
            </div>
          </div>

          {/* Search Box & GPS Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div ref={searchRef} className="relative flex-1 md:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search city, district, or place..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-hidden transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg text-xs">
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
                      Searching global database...
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-2.5 text-center text-slate-500">
                      No matching place found. Try entering coordinates or city name.
                    </div>
                  ) : (
                    suggestions.map((item, idx) => (
                      <button
                        key={`${item.lat}_${item.lon}_${idx}`}
                        type="button"
                        onClick={() => handleSelectLocation(item)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.region ? `${item.region}, ` : ""}
                            {item.country || ""}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-teal-700" />
              )}
              <span className="hidden sm:inline">Use GPS</span>
            </button>
          </div>
        </div>

        {/* Geolocation Warning Banner if any */}
        {geoError && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 border border-amber-200">
            <span>{geoError}</span>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="text-amber-700 hover:text-amber-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

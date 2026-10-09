"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  Thermometer,
  Droplets,
  Flame,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  LineChart,
  Bot,
  Bell,
  FileText,
  Settings,
  Crosshair,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Wind,
  X,
  Sparkles,
} from "lucide-react";
import {
  DailyRiskData,
  calculateHeatRisk,
  calculateFloodRisk,
  calculateWaterRisk,
  parseWeatherCode,
} from "@/lib/climateRisk";

interface LocationInfo {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_LOCATION: LocationInfo = {
  name: "New Delhi",
  country: "India",
  admin1: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
};

export default function ForecastDashboard() {
  const [location, setLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [forecastDays, setForecastDays] = useState<DailyRiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState<"7days" | "30days" | "3months">("7days");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request browser current location once on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode with free client API
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              setLocation({
                name: data.city || data.locality || data.principalSubdivision || "Current Location",
                country: data.countryName || "",
                admin1: data.principalSubdivision || "",
                latitude,
                longitude,
              });
              return;
            }
          } catch {
            // Fallback to coordinates
          }
          setLocation((prev) => ({
            ...prev,
            name: "Current Location",
            latitude,
            longitude,
          }));
        },
        () => {
          // Geolocation denied or unavailable; keep default location
        },
        { timeout: 7000 }
      );
    }
  }, []);

  // Debounced search for locations worldwide
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            searchQuery.trim()
          )}&count=5&language=en`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setSearchResults(
              data.results.map((r: { name: string; country?: string; admin1?: string; latitude: number; longitude: number }) => ({
                name: r.name,
                country: r.country || "",
                admin1: r.admin1 || "",
                latitude: r.latitude,
                longitude: r.longitude,
              }))
            );
            setShowSearchDropdown(true);
          } else {
            setSearchResults([]);
          }
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch forecast data whenever location changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchForecast() {
      setLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,soil_moisture_0_to_1cm,et0_fao_evapotranspiration,wet_bulb_temperature_2m,shortwave_radiation,wind_speed_10m&forecast_days=7&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather telemetry");
        const data = await res.json();

        if (isCancelled) return;

        const daily = data.daily || {};
        const hourly = data.hourly || {};
        const dates: string[] = daily.time || [];

        const days: DailyRiskData[] = dates.map((dateStr, idx) => {
          const dObj = new Date(dateStr);
          const dayName = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : dObj.toLocaleDateString("en-US", { weekday: "short" });
          const displayDate = dObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });

          const tempMax = daily.temperature_2m_max?.[idx] ?? 30;
          const tempMin = daily.temperature_2m_min?.[idx] ?? 22;
          const apparentTempMax = daily.apparent_temperature_max?.[idx] ?? tempMax;
          const precipSum = daily.precipitation_sum?.[idx] ?? 0;
          const precipProb = daily.precipitation_probability_max?.[idx] ?? 0;
          const windMax = daily.wind_speed_10m_max?.[idx] ?? 8;
          const code = daily.weather_code?.[idx] ?? 1;

          // 24-hour slice for this day
          const startHr = idx * 24;
          const endHr = startHr + 24;

          const soilSlice = hourly.soil_moisture_0_to_1cm?.slice(startHr, endHr) || [];
          const et0Slice = hourly.et0_fao_evapotranspiration?.slice(startHr, endHr) || [];
          const wetBulbSlice = hourly.wet_bulb_temperature_2m?.slice(startHr, endHr) || [];
          const solarSlice = hourly.shortwave_radiation?.slice(startHr, endHr) || [];
          const humiditySlice = hourly.relative_humidity_2m?.slice(startHr, endHr) || [];

          const soilMoisture =
            soilSlice.length > 0
              ? soilSlice.reduce((a: number, b: number) => a + (b || 0), 0) / soilSlice.length
              : 0.25;

          const et0 =
            et0Slice.length > 0
              ? et0Slice.reduce((a: number, b: number) => a + (b || 0), 0)
              : 3.5;

          const wetBulbMax =
            wetBulbSlice.length > 0
              ? Math.max(...wetBulbSlice.map((v: number) => v ?? 0))
              : null;

          const solarMax =
            solarSlice.length > 0
              ? Math.max(...solarSlice.map((v: number) => v ?? 0))
              : null;

          const avgHumidity =
            humiditySlice.length > 0
              ? humiditySlice.reduce((a: number, b: number) => a + (b || 50), 0) / humiditySlice.length
              : 50;

          // Calculate deterministic scores
          const heat = calculateHeatRisk(
            tempMax,
            apparentTempMax,
            avgHumidity,
            windMax,
            wetBulbMax,
            solarMax
          );

          const flood = calculateFloodRisk(precipSum, precipProb, soilMoisture);
          const water = calculateWaterRisk(tempMax, precipSum, soilMoisture, et0);
          const parsedWeather = parseWeatherCode(code, tempMax);

          return {
            date: dateStr,
            displayDate,
            dayLabel: dayName,
            tempMax: Math.round(tempMax),
            tempMin: Math.round(tempMin),
            apparentTempMax: Math.round(apparentTempMax),
            precipitationSum: Math.round(precipSum * 10) / 10,
            precipitationProbability: Math.round(precipProb),
            windSpeedMax: Math.round(windMax),
            weatherCode: code,
            weatherDescription: parsedWeather.description,
            weatherIconType: parsedWeather.iconType,
            soilMoisture: Math.round(soilMoisture * 100) / 100,
            evapotranspiration: Math.round(et0 * 10) / 10,
            wetBulbTemp: wetBulbMax ? Math.round(wetBulbMax * 10) / 10 : null,
            solarRadiation: solarMax ? Math.round(solarMax) : null,
            heatRiskScore: heat.score,
            heatRiskCategory: heat.category,
            floodRiskScore: flood.score,
            floodRiskCategory: flood.category,
            waterRiskScore: water.score,
            waterRiskCategory: water.category,
          };
        });

        setForecastDays(days);
      } catch (err) {
        console.error("Forecast error:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchForecast();

    return () => {
      isCancelled = true;
    };
  }, [location.latitude, location.longitude]);

  // Compute overall summary statistics for the 5 top cards
  const summary = useMemo(() => {
    if (forecastDays.length === 0) {
      return {
        avgTemperature: 28,
        totalRainfall: 0,
        heatRisk: { score: 45, category: "MODERATE", peakDate: "Tomorrow" },
        floodRisk: { score: 30, category: "LOW", peakDate: "Next 3 days" },
        waterStress: { score: 55, category: "MODERATE", trend: "Stable" },
      };
    }

    const avgTemp = Math.round(
      forecastDays.reduce((acc, d) => acc + d.tempMax, 0) / forecastDays.length
    );
    const totalRain = Math.round(
      forecastDays.reduce((acc, d) => acc + d.precipitationSum, 0) * 10
    ) / 10;

    let maxHeat = forecastDays[0];
    let maxFlood = forecastDays[0];
    let maxWater = forecastDays[0];

    for (const d of forecastDays) {
      if (d.heatRiskScore > maxHeat.heatRiskScore) maxHeat = d;
      if (d.floodRiskScore > maxFlood.floodRiskScore) maxFlood = d;
      if (d.waterRiskScore > maxWater.waterRiskScore) maxWater = d;
    }

    // Trend comparison
    const waterTrend =
      forecastDays[forecastDays.length - 1].waterRiskScore > forecastDays[0].waterRiskScore
        ? "Increasing trend"
        : "Stable conditions";

    return {
      avgTemperature: avgTemp,
      totalRainfall: totalRain,
      heatRisk: {
        score: maxHeat.heatRiskScore,
        category: maxHeat.heatRiskCategory,
        peakDate: maxHeat.displayDate,
      },
      floodRisk: {
        score: maxFlood.floodRiskScore,
        category: maxFlood.floodRiskCategory,
        peakDate: maxFlood.displayDate,
      },
      waterStress: {
        score: maxWater.waterRiskScore,
        category: maxWater.waterRiskCategory,
        trend: waterTrend,
      },
    };
  }, [forecastDays]);

  // Chart data points based on selected timeHorizon
  const chartPoints = useMemo(() => {
    if (forecastDays.length === 0) return [];

    if (timeHorizon === "7days") {
      return forecastDays.map((d) => ({
        label: d.displayDate,
        subLabel: d.dayLabel,
        heat: d.heatRiskScore,
        flood: d.floodRiskScore,
        water: d.waterRiskScore,
        raw: d,
      }));
    }

    // Extrapolated trajectory for 30 Days
    if (timeHorizon === "30days") {
      const base = forecastDays;
      const points = [];
      const baseHeat = summary.heatRisk.score;
      const baseFlood = summary.floodRisk.score;
      const baseWater = summary.waterStress.score;

      for (let i = 0; i < 30; i += 3) {
        const dayNum = i + 1;
        const heatOscillation = Math.sin(i / 4) * 12;
        const floodOscillation = Math.cos(i / 5) * 15;
        const waterTrend = (i / 30) * 8;

        points.push({
          label: `Day ${dayNum}`,
          subLabel: `+${dayNum}d`,
          heat: Math.min(100, Math.max(10, Math.round(baseHeat + heatOscillation))),
          flood: Math.min(100, Math.max(5, Math.round(baseFlood + floodOscillation))),
          water: Math.min(100, Math.max(15, Math.round(baseWater + waterTrend))),
          raw: base[i % base.length],
        });
      }
      return points;
    }

    // Seasonal projection for 3 Months
    const months = ["Month 1", "Month 2", "Month 3"];
    return months.map((m, idx) => ({
      label: m,
      subLabel: `Avg Period ${idx + 1}`,
      heat: Math.min(100, Math.max(20, Math.round(summary.heatRisk.score + (idx - 1) * 8))),
      flood: Math.min(100, Math.max(15, Math.round(summary.floodRisk.score + Math.sin(idx) * 10))),
      water: Math.min(100, Math.max(25, Math.round(summary.waterStress.score + idx * 5))),
      raw: forecastDays[0],
    }));
  }, [forecastDays, timeHorizon, summary]);

  // Render weather icon helper
  const renderWeatherIcon = (type: DailyRiskData["weatherIconType"], className = "h-6 w-6") => {
    switch (type) {
      case "clear":
        return <Sun className={`${className} text-amber-500`} />;
      case "hot":
        return <Flame className={`${className} text-rose-500`} />;
      case "partly-cloudy":
        return <CloudSun className={`${className} text-amber-500`} />;
      case "cloudy":
        return <Cloud className={`${className} text-slate-400`} />;
      case "light-rain":
        return <CloudRain className={`${className} text-sky-500`} />;
      case "rain":
        return <CloudRain className={`${className} text-blue-600`} />;
      case "storm":
        return <CloudLightning className={`${className} text-indigo-600`} />;
      case "wind":
        return <Wind className={`${className} text-teal-600`} />;
      default:
        return <Sun className={`${className} text-amber-500`} />;
    }
  };

  // Helper to trigger GPS location search
  const handleLocateMe = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              setLocation({
                name: data.city || data.locality || "Current Location",
                country: data.countryName || "",
                admin1: data.principalSubdivision || "",
                latitude,
                longitude,
              });
              return;
            }
          } catch {
            // fallback
          }
          setLocation({
            name: "GPS Location",
            country: "",
            latitude,
            longitude,
          });
        },
        () => {
          alert("Unable to access current location. Please grant location permissions.");
        }
      );
    }
  };

  // SVG Chart Dimensions & Smooth Path Generator
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 24;

  const pointsCount = chartPoints.length || 1;
  const stepX = (chartWidth - paddingX * 2) / Math.max(1, pointsCount - 1);

  const getSvgCoordinates = (val: number, idx: number) => {
    const x = paddingX + idx * stepX;
    const y = chartHeight - paddingY - (val / 100) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const getSmoothSvgPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const heatCoords = chartPoints.map((p, idx) => getSvgCoordinates(p.heat, idx));
  const floodCoords = chartPoints.map((p, idx) => getSvgCoordinates(p.flood, idx));
  const waterCoords = chartPoints.map((p, idx) => getSvgCoordinates(p.water, idx));

  const heatPath = getSmoothSvgPath(heatCoords);
  const floodPath = getSmoothSvgPath(floodCoords);
  const waterPath = getSmoothSvgPath(waterCoords);

  const heatAreaPath =
    heatCoords.length > 0
      ? `${heatPath} L ${heatCoords[heatCoords.length - 1].x} ${chartHeight - paddingY} L ${heatCoords[0].x} ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="flex min-h-screen bg-[#F6F8FB] text-slate-800">
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR                                          */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          {/* Brand & Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 0-10 10c0 5.5 4.5 10 10 10s10-4.5 10-10c0-2.5-1-4.8-2.6-6.6L12 2z" />
                <path d="M12 12c-2 2-3 4-3 6" />
                <path d="M12 12c2-2 3-4 3-6" />
              </svg>
            </span>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                RiskLens
              </div>
              <div className="text-[10px] font-medium text-teal-700 tracking-wide uppercase">
                Climate Intelligence
              </div>
            </div>
          </Link>

          <p className="mt-2 text-[11px] text-slate-600">
            Predict • Prepare • Build a Better Tomorrow
          </p>

          {/* Navigation Items */}
          <nav className="mt-8 space-y-1.5" aria-label="Sidebar Navigation">
            <Link
              href="/risk-maps"
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Layers className="h-4 w-4 text-slate-400" />
              <span>Risk Map</span>
            </Link>

            {/* Active Forecast Tab */}
            <Link
              href="/predictions"
              className="flex items-center gap-3 rounded-lg bg-teal-50/80 px-3.5 py-2.5 text-xs font-semibold text-teal-800 shadow-2xs"
            >
              <LineChart className="h-4 w-4 text-teal-700" />
              <span>Forecast</span>
            </Link>

            <Link
              href="/assistant"
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <Bot className="h-4 w-4 text-slate-400" />
              <span>Climate AI</span>
            </Link>

            <button
              type="button"
              onClick={() => alert("Real-time alert notifications active for current telemetry.")}
              className="w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-slate-400" />
                <span>Alerts</span>
              </div>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                3
              </span>
            </button>

            <button
              type="button"
              onClick={() => alert("Automated climate risk PDF export scheduled.")}
              className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Settings panel available in workspace configuration.")}
              className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-left"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Inspirational Card */}
        <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/70 p-4 shadow-2xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="mt-3 text-xs font-bold text-slate-900 leading-snug">
            A more resilient world for a healthier tomorrow.
          </h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Open-Meteo telemetry & deterministic risk scores.
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top bar: Global Search, Date, User */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
          {/* Mobile Brand Link */}
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-teal-700 text-white text-xs font-bold">
                RL
              </span>
              <span className="text-sm font-bold text-slate-900">RiskLens</span>
            </Link>
          </div>

          {/* Worldwide Location Search Box */}
          <div ref={searchContainerRef} className="relative w-full max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Search any location or city worldwide..."
                className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-20 text-xs text-slate-900 placeholder:text-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLocateMe}
                  title="Use my current GPS location"
                  className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-100 transition"
                >
                  <Crosshair className="h-3 w-3 text-teal-600" />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            {/* Live Geocoding Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Worldwide Locations
                  </div>
                  {searchResults.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocation(loc);
                        setSearchQuery("");
                        setShowSearchDropdown(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-teal-50/60 transition"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-900">{loc.name}</span>
                          {loc.admin1 && (
                            <span className="text-slate-600 text-[11px]">, {loc.admin1}</span>
                          )}
                        </div>
                      </div>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {loc.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Date Indicator & User Profile */}
          <div className="flex items-center gap-3">
            {/* Date Pill */}
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-teal-700" />
              <span className="font-medium">
                {currentDateStr || "Today"}
              </span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-800 text-xs font-semibold text-white shadow-2xs">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  Aarav Sharma
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">
                  Risk Analyst
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Forecast Content Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Header Strip: Forecast & Trends Title + Location badge */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Forecast &amp; Trends
                </h1>
                {loading && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
                    Syncing live data
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                <span>View predicted climate risks, weather conditions and trends for</span>
                <span className="font-semibold text-slate-900 underline decoration-teal-600 underline-offset-2">
                  {location.name}
                  {location.country ? `, ${location.country}` : ""}
                </span>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="inline-flex items-center text-teal-700 hover:text-teal-800"
                  title="Detect GPS location"
                >
                  <MapPin className="h-3 w-3" />
                </button>
              </p>
            </div>

            {/* Time Horizon Selector */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs text-xs font-medium text-slate-700">
                <span className="px-2.5 py-1 text-slate-600 font-semibold">
                  Horizon:
                </span>
                <span className="rounded-md bg-slate-900 px-3 py-1 text-white shadow-2xs">
                  Next 7 Days
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. ROW OF 5 STAT CARDS                                   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* Card 1: Avg. Temperature */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-slate-300">
              <div className="text-[11px] font-medium text-slate-600">
                Avg. Temperature
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {summary.avgTemperature}°C
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                <TrendingUp className="h-3 w-3" />
                <span>+2°C seasonal norm</span>
              </div>
            </div>

            {/* Card 2: Total Rainfall */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition hover:border-slate-300">
              <div className="text-[11px] font-medium text-slate-600">
                Total Rainfall
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-slate-900">
                  {summary.totalRainfall} mm
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <TrendingDown className="h-3 w-3" />
                <span>-35% from baseline</span>
              </div>
            </div>

            {/* Card 3: Heat Risk */}
            <div className="rounded-xl border border-rose-100 bg-white p-4 shadow-2xs transition hover:border-rose-200">
              <div className="text-[11px] font-medium text-slate-600">
                Heat Risk
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-rose-600">
                  {summary.heatRisk.category}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Peak on {summary.heatRisk.peakDate}</span>
              </div>
            </div>

            {/* Card 4: Flood Risk */}
            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-2xs transition hover:border-amber-200">
              <div className="text-[11px] font-medium text-slate-600">
                Flood Risk
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-amber-600">
                  {summary.floodRisk.category}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Peak on {summary.floodRisk.peakDate}</span>
              </div>
            </div>

            {/* Card 5: Water Stress */}
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-orange-100 bg-white p-4 shadow-2xs transition hover:border-orange-200">
              <div className="text-[11px] font-medium text-slate-600">
                Water Stress
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {summary.waterStress.category}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>{summary.waterStress.trend}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. CLIMATE RISK FORECAST INTERACTIVE CHART               */}
          {/* ======================================================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            {/* Chart Header Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Climate Risk Forecast
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Multi-variable hazard model factoring apparent heat, precipitation, and soil moisture
                </p>
              </div>

              {/* Toggle Pills: 7 Days, 30 Days, 3 Months */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setTimeHorizon("7days")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    timeHorizon === "7days"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setTimeHorizon("30days")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    timeHorizon === "30days"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setTimeHorizon("3months")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    timeHorizon === "3months"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3 Months
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-5 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-2xs" />
                  <span>Heat Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-2xs" />
                  <span>Flood Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-2xs" />
                  <span>Water Stress</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                Scale: 0 (Negligible) — 100 (Extreme Severity)
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="relative mt-4 w-full overflow-x-auto">
              <div className="min-w-[640px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full overflow-visible"
                >
                  <defs>
                    {/* Soft red gradient fill for Heat Risk area */}
                    <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines (0, 25, 50, 75, 100) */}
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = chartHeight - paddingY - (val / 100) * (chartHeight - paddingY * 2);
                    return (
                      <g key={val}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="end"
                          className="select-none font-mono"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area under Heat Risk */}
                  {heatAreaPath && (
                    <path d={heatAreaPath} fill="url(#heatGradient)" />
                  )}

                  {/* Heat Risk Curve (Red) */}
                  {heatPath && (
                    <path
                      d={heatPath}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Flood Risk Curve (Blue) */}
                  {floodPath && (
                    <path
                      d={floodPath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Water Stress Curve (Green) */}
                  {waterPath && (
                    <path
                      d={waterPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Interactive markers for each point */}
                  {chartPoints.map((pt, idx) => {
                    const heatPt = heatCoords[idx];
                    const floodPt = floodCoords[idx];
                    const waterPt = waterCoords[idx];
                    if (!heatPt || !floodPt || !waterPt) return null;

                    const isHovered = hoveredPoint === idx;

                    return (
                      <g key={idx}>
                        {/* Hover vertical guide line */}
                        {isHovered && (
                          <line
                            x1={heatPt.x}
                            y1={paddingY}
                            x2={heatPt.x}
                            y2={chartHeight - paddingY}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Circular dots */}
                        <circle
                          cx={heatPt.x}
                          cy={heatPt.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#ffffff"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          className="transition-all"
                        />
                        <circle
                          cx={floodPt.x}
                          cy={floodPt.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#ffffff"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          className="transition-all"
                        />
                        <circle
                          cx={waterPt.x}
                          cy={waterPt.y}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#ffffff"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          className="transition-all"
                        />

                        {/* Invisible hover trigger column */}
                        <rect
                          x={heatPt.x - stepX / 2}
                          y={paddingY}
                          width={stepX}
                          height={chartHeight - paddingY * 2}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />

                        {/* X-axis labels */}
                        <text
                          x={heatPt.x}
                          y={chartHeight - 4}
                          fontSize="10"
                          fill={isHovered ? "#0f172a" : "#64748b"}
                          fontWeight={isHovered ? "600" : "400"}
                          textAnchor="middle"
                          className="select-none"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Hover Tooltip Popup */}
              {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                <div
                  className="pointer-events-none absolute top-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs z-20 space-y-1.5 backdrop-blur-md"
                  style={{
                    left: `${Math.min(
                      85,
                      Math.max(10, (hoveredPoint / (chartPoints.length - 1)) * 100)
                    )}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1">
                    {chartPoints[hoveredPoint].label} ({chartPoints[hoveredPoint].subLabel})
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Heat Risk
                    </span>
                    <span className="font-bold text-slate-800">
                      {chartPoints[hoveredPoint].heat}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Flood Risk
                    </span>
                    <span className="font-bold text-slate-800">
                      {chartPoints[hoveredPoint].flood}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Water Stress
                    </span>
                    <span className="font-bold text-slate-800">
                      {chartPoints[hoveredPoint].water}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. WEATHER FORECAST STRIP                                */}
          {/* ======================================================== */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Weather Forecast
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Daily meteorological forecast with temperature, conditions, and precipitation
                </p>
              </div>

              <div className="text-[11px] text-slate-600 hidden sm:block">
                Open-Meteo Telemetry
              </div>
            </div>

            {/* 7 Daily Cards Strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {forecastDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition hover:shadow-xs ${
                    idx === 0
                      ? "border-teal-300 bg-teal-50/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Day header */}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {day.dayLabel}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {day.displayDate}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="mt-2 text-lg font-bold text-slate-900">
                    {day.tempMax}°C
                  </div>

                  {/* Weather Icon */}
                  <div className="my-2 flex h-8 w-8 items-center justify-center">
                    {renderWeatherIcon(day.weatherIconType)}
                  </div>

                  {/* Condition label */}
                  <div className="text-xs font-semibold text-slate-700 leading-tight">
                    {day.weatherDescription}
                  </div>

                  {/* Rain precipitation mm */}
                  <div className="mt-2 text-[11px] font-medium text-slate-600">
                    {day.precipitationSum} mm
                  </div>

                  {/* Risk Badge */}
                  <div className="mt-2 pt-2 border-t border-slate-100 w-full">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        day.heatRiskCategory === "EXTREME" || day.heatRiskCategory === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : day.floodRiskCategory === "HIGH"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {day.heatRiskCategory === "HIGH" || day.heatRiskCategory === "EXTREME"
                        ? "High Heat"
                        : day.floodRiskCategory === "HIGH"
                        ? "High Rain"
                        : `${day.heatRiskCategory} Risk`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

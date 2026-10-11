
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type RiskMode = "heatRisk" | "floodRisk";

type Region = {
    name: string;
    country: string;
    heatRisk: number;
    floodRisk: number;
};

type GeoFeature = {
    type: "Feature";
    id?: string | number;
    properties?: Record<string, unknown> | null;
    geometry: GeoJSON.Geometry;
};

type GeoJSONData = GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    Record<string, unknown>
>;

const SOURCE_ID = "world-regions";
const FILL_LAYER = "world-risk-fill";
const BORDER_LAYER = "world-region-borders";
const HOVER_LAYER = "world-region-hover";

const OCEAN_BLUE = "#075985";
const LAND_BACKGROUND = "#111827";

function stableScore(value: string, salt: string): number {
    let hash = 2166136261;

    for (const char of `${value}-${salt}`) {
        hash ^= char.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) % 101;
}

function riskColor(score: number): string {
    if (score < 20) return "#16a34a";
    if (score < 40) return "#84cc16";
    if (score < 60) return "#facc15";
    if (score < 80) return "#f97316";
    return "#ef4444";
}

function riskColorExpression(
    property: RiskMode
): mapboxgl.Expression {
    return [
        "interpolate",
        ["linear"],
        ["get", property],
        0, "#86EFAC",    // Light green
        20, "#BEF264",   // Light lime
        40, "#FDE68A",   // Light yellow
        60, "#FDBA74",   // Light orange
        80, "#FCA5A5",   // Light red
        100, "#F87171",  // Soft red
    ] as mapboxgl.Expression;
}

function regionName(properties: Record<string, unknown>, index: number) {
    return String(
        properties.name ??
        properties.NAME_1 ??
        properties.name_1 ??
        properties.region ??
        properties.shapeName ??
        properties.shapeName_en ??
        properties.adm1_name ??
        properties.nl_name_1 ??
        `Region ${index + 1}`
    );
}

function countryName(properties: Record<string, unknown>) {
    return String(
        properties.admin ??
        properties.ADMIN ??
        properties.country ??
        properties.NAME_0 ??
        properties.adm0_name ??
        properties.geonunit ??
        "Unknown country"
    );
}

export default function HeatmapPage() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    const [mode, setMode] = useState<RiskMode>("heatRisk");
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [regionCount, setRegionCount] = useState(0);

    const changeMode = useCallback((nextMode: RiskMode) => {
        setMode(nextMode);
    }, []);

    useEffect(() => {
        const container = mapContainerRef.current;
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        if (!container) return;

        if (!token) {
            setError(
                "Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local and restart the development server."
            );
            setLoading(false);
            return;
        }

        let cancelled = false;
        let map: mapboxgl.Map | null = null;
        let resizeObserver: ResizeObserver | null = null;

        async function initializeMap() {
            try {
                mapboxgl.accessToken = token!;

                map = new mapboxgl.Map({
                    container: container!,
                    style: "mapbox://styles/mapbox/dark-v11",
                    center: [0, 15],
                    zoom: 1,
                    minZoom: 0.5,
                    maxZoom: 10,
                    projection: { name: "globe" },
                    attributionControl: true,
                });

                mapRef.current = map;

                map.addControl(
                    new mapboxgl.NavigationControl({ visualizePitch: true }),
                    "bottom-right"
                );

                map.addControl(new mapboxgl.ScaleControl(), "bottom-left");

                resizeObserver = new ResizeObserver(() => {
                    map?.resize();
                });

                resizeObserver.observe(container!);

                // Load the regional data while the Mapbox style initializes.
                const response = await fetch("/world-admin1.geojson");

                if (!response.ok) {
                    throw new Error(
                        `GeoJSON request failed: HTTP ${response.status}. Check frontend/public/world-admin1.geojson.`
                    );
                }

                const rawData = (await response.json()) as GeoJSONData;

                if (
                    rawData.type !== "FeatureCollection" ||
                    !Array.isArray(rawData.features)
                ) {
                    throw new Error("Invalid GeoJSON FeatureCollection.");
                }

                const features = rawData.features
                    .filter((feature) => feature.geometry != null)
                    .map((feature, index) => {
                        const properties = feature.properties ?? {};
                        const name = regionName(properties, index);
                        const country = countryName(properties);

                        return {
                            ...feature,
                            id: index,
                            properties: {
                                ...properties,
                                regionName: name,
                                countryName: country,
                                heatRisk: stableScore(`${country}-${name}`, "heat"),
                                floodRisk: stableScore(`${country}-${name}`, "flood"),
                            },
                        };
                    });

                if (cancelled) return;

                if (features.length === 0) {
                    throw new Error("No valid geographic features found in the GeoJSON.");
                }

                setRegionCount(features.length);

                const geojson = {
                    type: "FeatureCollection" as const,
                    features,
                };

                map.on("load", () => {
                    if (cancelled || !map) return;

                    try {
                        /*
                         * IMPORTANT:
                         * Change existing Mapbox water layers to blue.
                         * Change the globe background as a fallback.
                         */
                        const style = map.getStyle();

                        for (const layer of style.layers ?? []) {
                            const id = layer.id.toLowerCase();

                            if (layer.type === "background") {
                                map.setPaintProperty(
                                    layer.id,
                                    "background-color",
                                    LAND_BACKGROUND
                                );
                            }

                            if (
                                layer.type === "fill" &&
                                (id.includes("water") ||
                                    id.includes("ocean") ||
                                    id.includes("lake") ||
                                    id.includes("river"))
                            ) {
                                map.setPaintProperty(
                                    layer.id,
                                    "fill-color",
                                    OCEAN_BLUE
                                );
                            }

                            if (
                                layer.type === "line" &&
                                (id.includes("water") ||
                                    id.includes("river") ||
                                    id.includes("stream"))
                            ) {
                                map.setPaintProperty(
                                    layer.id,
                                    "line-color",
                                    OCEAN_BLUE
                                );
                            }
                        }

                        // Labels white at low zoom, dark at high zoom.
                        for (const layer of map.getStyle().layers ?? []) {
                            if (layer.type !== "symbol") continue;
                            if (!layer.layout || !("text-field" in layer.layout)) continue;

                            try {
                                map.setPaintProperty(layer.id, "text-color", [
                                    "interpolate", ["linear"], ["zoom"],
                                    5, "#FFFFFF",
                                    7, "#111827",
                                ]);
                                map.setPaintProperty(layer.id, "text-halo-color", [
                                    "interpolate", ["linear"], ["zoom"],
                                    5, "#334155",
                                    7, "#FFFFFF",
                                ]);
                                map.setPaintProperty(layer.id, "text-halo-width", 1.2);
                                map.setPaintProperty(layer.id, "text-halo-blur", 0);
                            } catch {
                                // Ignore unsupported style layers.
                            }
                        }

                        map.addSource(SOURCE_ID, {
                            type: "geojson",
                            data: geojson as GeoJSON.FeatureCollection,
                        });

                        // Keep risk polygons BELOW Mapbox's place/street labels.
                        // If the fill is added above symbol layers, it washes out names
                        // such as Rajouri Garden, Punjabi Bagh, and New Delhi.
                        const firstSymbolLayer = style.layers?.find(
                            (layer) => layer.type === "symbol"
                        );

                        map.addLayer(
                            {
                                id: FILL_LAYER,
                                type: "fill",
                                source: SOURCE_ID,
                                paint: {
                                    "fill-color": riskColorExpression("heatRisk"),
                                    "fill-opacity": 0.55,
                                    "fill-outline-color": "#263449",
                                },
                            },
                            firstSymbolLayer?.id
                        );

                        map.addLayer(
                            {
                                id: BORDER_LAYER,
                                type: "line",
                                source: SOURCE_ID,
                                paint: {
                                    "line-color": "#64748b",
                                    "line-width": [
                                        "interpolate",
                                        ["linear"],
                                        ["zoom"],
                                        1, 0.25,
                                        4, 0.65,
                                        7, 1.1,
                                    ],
                                    "line-opacity": 0.8,
                                },
                            },
                            firstSymbolLayer?.id
                        );

                        map.addLayer({
                            id: HOVER_LAYER,
                            type: "line",
                            source: SOURCE_ID,
                            filter: ["==", ["id"], -1],
                            paint: {
                                "line-color": "#ffffff",
                                "line-width": 2,
                            },
                        });

                        map.on("click", FILL_LAYER, (event) => {
                            const feature = event.features?.[0];

                            if (!feature?.properties) return;

                            const properties = feature.properties;

                            setSelectedRegion({
                                name: String(properties.regionName ?? "Unknown region"),
                                country: String(properties.countryName ?? "Unknown country"),
                                heatRisk: Number(properties.heatRisk ?? 0),
                                floodRisk: Number(properties.floodRisk ?? 0),
                            });
                        });

                        map.on("mousemove", FILL_LAYER, (event) => {
                            if (!map) return;

                            map.getCanvas().style.cursor = "pointer";

                            const feature = event.features?.[0];

                            if (feature?.id === undefined) return;

                            map.setFilter(HOVER_LAYER, [
                                "==",
                                ["id"],
                                feature.id,
                            ]);
                        });

                        map.on("mouseleave", FILL_LAYER, () => {
                            if (!map) return;

                            map.getCanvas().style.cursor = "";
                            map.setFilter(HOVER_LAYER, ["==", ["id"], -1]);
                        });

                        map.resize();
                        setLoading(false);
                    } catch (err) {
                        console.error("Layer initialization error:", err);
                        setError(
                            err instanceof Error
                                ? err.message
                                : "Unable to render the geographic layers."
                        );
                        setLoading(false);
                    }
                });

                map.on("error", (event) => {
                    console.error("Mapbox error:", event.error);
                });
            } catch (err) {
                if (cancelled) return;

                console.error("Map initialization failed:", err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to initialize the map."
                );
                setLoading(false);
            }
        }

        void initializeMap();

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            map?.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const updateRisk = () => {
            if (!map.getLayer(FILL_LAYER)) return;

            map.setPaintProperty(
                FILL_LAYER,
                "fill-color",
                riskColorExpression(mode)
            );
        };

        if (map.isStyleLoaded()) {
            updateRisk();
        } else {
            map.once("load", updateRisk);
        }
    }, [mode]);

    const activeScore =
        selectedRegion === null
            ? null
            : mode === "heatRisk"
                ? selectedRegion.heatRisk
                : selectedRegion.floodRisk;

    return (
        <main className="min-h-screen bg-[#080d16] text-white">
            <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0b1220] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-lg font-bold text-cyan-300">
                        R
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">RiskLens</h1>
                        <p className="text-xs text-slate-400">
                            Global Environmental Risk Monitor
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {regionCount.toLocaleString()} regions loaded
                    </span>

                    <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                        <button
                            onClick={() => changeMode("heatRisk")}
                            className={`rounded-lg px-4 py-2 text-sm ${mode === "heatRisk"
                                ? "bg-orange-500 text-white"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Heat Risk
                        </button>

                        <button
                            onClick={() => changeMode("floodRisk")}
                            className={`rounded-lg px-4 py-2 text-sm ${mode === "floodRisk"
                                ? "bg-cyan-600 text-white"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Flood Risk
                        </button>
                    </div>
                </div>
            </header>

            <section className="px-4 py-4 sm:px-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-medium">
                            {mode === "heatRisk"
                                ? "Worldwide Heat Risk"
                                : "Worldwide Flood Risk"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Explore administrative regions and select one to inspect its risk score.
                        </p>
                    </div>

                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-200">
                        Demo scores · Not live forecasts
                    </span>
                </div>

                <div className="relative h-[68vh] min-h-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#075985] sm:h-[76vh]">
                    <div
                        ref={mapContainerRef}
                        className="absolute inset-0 h-full w-full"
                        style={{ minHeight: "460px" }}
                        aria-label="Interactive global environmental risk map"
                    />

                    {loading && !error && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080d16]/80">
                            <div className="text-center">
                                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
                                <p className="text-sm font-medium">Loading world risk map…</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#080d16]/95 p-6">
                            <div className="max-w-lg rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
                                <h3 className="text-lg font-semibold text-red-300">
                                    Could not load the map
                                </h3>
                                <p className="mt-3 break-words text-sm leading-6 text-slate-300">
                                    {error}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pointer-events-none absolute bottom-5 left-4 z-10 w-52 rounded-xl border border-white/10 bg-[#0b1220]/90 p-4 shadow-xl sm:left-5">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Risk intensity
                        </p>
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-green-600 via-yellow-400 via-orange-500 to-red-700" />
                        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                            <span>0 · Low</span>
                            <span>50 · Medium</span>
                            <span>100 · High</span>
                        </div>
                        <p className="mt-3 text-[11px] leading-4 text-slate-500">
                            Colors represent the selected risk mode for each region.
                        </p>
                    </div>

                    {selectedRegion && (
                        <div className="absolute right-4 top-4 z-10 w-[min(300px,calc(100%-2rem))] rounded-xl border border-white/10 bg-[#0b1220]/95 p-4 shadow-xl sm:right-5 sm:top-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
                                        Selected region
                                    </p>
                                    <h3 className="mt-1 break-words text-base font-semibold">
                                        {selectedRegion.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {selectedRegion.country}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedRegion(null)}
                                    aria-label="Close selected region"
                                    className="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-slate-300">
                                        {mode === "heatRisk" ? "Heat risk" : "Flood risk"}
                                    </span>
                                    <span
                                        className="text-2xl font-semibold tabular-nums"
                                        style={{ color: riskColor(activeScore ?? 0) }}
                                    >
                                        {activeScore}
                                        <span className="text-sm text-slate-400">/100</span>
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${activeScore ?? 0}%`,
                                            backgroundColor: riskColor(activeScore ?? 0),
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-white/[0.04] p-3">
                                    <p className="text-[11px] text-slate-400">Heat</p>
                                    <p className="mt-1 text-lg font-medium">
                                        {selectedRegion.heatRisk}/100
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white/[0.04] p-3">
                                    <p className="text-[11px] text-slate-400">Flood</p>
                                    <p className="mt-1 text-lg font-medium">
                                        {selectedRegion.floodRisk}/100
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pointer-events-none absolute bottom-5 right-4 z-10 rounded-lg border border-white/10 bg-[#0b1220]/85 px-3 py-2 text-[11px] text-slate-300 sm:right-5">
                        Scroll to zoom · Drag to explore · Click a region
                    </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    RiskLens prototype. Boundaries come from the supplied GeoJSON.
                    Heat and flood values are generated demo scores, not live forecasts
                    or safety guidance.
                </p>
            </section>
        </main>
    );
}


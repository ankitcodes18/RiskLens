"use client";

import { useEffect, useState } from "react";
import { Layers, ZoomIn, ZoomOut, Maximize2, ShieldAlert } from "lucide-react";

interface RiskMapPreviewProps {
  compact?: boolean;
}

export default function RiskMapPreview({ compact = false }: RiskMapPreviewProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function detectAsset() {
      // Check standard asset paths with priority on RiskMap.png
      const candidates = [
        "/assets/RiskMap.png",
        "/assets/RiskMap.jpg",
        "/assets/RiskMap.jpeg",
        "/assets/RiskMap.webp",
        "/assets/riskmap.png",
        "/assets/risk-map.png",
        "/assets/risk-map.jpg",
        "/RiskMap.png",
        "/riskmap.png",
      ];

      for (const path of candidates) {
        try {
          const imgCheck = await fetch(path, { method: "HEAD" });
          if (imgCheck.ok && isMounted) {
            setImageSrc(path);
            setLoading(false);
            return;
          }
        } catch {
          // continue
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    detectAsset();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:border-slate-300">
      {/* Product UI Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100/70 text-teal-800">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-slate-800">
            RiskLens Map Viewer
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            Active Layer: Multi-Hazard
          </span>
        </div>

        {/* Minimal Viewer Controls */}
        <div className="flex items-center gap-1 text-slate-500">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="hidden sm:flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Maximize map view"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Map Canvas / Provided Asset Frame */}
      <div className={`relative w-full bg-slate-100 ${compact ? "h-[280px]" : "h-[340px] sm:h-[420px]"}`}>
        {imageSrc && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="RiskLens Environmental Risk Map"
            className="h-full w-full object-cover object-center"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                Detecting map asset...
              </div>
            ) : (
              <div className="max-w-md space-y-3 rounded-lg border border-dashed border-slate-300 bg-white/80 p-6 backdrop-blur-xs">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <ShieldAlert className="h-5 w-5 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Awaiting RiskMap.png
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Add your risk map image named{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] font-semibold text-teal-700">
                      RiskMap.png
                    </code>{" "}
                    into the{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-700">
                      assets
                    </code>{" "}
                    folder. It will automatically render here.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product UI Bottom Strip: Legend and Scale */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Risk Severity:</span>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
          <span>Resolution: 100m² grid</span>
          <span>•</span>
          <span>Projection: EPSG:4326</span>
        </div>
      </div>
    </div>
  );
}

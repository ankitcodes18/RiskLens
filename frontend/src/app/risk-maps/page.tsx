import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RiskMapPreview from "@/components/RiskMapPreview";
import { Filter, Download, Info } from "lucide-react";

export default function RiskMapsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Spatial Analysis
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Environmental Risk Maps
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Explore location-specific risk layers calibrated to official sensor networks and meteorological telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>Filters</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export GeoJSON</span>
              </button>
            </div>
          </div>

          {/* Map Viewer Container */}
          <div className="mt-8">
            <RiskMapPreview />
          </div>

          {/* Layer Metadata & Scientific Grounding */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Layer Resolution
              </h3>
              <p className="mt-2 text-base font-semibold text-slate-900">
                100m² Spatial Grid
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Interpolated from verified hydrological stations, radar soundings, and satellite elevation models.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Update Cadence
              </h3>
              <p className="mt-2 text-base font-semibold text-slate-900">
                Hourly Synchronization
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Risk indices dynamically re-score as telemetry updates from meteorological feeds.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Classification Schema
              </h3>
              <p className="mt-2 text-base font-semibold text-slate-900">
                4-Tier Standardized Scale
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Strict adherence to national disaster management risk thresholds: Low, Moderate, High, and Extreme.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-teal-700" />
            <span>
              Risk maps serve as decision-support guidance. In urgent emergencies, always consult designated civil defense channels.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

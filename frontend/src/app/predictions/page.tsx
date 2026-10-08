import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForecastGraphPreview from "@/components/ForecastGraphPreview";
import { Clock, ShieldAlert, Cpu } from "lucide-react";

export default function PredictionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Predictive Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Forecast Horizons & Trend Analysis
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Anticipate shifting conditions through multi-day hazard trajectory modeling. Understand how atmospheric and hydrological dynamics compound over time.
            </p>
          </div>

          {/* Forecast Graph Viewer */}
          <div className="mt-8">
            <ForecastGraphPreview />
          </div>

          {/* Forecasting Methodology Overview */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <Clock className="h-4 w-4 text-teal-700" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                Multi-Day Forward Horizon
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Evaluates forward-looking forecast trajectories to isolate acute peak thresholds before conditions reach critical stages.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <Cpu className="h-4 w-4 text-teal-700" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                Compound Risk Integration
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Models how precipitation, antecedent soil moisture, and watershed drainage intersect to determine cumulative risk.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <ShieldAlert className="h-4 w-4 text-teal-700" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                Threshold Triage
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Highlights inflection points where moderate conditions are forecasted to escalate into high or extreme warning bands.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

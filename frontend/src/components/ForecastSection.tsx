import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ForecastGraphPreview from "./ForecastGraphPreview";

export default function ForecastSection() {
  return (
    <section className="border-b border-slate-200/80 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Temporal Predictive Modeling
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Multi-Day Risk Forecasting
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Understand how environmental risk conditions evolve over time with predictive forecasting model outputs and hazard trajectory trends.
          </p>
        </div>

        {/* Forecast Graph Viewer Container */}
        <div className="mt-10">
          <ForecastGraphPreview />
        </div>

        {/* Section CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/predictions"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <span>Explore Predictions</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

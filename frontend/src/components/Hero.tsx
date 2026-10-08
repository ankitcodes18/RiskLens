import Link from "next/link";
import RiskMapPreview from "./RiskMapPreview";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative border-b border-slate-200/80 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/60 px-3 py-1 text-xs font-medium text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              <span>Environmental Risk Intelligence</span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl lg:leading-[1.15]">
              See Risk Before It Reaches You.
            </h1>

            <p className="mt-5 text-base text-slate-600 sm:text-lg leading-relaxed">
              RiskLens brings environmental risk maps, future forecasts, and trusted information together to help people understand and prepare for changing environmental conditions.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#risk-map-section"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
              >
                <span>Explore Risk</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Geospatial Risk Maps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span>Multi-day Forecasting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <span>Grounded RAG Assistant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview of RiskLens Risk Map */}
          <div className="lg:col-span-6 xl:col-span-7">
            <RiskMapPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

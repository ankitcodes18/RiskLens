import Link from "next/link";
import { ArrowRight, MapPin, GitCompare, Gauge, Eye } from "lucide-react";

export default function RiskMapSection() {
  const capabilities = [
    {
      icon: MapPin,
      title: "Location-Based Risk",
      description:
        "Evaluate environmental exposure at granular geographic levels rather than relying on broad regional estimates.",
      visualBadge: "Granular Geospatial Index",
    },
    {
      icon: GitCompare,
      title: "Geographic Comparison",
      description:
        "Compare vulnerability profiles across neighboring areas, watersheds, and administrative boundaries side by side.",
      visualBadge: "Cross-District Modeling",
    },
    {
      icon: Gauge,
      title: "Different Risk Levels",
      description:
        "Categorize environmental pressure into standardized severity tiers—from Low to Extreme—for clear triage.",
      visualBadge: "Standardized Severity Scale",
    },
    {
      icon: Eye,
      title: "Easy-to-Understand Visual Information",
      description:
        "Transform raw environmental telemetry into clear, intuitive map overlays designed for immediate situational comprehension.",
      visualBadge: "High-Clarity Visualization",
    },
  ];

  return (
    <section id="risk-map-section" className="border-b border-slate-200/80 bg-slate-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Geospatial Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Understand Risk Where It Matters
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Explore environmental risk across locations through clear, easy-to-understand risk maps. RiskLens turns environmental data into location-based risk information so users can quickly identify areas that may need attention.
          </p>
        </div>

        {/* 4 Visual Pillar Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-slate-300 hover:shadow-xs"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-800">
                    <Icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    {item.visualBadge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Comparison & Severity Preview Strip */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Multi-Tier Environmental Risk Classification
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized visual hierarchy calibrated for environmental hazards
              </p>
            </div>
            <Link
              href="/risk-maps"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
            >
              <span>Explore Risk Maps</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Low Risk</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[11px] text-emerald-700/90 leading-tight">
                Baseline environmental conditions; minimal expected disruption.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800">Moderate Risk</span>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>
              <p className="mt-2 text-[11px] text-amber-700/90 leading-tight">
                Emerging stress signals; monitor local environmental updates.
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-800">High Risk</span>
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              </div>
              <p className="mt-2 text-[11px] text-orange-700/90 leading-tight">
                Heightened threshold exceedance; active preparation advised.
              </p>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">Extreme Risk</span>
                <span className="h-2 w-2 rounded-full bg-rose-600" />
              </div>
              <p className="mt-2 text-[11px] text-rose-700/90 leading-tight">
                Critical hazard conditions; immediate contingency actions required.
              </p>
            </div>
          </div>
        </div>

        {/* Section CTA Button */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/risk-maps"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <span>Explore Risk Maps</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

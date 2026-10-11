"use client";

import { Shield } from "lucide-react";
import { RiskExplanationResponse, RiskFactorExplanation } from "@/types/forecast";

interface RiskExplanationPanelProps {
  data: RiskExplanationResponse;
}

const SEVERITY_ACCENT = {
  critical: { dot: "bg-red-600", border: "border-l-red-500" },
  warning: { dot: "bg-orange-500", border: "border-l-orange-400" },
  advisory: { dot: "bg-amber-400", border: "border-l-amber-400" },
  normal: { dot: "bg-slate-300", border: "border-l-slate-300" },
} as const;

const SEVERITY_ORDER = { critical: 0, warning: 1, advisory: 2, normal: 3 };

function ExplanationRow({ exp }: { exp: RiskFactorExplanation }) {
  const s = SEVERITY_ACCENT[exp.severity] ?? SEVERITY_ACCENT.normal;

  return (
    <div className={`border-l-3 ${s.border} pl-4 py-3 bg-white rounded-r-lg border-y border-r border-slate-200/60`}>
      {/* Heading & Time period */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
          <h3 className="text-sm font-semibold text-slate-900">{exp.factor}</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{exp.timePeriod}</span>
      </div>

      {/* Prominent Measured Reading vs Threshold */}
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {exp.measuredValue}
        </span>
        {exp.baselineOrThreshold && (
          <span className="text-xs text-slate-500">
            ({exp.baselineOrThreshold})
          </span>
        )}
      </div>

      {/* Impact explanation */}
      {exp.methodologyImpact && (
        <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-2xl">
          {exp.methodologyImpact}
        </p>
      )}

      {/* Suggested action */}
      {exp.recommendation && (
        <div className="mt-2.5 text-xs">
          <span className="font-semibold text-slate-900 block mb-0.5">Suggested action</span>
          <p className="text-slate-600 leading-relaxed">{exp.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default function RiskExplanationPanel({ data }: RiskExplanationPanelProps) {
  const { explanations, officialDisclaimer } = data;

  const sorted = [...explanations].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
  );

  return (
    <section aria-label="Conditions breakdown" className="pt-2">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          What the data shows
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Conditions contributing to heat, flood, and water risk at this location.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 border-t border-slate-100">
          No elevated risk factors recorded for this location.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((exp) => (
            <ExplanationRow key={exp.id} exp={exp} />
          ))}
        </div>
      )}

      {officialDisclaimer && (
        <div className="mt-5 flex items-start gap-2 text-xs text-slate-500 border-t border-slate-200/80 pt-3">
          <Shield className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          <span>{officialDisclaimer}</span>
        </div>
      )}
    </section>
  );
}

"use client";

import { ExternalLink, Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { HazardAlert } from "@/types/forecast";

interface HazardAlertsPanelProps {
  alerts: HazardAlert[];
}

const SEVERITY_CONFIG = {
  extreme: {
    label: "Extreme warning",
    text: "text-red-700",
    headerBg: "border-l-4 border-l-red-600",
  },
  severe: {
    label: "Severe warning",
    text: "text-orange-700",
    headerBg: "border-l-4 border-l-orange-500",
  },
  moderate: {
    label: "Moderate warning",
    text: "text-amber-700",
    headerBg: "border-l-4 border-l-amber-400",
  },
  minor: {
    label: "Minor advisory",
    text: "text-blue-700",
    headerBg: "border-l-4 border-l-blue-400",
  },
  info: {
    label: "Information",
    text: "text-slate-600",
    headerBg: "border-l-4 border-l-slate-300",
  },
} as const;

function formatAlertTime(isoStr: string): string {
  if (!isoStr) return "";
  try {
    return new Date(isoStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function AlertItem({ alert }: { alert: HazardAlert }) {
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;

  return (
    <div className={`bg-white ${cfg.headerBg} pl-4 pr-4 py-4 rounded-r-lg border-y border-r border-slate-200/60`}>
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className={`font-semibold ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-medium text-slate-700">
            {alert.isOfficial ? "Official authority" : "RiskLens risk model"}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{alert.issuingAuthority}</span>
        </div>

        {alert.sourceUrl && (
          <a
            href={alert.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 transition"
          >
            Official bulletin
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-2 text-base font-semibold text-slate-900 tracking-tight">{alert.title}</h3>

      {/* Description */}
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-3xl">{alert.description}</p>

      {/* Precautions */}
      {alert.precautions && alert.precautions.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-semibold text-slate-800">Suggested action</span>
          <ul className="mt-1 space-y-1 text-xs text-slate-600">
            {alert.precautions.map((prec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{prec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400 border-t border-slate-100 pt-2.5">
        {alert.affectedArea && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {alert.affectedArea}
          </span>
        )}
        {alert.effectiveTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Issued {formatAlertTime(alert.effectiveTime)}
            {alert.expiresTime ? ` · Expires ${formatAlertTime(alert.expiresTime)}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export default function HazardAlertsPanel({ alerts }: HazardAlertsPanelProps) {
  const sorted = [...alerts].sort((a, b) => {
    const order = { extreme: 0, severe: 1, moderate: 2, minor: 3, info: 4 };
    return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
  });

  return (
    <section aria-label="Hazard alerts" className="pt-2">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Hazard alerts
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Official warnings and local risk signals.
          </p>
        </div>
        {alerts.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {alerts.length} active
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>No active official warnings</span>
          </div>
          <p className="mt-1 text-xs text-slate-600 pl-6">
            No official alerts are active for this location. Local risk indicators are shown below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}

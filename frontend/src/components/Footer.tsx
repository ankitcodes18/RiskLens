import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-teal-700/30 bg-teal-50 text-teal-700">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="10" cy="10" r="7" />
                  <circle cx="10" cy="10" r="3" strokeWidth="1.5" />
                </svg>
              </span>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                RiskLens
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Environmental risk intelligence for better-informed decisions.
            </p>
          </div>

          <nav aria-label="Footer Navigation">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <li>
                <Link
                  href="/risk-maps"
                  className="text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  Risk Maps
                </Link>
              </li>
              <li>
                <Link
                  href="/predictions"
                  className="text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  Forecasts
                </Link>
              </li>
              <li>
                <Link
                  href="/assistant"
                  className="text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 rounded"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
          <p>© 2026 RiskLens. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

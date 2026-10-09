import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 focus-visible:outline-offset-2 rounded"
          aria-label="RiskLens Home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded border border-teal-700/30 bg-teal-50 text-teal-700 transition group-hover:border-teal-700/60">
            {/* Minimal lens symbol */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="10" cy="10" r="7" />
              <circle cx="10" cy="10" r="3" strokeWidth="1.5" />
              <line x1="10" y1="2" x2="10" y2="4" strokeWidth="1.5" />
              <line x1="10" y1="16" x2="10" y2="18" strokeWidth="1.5" />
              <line x1="2" y1="10" x2="4" y2="10" strokeWidth="1.5" />
              <line x1="16" y1="10" x2="18" y2="10" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            RiskLens
          </span>
        </Link>

        {/* Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/risk-maps"
            className="text-xs sm:text-sm font-medium text-slate-600 transition hover:text-slate-900 px-2 py-1.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            Risk Maps
          </Link>
          <Link
            href="/predictions"
            className="text-xs sm:text-sm font-medium text-slate-600 transition hover:text-slate-900 px-2 py-1.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            Forecast
          </Link>
          <Link
            href="/assistant"
            className="text-xs sm:text-sm font-medium text-slate-600 transition hover:text-slate-900 px-2 py-1.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600 hidden md:inline"
          >
            AI Assistant
          </Link>
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-slate-600 transition hover:text-slate-900 px-2 sm:px-3 py-1.5 rounded focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

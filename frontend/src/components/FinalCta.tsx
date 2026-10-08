import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Know the Risk. Prepare Early.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 leading-relaxed">
          Explore environmental conditions, understand upcoming risks, and find trusted information in one place.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

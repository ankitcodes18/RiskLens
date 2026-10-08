import Link from "next/link";
import { ArrowRight, Bot, User, FileCheck, Send, ShieldCheck } from "lucide-react";

export default function AssistantSection() {
  return (
    <section className="border-b border-slate-200/80 bg-slate-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Document-Grounded Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Ask. Verify. Understand.
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            RiskLens includes a RAG-based AI assistant that retrieves information from trusted official documentation before generating answers, helping users get reliable and context-aware information about environmental risks.
          </p>
        </div>

        {/* Clean Chatbot Product UI Preview */}
        <div className="mt-12 mx-auto max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          {/* Chat Window Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-teal-700/30 bg-teal-50 text-teal-700">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  RiskLens Assistant
                </h3>
                <p className="text-[11px] text-slate-500">
                  Retrieval-Augmented Generation (RAG) Architecture
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/80 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
              <ShieldCheck className="h-3 w-3" />
              <span>Grounded in Official Guidance</span>
            </div>
          </div>

          {/* Conversation Body */}
          <div className="space-y-6 p-6">
            {/* User Message */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-lg rounded-tl-xs bg-slate-100 px-4 py-3 text-sm text-slate-800">
                What should I do if flood risk becomes high in my area?
              </div>
            </div>

            {/* Assistant Response */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/20 bg-teal-50 text-teal-700">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-3">
                <div className="rounded-lg rounded-tl-xs border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800">
                  <p className="font-medium text-slate-900 mb-2">
                    According to the available official guidance, recommended actions include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700 text-xs sm:text-sm">
                    <li>Move essential valuables and hazardous materials to upper floors or elevated locations.</li>
                    <li>Keep battery-powered communication devices ready and monitor official emergency broadcasts.</li>
                    <li>Avoid driving or walking through standing flood waters; never attempt to cross flowing streams.</li>
                    <li>Verify local evacuation routes and keep emergency contacts accessible for all household members.</li>
                  </ul>

                  {/* Clean Grounding Source Indicator */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <div className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-2xs">
                      <FileCheck className="h-3.5 w-3.5 text-teal-700" />
                      <span className="font-medium text-slate-700">Source:</span>
                      <span>Official Government Guidance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Input Bar */}
          <div className="border-t border-slate-200 bg-slate-50/50 p-3 sm:px-5">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
              <span className="truncate">
                Ask about official emergency guidance, regional risk protocols, or preparation checklists...
              </span>
              <button
                type="button"
                className="ml-2 flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-white"
                aria-label="Send message"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              UI Preview • Real assistant answers are strictly synthesized from indexed official documentation.
            </p>
          </div>
        </div>

        {/* Section CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/assistant"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <span>Ask RiskLens</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

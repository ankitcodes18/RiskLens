"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bot, User, FileCheck, Send, ShieldCheck, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: string;
  bulletPoints?: string[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "user",
      content: "What should I do if flood risk becomes high in my area?",
    },
    {
      role: "assistant",
      content:
        "According to the available official guidance, recommended actions include:",
      bulletPoints: [
        "Move essential valuables and hazardous materials to upper floors or elevated locations.",
        "Keep battery-powered communication devices ready and monitor official emergency broadcasts.",
        "Avoid driving or walking through standing flood waters; never attempt to cross flowing streams.",
        "Verify local evacuation routes and keep emergency contacts accessible for all household members.",
      ],
      source: "Official Government Guidance",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    "What should I do if flood risk becomes high in my area?",
    "How should households prepare for high heat stress conditions?",
    "What precautions apply when air quality index enters elevated risk?",
  ];

  const handleAsk = (query: string) => {
    if (!query.trim()) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let assistantMsg: Message;
      if (query.toLowerCase().includes("heat")) {
        assistantMsg = {
          role: "assistant",
          content:
            "According to official public health and meteorological emergency guidance:",
          bulletPoints: [
            "Maintain adequate hydration and avoid direct outdoor exposure during peak solar radiation hours (11:00 AM – 4:00 PM).",
            "Identify designated cooling shelters or air-conditioned public facilities if indoor temperatures exceed safe thresholds.",
            "Never leave vulnerable individuals or pets in closed vehicles under any circumstances.",
            "Monitor symptoms of heat exhaustion: heavy sweating, weakness, dizziness, and nausea.",
          ],
          source: "Official Public Health Documentation",
        };
      } else if (query.toLowerCase().includes("air quality") || query.toLowerCase().includes("air")) {
        assistantMsg = {
          role: "assistant",
          content:
            "Based on official environmental protection and air quality monitoring protocols:",
          bulletPoints: [
            "Sensitive groups (individuals with respiratory conditions, elderly, and children) should restrict prolonged outdoor physical exertion.",
            "Keep windows and exterior doors closed during peak particulate accumulation windows.",
            "Utilize certified HEPA air filtration indoors where available.",
            "Consult real-time local particulate monitors before planning outdoor recreational activities.",
          ],
          source: "Official Environmental Protection Standards",
        };
      } else {
        assistantMsg = {
          role: "assistant",
          content:
            "According to the available official disaster management guidance:",
          bulletPoints: [
            "Verify situational updates across authorized municipal communication channels.",
            "Ensure emergency household supply kits (water, non-perishable food, flashlights, first-aid) are fully stocked.",
            "Secure unanchored exterior items and identify internal shelter zones within your structure.",
            "Follow designated local authority instructions if evacuation advisories are formally declared.",
          ],
          source: "Official Emergency Management Documentation",
        };
      }

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>RAG Document Retrieval</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              RiskLens AI Assistant
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Ask questions regarding environmental risks and receive answers grounded strictly in verified official documentation.
            </p>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Suggested queries:</span>
            {sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Window */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            {/* Chat Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded border border-teal-700/30 bg-teal-50 text-teal-700">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  Knowledge Assistant Session
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Official Index Active
              </span>
            </div>

            {/* Conversation Messages */}
            <div className="space-y-6 p-6 min-h-[360px]">
              {messages.map((m, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {m.role === "user" ? (
                    <>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-lg rounded-tl-xs bg-slate-100 px-4 py-3 text-sm text-slate-800">
                        {m.content}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/20 bg-teal-50 text-teal-700">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-3 max-w-xl">
                        <div className="rounded-lg rounded-tl-xs border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800">
                          <p className="font-medium text-slate-900 mb-2">{m.content}</p>
                          {m.bulletPoints && (
                            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                              {m.bulletPoints.map((pt, pIdx) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          )}

                          {m.source && (
                            <div className="mt-4 pt-3 border-t border-slate-200/80">
                              <div className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-2xs">
                                <FileCheck className="h-3.5 w-3.5 text-teal-700" />
                                <span className="font-medium text-slate-700">Source:</span>
                                <span>{m.source}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-700/20 bg-teal-50 text-teal-700">
                    <Bot className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-spin" />
                    <span>Retrieving official documentation and synthesizing response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(input);
              }}
              className="border-t border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about emergency checklists, risk protocols, or guidance..."
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Responses are synthesized strictly from indexed public advisories and official documentation.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

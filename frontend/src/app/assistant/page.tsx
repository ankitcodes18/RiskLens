"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bot, User, FileCheck, Send, ShieldCheck, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [statusText, setStatusText] = useState("Retrieving climate data and synthesizing response...");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sampleQuestions = [
    "What is the heat risk at my configured location tomorrow?",
    "What should I do if flood risk becomes high in my area?",
    "How should households prepare for high heat stress conditions?",
    "What precautions apply when air quality index enters elevated risk?",
  ];

  const handleAsk = async (query: string) => {
    console.log("handleAsk called:", query);
    if (!query.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: Message = { role: "user", content: query };
    const assistantPlaceholder: Message = {
      role: "assistant",
      content: "",
      source: "Open-Meteo & Gemini Climate Agent",
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setLoading(true);
    setStatusText("Retrieving climate data and synthesizing response...");

    const updateAssistantMessage = (
      contentUpdater: (prevContent: string) => string,
      sourceOverride?: string
    ) => {
      setMessages((prev) => {
        let targetIndex = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === "assistant") {
            targetIndex = i;
            break;
          }
        }
        if (targetIndex === -1) return prev;
        return prev.map((msg, idx) => {
          if (idx !== targetIndex) return msg;
          return {
            ...msg,
            content: contentUpdater(msg.content),
            source: sourceOverride !== undefined ? sourceOverride : msg.source,
          };
        });
      });
    };

    const processBlock = (block: string) => {
      const line = block.trim();
      if (!line.startsWith("data: ")) return;
      const dataStr = line.slice(6).trim();
      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr);

        if (data.type === "tool_start") {
          setStatusText(`Executing tool: ${data.tool}...`);
        } else if (data.type === "chunk" && data.text) {
          updateAssistantMessage((prevText) => prevText + data.text);
        } else if (data.type === "error") {
          const errorMsg = data.error || "An error occurred while generating the response.";
          updateAssistantMessage(
            (prevText) =>
              prevText
                ? `${prevText}\n\n⚠️ **Error:** ${errorMsg}`
                : `⚠️ **Error:** ${errorMsg}`,
            "Climate AI Agent Error"
          );
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          processBlock(block);
        }
      }

      if (buffer.trim()) {
        processBlock(buffer.trim());
      }

      updateAssistantMessage((prevText) =>
        prevText.trim()
          ? prevText
          : "⚠️ No response content received from Climate AI Agent."
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted by user request");
        return;
      }
      console.error("Chat error:", err);
      updateAssistantMessage(
        (prevText) =>
          prevText
            ? `${prevText}\n\n⚠️ **Connection Interrupted:** ${err.message}`
            : `⚠️ **Connection Error:** Could not connect to the Climate AI Agent server (${err.message}). Please ensure the Python API server (\`python ai/server.py\`) is running.`,
        "System Error"
      );
    } finally {
      setLoading(false);
    }
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
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition text-left"
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
                          {m.bulletPoints ? (
                            <>
                              <p className="font-medium text-slate-900 mb-2">{m.content}</p>
                              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                                {m.bulletPoints.map((pt, pIdx) => (
                                  <li key={pIdx}>{pt}</li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-2 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_code]:bg-slate-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-300 [&_table]:my-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:text-xs [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-teal-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline" />
                                  ),
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
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
                    <span>{statusText}</span>
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
                  placeholder="Ask about emergency checklists, risk protocols, or climate questions..."
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
                Responses are synthesized from real-time meteorological models and verified official climate data tools.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

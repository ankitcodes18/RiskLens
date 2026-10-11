"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Bot,
  User,
  FileCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";
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

  // Voice Recognition & Playback States
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const shouldRecordRef = useRef<boolean>(false);
  const sessionIdRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>("");
  const restartCountRef = useRef<number>(0);
  const lastRestartTimeRef = useRef<number>(0);

  const sampleQuestions = [
    "What is the heat risk at my configured location tomorrow?",
    "What should I do if flood risk becomes high in my area?",
    "How should households prepare for high heat stress conditions?",
    "What precautions apply when air quality index enters elevated risk?",
  ];

  // Clean up timers & active browser voice sessions on unmount
  useEffect(() => {
    return () => {
      shouldRecordRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop active speech playback
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageIndex(null);
  };

  // Helper to safely stop voice recording and invalidate the session when requested
  const stopVoiceRecording = (invalidateSession = false) => {
    shouldRecordRef.current = false;
    setIsListening(false);

    if (invalidateSession) {
      sessionIdRef.current += 1;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
  };

  // Start voice input using SpeechRecognition API + MediaRecorder Whisper fallback
  const startListening = async () => {
    stopSpeaking();
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    setMicError(null);
    shouldRecordRef.current = true;
    const sessionId = ++sessionIdRef.current;
    restartCountRef.current = 0;
    lastRestartTimeRef.current = Date.now();

    // Preserve existing input text as base for accumulation
    finalTranscriptRef.current = input.trim() ? input.trim() + " " : "";

    // 1. Initialize MediaRecorder for backend Whisper transcription
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (sessionIdRef.current !== sessionId || !shouldRecordRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.start(250);
    } catch (err: any) {
      console.warn("MediaRecorder / Mic access error:", err);
      if (!SpeechRecognition) {
        setMicError("Microphone permission denied or microphone not available.");
        setIsListening(false);
        shouldRecordRef.current = false;
        return;
      }
    }

    // 2. Initialize SpeechRecognition with continuous recording & interim results
    if (!SpeechRecognition) {
      setIsListening(true);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const createAndStartRecognition = () => {
      if (sessionIdRef.current !== sessionId || !shouldRecordRef.current) return;

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Reliable multilingual language configuration
        const userLang =
          typeof navigator !== "undefined" && navigator.language ? navigator.language : "";
        recognition.lang = userLang && userLang !== "en-US" ? userLang : "hi-IN";

        recognition.onstart = () => {
          if (sessionIdRef.current !== sessionId) return;
          setIsListening(true);
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          if (sessionIdRef.current !== sessionId || !shouldRecordRef.current) return;

          let interimText = "";
          let newFinalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcriptChunk = result[0].transcript;
            if (result.isFinal) {
              newFinalText += transcriptChunk + " ";
            } else {
              interimText += transcriptChunk;
            }
          }

          if (newFinalText) {
            finalTranscriptRef.current += newFinalText;
          }

          const currentText = (finalTranscriptRef.current + interimText).trim();
          if (currentText && sessionIdRef.current === sessionId && shouldRecordRef.current) {
            setInput(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          if (sessionIdRef.current !== sessionId) return;
          console.warn("Speech recognition error:", event.error);

          if (event.error === "not-allowed" || event.error === "permission-denied") {
            setMicError("Microphone permission denied. Please allow microphone access.");
            shouldRecordRef.current = false;
            setIsListening(false);
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            setMicError(`Voice input issue: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (sessionIdRef.current !== sessionId) return;

          // Auto-restart if user still intends to record and not manually stopped
          if (shouldRecordRef.current) {
            const now = Date.now();
            if (now - lastRestartTimeRef.current < 2000) {
              restartCountRef.current += 1;
            } else {
              restartCountRef.current = 1;
            }
            lastRestartTimeRef.current = now;

            if (restartCountRef.current <= 5) {
              setTimeout(() => {
                if (sessionIdRef.current === sessionId && shouldRecordRef.current) {
                  try {
                    recognition.start();
                  } catch (e) {
                    console.warn("Failed to restart speech recognition:", e);
                  }
                }
              }, 150);
              return;
            }
          }

          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error("Failed to start SpeechRecognition:", err);
        setIsListening(false);
      }
    };

    createAndStartRecognition();
    setIsListening(true);
  };

  // Stop voice input manually & finalize transcription for active session
  const stopListening = () => {
    const sessionId = sessionIdRef.current;
    shouldRecordRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const webSpeechText = finalTranscriptRef.current.trim();
    if (webSpeechText && sessionIdRef.current === sessionId) {
      setInput(webSpeechText);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;

      recorder.onstop = async () => {
        if (recorder.stream) {
          recorder.stream.getTracks().forEach((track) => track.stop());
        }

        if (sessionIdRef.current !== sessionId) return;

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          audioChunksRef.current = [];

          if (audioBlob.size > 2000) {
            try {
              const formData = new FormData();
              formData.append("file", audioBlob, "audio.webm");

              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
              const res = await fetch(`${apiUrl}/api/transcribe`, {
                method: "POST",
                body: formData,
              });

              if (sessionIdRef.current !== sessionId) return;

              if (res.ok) {
                const data = await res.json();
                if (data.text && data.text.trim() && sessionIdRef.current === sessionId) {
                  setInput(data.text.trim());
                }
              }
            } catch (err) {
              console.warn("Backend transcription fallback skipped:", err);
            }
          }
        }
      };

      try {
        recorder.stop();
      } catch (e) {}
    }
  };

  // Stop ongoing text response generation
  const handleStopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  // Helper function to strip Markdown syntax before speaking
  const cleanMarkdownForSpeech = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/[*_~#]/g, "")
      .replace(/^\s*[-+*]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\n+/g, " ")
      .trim();
  };

  // Language detection helper for SpeechSynthesis voice matching
  const detectLanguage = (text: string): string => {
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN";
    if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN";
    if (/[\u0980-\u09FF]/.test(text)) return "bn-IN";
    if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN";
    if (/[áéíóúñ¿¡]/i.test(text)) return "es-ES";
    if (/[éèêëàâùûç]/i.test(text)) return "fr-FR";
    return "en-US";
  };

  // SpeechSynthesis audio playback handler
  const handlePlayResponse = (idx: number, message: Message) => {
    if (speakingMessageIndex === idx) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPlaybackError("Speech synthesis is not supported in this browser.");
      setTimeout(() => setPlaybackError(null), 4000);
      return;
    }

    let rawText = message.content;
    if (message.bulletPoints && message.bulletPoints.length > 0) {
      rawText += ". " + message.bulletPoints.join(". ");
    }

    const cleanText = cleanMarkdownForSpeech(rawText);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const lang = detectLanguage(cleanText);
    utterance.lang = lang;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split("-")[0].toLowerCase();
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageIndex(null);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setSpeakingMessageIndex(null);
    };

    setSpeakingMessageIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleAsk = async (query: string) => {
    console.log("handleAsk called:", query);
    const submittedQuery = query.trim();
    if (!submittedQuery) return;

    // Invalidate active recording session and stop recording resources safely
    stopVoiceRecording(true);
    stopSpeaking();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: Message = { role: "user", content: submittedQuery };
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
                      <div className="space-y-3 max-w-xl flex-1">
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

                          {/* Source & Voice Playback Controls */}
                          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                            {m.source ? (
                              <div className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-2xs">
                                <FileCheck className="h-3.5 w-3.5 text-teal-700" />
                                <span className="font-medium text-slate-700">Source:</span>
                                <span>{m.source}</span>
                              </div>
                            ) : (
                              <div />
                            )}

                            {!loading && m.content.trim() && (
                              <button
                                type="button"
                                onClick={() => handlePlayResponse(idx, m)}
                                aria-label={speakingMessageIndex === idx ? "Stop speaking" : "Play response"}
                                title={speakingMessageIndex === idx ? "Stop speaking" : "Play response"}
                                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border transition cursor-pointer ${
                                  speakingMessageIndex === idx
                                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {speakingMessageIndex === idx ? (
                                  <>
                                    <VolumeX className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                                    <span>Stop Speaking</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3.5 w-3.5 text-teal-700" />
                                    <span>Play Response</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
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

                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  title={isListening ? "Stop listening" : "Start voice input"}
                  className={`inline-flex items-center justify-center rounded-md p-2 text-sm font-medium border transition cursor-pointer ${
                    isListening
                      ? "border-red-300 bg-red-50 text-red-600 animate-pulse hover:bg-red-100"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isListening ? (
                    <Square className="h-4 w-4 fill-red-600 text-red-600" />
                  ) : (
                    <Mic className="h-4 w-4 text-slate-700" />
                  )}
                </button>

                {/* Send or Stop Response Button */}
                {loading ? (
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    aria-label="Stop response"
                    title="Stop response"
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    title="Send message"
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Feedback messages */}
              {micError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{micError}</p>
              )}
              {playbackError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{playbackError}</p>
              )}

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

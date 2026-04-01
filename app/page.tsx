"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import AgentCard, { AgentStatus } from "@/components/AgentCard";
import FinalReport from "@/components/FinalReport";

interface AgentState {
  status: AgentStatus;
  content: string;
}

interface AgentsState {
  security: AgentState;
  performance: AgentState;
  style: AgentState;
  orchestrator: AgentState;
}

const AGENTS_CONFIG = [
  { id: "security"    as const, label: "Security",    icon: "🔒", color: "bg-red-500"    },
  { id: "performance" as const, label: "Performance", icon: "⚡", color: "bg-yellow-500" },
  { id: "style"       as const, label: "Style",       icon: "✨", color: "bg-blue-500"   },
];

const initial: AgentsState = {
  security:    { status: "idle", content: "" },
  performance: { status: "idle", content: "" },
  style:       { status: "idle", content: "" },
  orchestrator:{ status: "idle", content: "" },
};

export default function Home() {
  const [isLoading, setIsLoading]       = useState(false);
  const [agents, setAgents]             = useState<AgentsState>(initial);
  const [statusMessage, setStatusMsg]   = useState("");
  const [prMeta, setPrMeta]             = useState<{ title: string; author: string } | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [reviewComplete, setComplete]   = useState(false);

  const handleSSEEvent = (event: string, payload: Record<string, unknown>) => {
    switch (event) {
      case "status":
        setStatusMsg(payload.message as string);
        break;
      case "pr_meta":
        setPrMeta({ title: payload.title as string, author: payload.author as string });
        break;
      case "agent_start":
        setAgents((p) => ({ ...p, [payload.agent as string]: { ...p[payload.agent as keyof AgentsState], status: "running" } }));
        break;
      case "agent_chunk":
        setAgents((p) => ({ ...p, [payload.agent as string]: { ...p[payload.agent as keyof AgentsState], content: p[payload.agent as keyof AgentsState].content + (payload.chunk as string) } }));
        break;
      case "agent_complete":
        setAgents((p) => ({ ...p, [payload.agent as string]: { ...p[payload.agent as keyof AgentsState], status: "complete" } }));
        break;
      case "error":
        setError(payload.message as string);
        setIsLoading(false);
        break;
      case "done":
        setComplete(true);
        setStatusMsg("Review complete!");
        setIsLoading(false);
        break;
    }
  };

  const handleSubmit = async (data: { prUrl?: string; diffText?: string; githubToken?: string }) => {
    setAgents(initial);
    setStatusMsg("");
    setPrMeta(null);
    setError(null);
    setComplete(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "", dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: "))  dataStr   = line.slice(6).trim();
          }
          if (eventType && dataStr) {
            try { handleSSEEvent(eventType, JSON.parse(dataStr)); } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAgents(initial);
    setStatusMsg("");
    setPrMeta(null);
    setError(null);
    setComplete(false);
    setIsLoading(false);
  };

  const hasStarted = Object.values(agents).some((a) => a.status !== "idle" || a.content);
  const subAgentsActive = AGENTS_CONFIG.some((a) => agents[a.id].status === "running");
  const subAgentsDone   = AGENTS_CONFIG.every((a) => agents[a.id].status === "complete");

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-base shadow-sm">
              🤖
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">Code Review Bot</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">Powered by Llama 3.3 via Groq</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> 3 Sub-Agents
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" /> 1 Orchestrator
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">

        {/* ── Hero (pre-review only) ── */}
        {!hasStarted && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
              ✦ Multi-Agent Architecture
            </div>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
              AI-Powered Code Review
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              3 specialized agents analyze your PR <strong className="text-gray-700">in parallel</strong>, then a master orchestrator synthesizes a prioritized review.
            </p>

            {/* Flow diagram */}
            <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm text-xs flex-wrap justify-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-600">
                Code Diff
              </div>
              <span className="text-gray-300 text-base">→</span>
              <div className="flex flex-col gap-1">
                {[
                  { icon: "🔒", label: "Security Agent",    bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100" },
                  { icon: "⚡", label: "Performance Agent", bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
                  { icon: "✨", label: "Style Agent",       bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
                ].map((a) => (
                  <div key={a.label} className={`${a.bg} ${a.text} border ${a.border} rounded-lg px-2.5 py-1 font-medium`}>
                    {a.icon} {a.label}
                  </div>
                ))}
              </div>
              <span className="text-gray-300 text-base">→</span>
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-2 font-semibold">
                🎯 Orchestrator
              </div>
              <span className="text-gray-300 text-base">→</span>
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 font-semibold">
                ✅ Final Review
              </div>
            </div>
          </div>
        )}

        {/* ── Main layout ── */}
        <div className={`grid gap-6 ${hasStarted ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 max-w-xl mx-auto"}`}>

          {/* Left: Form + status */}
          <div className="space-y-3">
            <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />

            {/* PR meta pill */}
            {prMeta && (
              <div className="flex items-start gap-2.5 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-lg mt-0.5">📝</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{prMeta.title}</p>
                  <p className="text-xs text-gray-400">by @{prMeta.author}</p>
                </div>
              </div>
            )}

            {/* Status banner */}
            {statusMessage && (
              <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm border
                ${reviewComplete
                  ? "bg-green-50 text-green-700 border-green-100"
                  : error
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {reviewComplete && <span>✅</span>}
                {statusMessage}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Error: </span>{error}
              </div>
            )}

            {/* New review button */}
            {hasStarted && !isLoading && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition-all"
              >
                ← New Review
              </button>
            )}
          </div>

          {/* Right: Agents + report */}
          {hasStarted && (
            <div className="lg:col-span-2 space-y-5">

              {/* Sub-agent section header */}
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Sub-Agents
                </h3>
                {subAgentsActive && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Running in parallel
                  </span>
                )}
                {subAgentsDone && !subAgentsActive && (
                  <span className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 font-medium">
                    ✓ All complete
                  </span>
                )}
              </div>

              {/* Agent cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AGENTS_CONFIG.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    {...agent}
                    status={agents[agent.id].status}
                    content={agents[agent.id].content}
                  />
                ))}
              </div>

              {/* Orchestrator separator */}
              {(agents.orchestrator.status !== "idle" || agents.orchestrator.content) && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                    Orchestrating
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}

              {/* Final report */}
              <FinalReport
                content={agents.orchestrator.content}
                isStreaming={agents.orchestrator.status === "running"}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-100 mt-16 py-5 text-center text-xs text-gray-300">
        Built with Next.js · Llama 3.3 70B via Groq · 3 Sub-Agents + 1 Orchestrator
      </footer>
    </div>
  );
}

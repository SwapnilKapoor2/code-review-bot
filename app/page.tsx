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
  {
    id: "security" as const,
    label: "Security Analyzer",
    icon: "🔒",
    color: "bg-red-500",
  },
  {
    id: "performance" as const,
    label: "Performance Analyzer",
    icon: "⚡",
    color: "bg-yellow-500",
  },
  {
    id: "style" as const,
    label: "Style & Quality",
    icon: "✨",
    color: "bg-blue-500",
  },
];

const initialAgentsState: AgentsState = {
  security: { status: "idle", content: "" },
  performance: { status: "idle", content: "" },
  style: { status: "idle", content: "" },
  orchestrator: { status: "idle", content: "" },
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AgentsState>(initialAgentsState);
  const [statusMessage, setStatusMessage] = useState("");
  const [prMeta, setPrMeta] = useState<{ title: string; author: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewComplete, setReviewComplete] = useState(false);

  const handleSSEEvent = (event: string, payload: Record<string, unknown>) => {
    switch (event) {
      case "status":
        setStatusMessage(payload.message as string);
        break;
      case "pr_meta":
        setPrMeta({ title: payload.title as string, author: payload.author as string });
        break;
      case "agent_start":
        setAgents((prev) => ({
          ...prev,
          [payload.agent as string]: {
            ...prev[payload.agent as keyof AgentsState],
            status: "running" as AgentStatus,
          },
        }));
        break;
      case "agent_chunk":
        setAgents((prev) => ({
          ...prev,
          [payload.agent as string]: {
            ...prev[payload.agent as keyof AgentsState],
            content:
              prev[payload.agent as keyof AgentsState].content +
              (payload.chunk as string),
          },
        }));
        break;
      case "agent_complete":
        setAgents((prev) => ({
          ...prev,
          [payload.agent as string]: {
            ...prev[payload.agent as keyof AgentsState],
            status: "complete" as AgentStatus,
          },
        }));
        break;
      case "error":
        setError(payload.message as string);
        setIsLoading(false);
        break;
      case "done":
        setReviewComplete(true);
        setStatusMessage("✅ Review complete!");
        setIsLoading(false);
        break;
    }
  };

  const handleSubmit = async (data: {
    prUrl?: string;
    diffText?: string;
    githubToken?: string;
  }) => {
    setAgents(initialAgentsState);
    setStatusMessage("");
    setPrMeta(null);
    setError(null);
    setReviewComplete(false);
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
          let eventType = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }
          if (eventType && dataStr) {
            try {
              handleSSEEvent(eventType, JSON.parse(dataStr));
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAgents(initialAgentsState);
    setStatusMessage("");
    setPrMeta(null);
    setError(null);
    setReviewComplete(false);
    setIsLoading(false);
  };

  const hasStarted = Object.values(agents).some((a) => a.status !== "idle" || a.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">
              🤖
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Code Review Bot</h1>
              <p className="text-xs text-gray-500">Powered by Claude Sub-Agents</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full" /> 3 Parallel Sub-Agents
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-purple-500 rounded-full" /> 1 Master Orchestrator
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero (only before review starts) */}
        {!hasStarted && (
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              AI-Powered Multi-Agent Code Review
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">
              3 specialized Claude agents analyze your code diff <strong>in parallel</strong>, then a
              master orchestrator synthesizes a unified, prioritized review.
            </p>

            {/* Architecture diagram */}
            <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm text-sm">
              <div className="bg-gray-100 rounded-lg px-3 py-2 font-mono text-gray-700 text-xs">
                Code Diff
              </div>
              <span className="text-gray-400 font-light text-lg">→</span>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: "🔒", label: "Security", color: "red" },
                  { icon: "⚡", label: "Performance", color: "yellow" },
                  { icon: "✨", label: "Style", color: "blue" },
                ].map((a) => (
                  <div
                    key={a.label}
                    className={`bg-${a.color}-50 border border-${a.color}-200 rounded px-2 py-0.5 text-xs text-${a.color}-700`}
                  >
                    {a.icon} {a.label} Agent
                  </div>
                ))}
              </div>
              <span className="text-gray-400 font-light text-lg">→</span>
              <div className="bg-indigo-50 border border-indigo-300 rounded-lg px-3 py-2 text-xs text-indigo-700 font-semibold">
                🎯 Orchestrator
              </div>
              <span className="text-gray-400 font-light text-lg">→</span>
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium">
                ✅ Final Review
              </div>
            </div>
          </div>
        )}

        <div
          className={`grid gap-6 ${
            hasStarted ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 max-w-2xl mx-auto"
          }`}
        >
          {/* Form column */}
          <div className={hasStarted ? "lg:col-span-1" : ""}>
            <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />

            {statusMessage && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
                  reviewComplete
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : error
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {statusMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            {prMeta && (
              <div className="mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-800 truncate">📝 {prMeta.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">by @{prMeta.author}</p>
              </div>
            )}

            {hasStarted && !isLoading && (
              <button
                onClick={handleReset}
                className="mt-4 w-full py-2.5 px-4 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Start New Review
              </button>
            )}
          </div>

          {/* Results column */}
          {hasStarted && (
            <div className="lg:col-span-2 space-y-5">
              {/* Sub-agents grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-widest">
                    Sub-Agents — Running in Parallel
                  </h3>
                  {agents.security.status === "running" ||
                  agents.performance.status === "running" ||
                  agents.style.status === "running" ? (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                      Active
                    </span>
                  ) : null}
                </div>
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
              </div>

              {/* Final report */}
              <FinalReport
                content={agents.orchestrator.content}
                isStreaming={agents.orchestrator.status === "running"}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-4 text-center text-xs text-gray-400">
        Built with Next.js + Llama 3.3 70B via Groq · 3 Parallel Sub-Agents + 1 Master Orchestrator
      </footer>
    </div>
  );
}

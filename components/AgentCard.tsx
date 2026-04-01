"use client";

import ReactMarkdown from "react-markdown";

export type AgentStatus = "idle" | "running" | "complete" | "error";

interface AgentCardProps {
  id: string;
  label: string;
  icon: string;
  status: AgentStatus;
  content: string;
  color: string;
}

const agentAccent: Record<string, { ring: string; glow: string; dot: string; badge: string }> = {
  "bg-red-500":    { ring: "border-red-300",    glow: "shadow-red-100",    dot: "bg-red-400",    badge: "bg-red-50 text-red-600 ring-1 ring-red-200" },
  "bg-yellow-500": { ring: "border-yellow-300",  glow: "shadow-yellow-100", dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200" },
  "bg-blue-500":   { ring: "border-blue-300",    glow: "shadow-blue-100",   dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200" },
};

export default function AgentCard({ label, icon, status, content, color }: AgentCardProps) {
  const accent = agentAccent[color] ?? agentAccent["bg-blue-500"];

  const borderClass =
    status === "running"  ? accent.ring :
    status === "complete" ? "border-green-300" :
    "border-gray-100";

  const shadowClass =
    status === "running" ? `shadow-lg ${accent.glow}` : "shadow-sm";

  return (
    <div className={`rounded-2xl border-2 ${borderClass} ${shadowClass} bg-white overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
            ${status === "idle"     ? "bg-gray-100" :
              status === "running"  ? accent.badge :
              status === "complete" ? "bg-green-50 ring-1 ring-green-200" :
              "bg-red-50 ring-1 ring-red-200"}`}>
            {status === "complete" ? "✅" : status === "error" ? "❌" : icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-none">{label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sub-Agent</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap
          ${status === "idle"     ? "bg-gray-100 text-gray-400" :
            status === "running"  ? `${accent.badge} animate-pulse` :
            status === "complete" ? "bg-green-50 text-green-600 ring-1 ring-green-200" :
            "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
          {status === "idle" ? "Waiting" : status === "running" ? "Analyzing…" : status === "complete" ? "Done" : "Error"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-4" />

      {/* Content */}
      <div className="p-4 min-h-[88px]">
        {status === "idle" && (
          <p className="text-gray-300 text-sm italic">Waiting to start…</p>
        )}
        {status === "running" && !content && (
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 0.15, 0.3].map((delay, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${accent.dot} animate-bounce`}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
            <span className="text-sm text-gray-400 ml-1">Processing…</span>
          </div>
        )}
        {content && (
          <div className="prose prose-sm max-w-none text-gray-600 max-h-56 overflow-y-auto pr-1
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

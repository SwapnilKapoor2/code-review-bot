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

export default function AgentCard({
  label,
  icon,
  status,
  content,
  color,
}: AgentCardProps) {
  const statusConfig = {
    idle: {
      badge: "Waiting",
      badgeClass: "bg-gray-100 text-gray-500",
      border: "border-gray-200",
      header: "bg-gray-50",
    },
    running: {
      badge: "Analyzing...",
      badgeClass: "bg-blue-100 text-blue-700 animate-pulse",
      border: "border-blue-300",
      header: "bg-blue-50",
    },
    complete: {
      badge: "Complete",
      badgeClass: "bg-green-100 text-green-700",
      border: "border-green-300",
      header: "bg-green-50",
    },
    error: {
      badge: "Error",
      badgeClass: "bg-red-100 text-red-700",
      border: "border-red-300",
      header: "bg-red-50",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div
      className={`rounded-xl border-2 ${cfg.border} overflow-hidden transition-all duration-300 ${
        status === "running" ? "shadow-lg shadow-blue-100" : "shadow-sm"
      }`}
    >
      {/* Header */}
      <div className={`${cfg.header} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
            <p className="text-xs text-gray-500">Sub-Agent</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.badgeClass}`}>
          {cfg.badge}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-[80px]">
        {status === "idle" && (
          <p className="text-gray-400 text-sm italic">Waiting to start...</p>
        )}
        {status === "running" && !content && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} animate-bounce`} />
            <div className={`w-2 h-2 rounded-full ${color} animate-bounce [animation-delay:0.1s]`} />
            <div className={`w-2 h-2 rounded-full ${color} animate-bounce [animation-delay:0.2s]`} />
            <span className="text-sm text-gray-500 ml-1">Processing...</span>
          </div>
        )}
        {content && (
          <div className="prose prose-sm max-w-none text-gray-700 max-h-64 overflow-y-auto">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

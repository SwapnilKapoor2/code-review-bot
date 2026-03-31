"use client";

import ReactMarkdown from "react-markdown";

interface FinalReportProps {
  content: string;
  isStreaming: boolean;
}

export default function FinalReport({ content, isStreaming }: FinalReportProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h2 className="text-white font-bold text-lg">Final Code Review</h2>
            <p className="text-indigo-200 text-sm">Master Orchestrator Agent</p>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Synthesizing...</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {!content && isStreaming && (
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" />
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce [animation-delay:0.1s]" />
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
            <span className="text-sm">Synthesizing findings from all agents...</span>
          </div>
        )}
        {content && (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-gray-900 mt-0 mb-4 pb-2 border-b border-gray-200">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => {
                  const text = String(children);
                  // Color-code severity levels
                  if (text.includes("CRITICAL") || text.includes("REJECT"))
                    return <strong className="text-red-600">{children}</strong>;
                  if (text.includes("HIGH") || text.includes("REQUEST CHANGES"))
                    return <strong className="text-orange-600">{children}</strong>;
                  if (text.includes("MEDIUM"))
                    return <strong className="text-yellow-600">{children}</strong>;
                  if (text.includes("APPROVE") || text.includes("LOW"))
                    return <strong className="text-green-600">{children}</strong>;
                  return <strong>{children}</strong>;
                },
                li: ({ children }) => (
                  <li className="text-gray-700 mb-1">{children}</li>
                ),
                hr: () => <hr className="my-4 border-gray-200" />,
                em: ({ children }) => (
                  <em className="text-gray-500 text-sm not-italic">{children}</em>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

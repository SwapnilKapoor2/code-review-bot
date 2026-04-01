"use client";

import ReactMarkdown from "react-markdown";

interface FinalReportProps {
  content: string;
  isStreaming: boolean;
}

export default function FinalReport({ content, isStreaming }: FinalReportProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">
            🎯
          </div>
          <div>
            <h2 className="text-white font-bold leading-none">Final Code Review</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Master Orchestrator Agent</p>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Synthesizing…</span>
          </div>
        )}
        {!isStreaming && content && (
          <span className="text-xs bg-white/20 text-white px-3 py-1.5 rounded-full font-medium">
            ✅ Complete
          </span>
        )}
      </div>

      {/* Body */}
      <div className="bg-white p-6">
        {!content && isStreaming && (
          <div className="flex items-center gap-2 text-gray-400 py-2">
            {[0, 0.15, 0.3].map((d, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${d}s` }} />
            ))}
            <span className="text-sm ml-1">Synthesizing findings from all agents…</span>
          </div>
        )}

        {content && (
          <div className="prose prose-slate max-w-none
            prose-headings:font-bold prose-h2:text-lg prose-h2:text-gray-900 prose-h2:mt-0 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
            prose-h3:text-sm prose-h3:font-semibold prose-h3:text-gray-700 prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-gray-600 prose-p:text-sm prose-p:leading-relaxed
            prose-li:text-gray-600 prose-li:text-sm prose-li:my-0.5
            prose-strong:font-semibold
            prose-hr:border-gray-100 prose-hr:my-5
            prose-em:not-italic prose-em:text-xs prose-em:text-gray-400">
            <ReactMarkdown
              components={{
                strong: ({ children }) => {
                  const text = String(children);
                  if (/CRITICAL|REJECT/.test(text))
                    return <strong className="text-red-600 font-semibold">{children}</strong>;
                  if (/HIGH|REQUEST CHANGES/.test(text))
                    return <strong className="text-orange-500 font-semibold">{children}</strong>;
                  if (/MEDIUM/.test(text))
                    return <strong className="text-yellow-600 font-semibold">{children}</strong>;
                  if (/APPROVE|LOW|NONE/.test(text))
                    return <strong className="text-green-600 font-semibold">{children}</strong>;
                  return <strong className="font-semibold text-gray-800">{children}</strong>;
                },
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

"use client";

interface ReviewSummaryBannerProps {
  securityLevel: string;
  performanceLevel: string;
  styleScore: string;
  verdict: string;
}

const LEVEL_COLOR: Record<string, { bar: string; text: string; bg: string }> = {
  CRITICAL:  { bar: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50"     },
  HIGH:      { bar: "bg-orange-500",  text: "text-orange-700",  bg: "bg-orange-50"  },
  MEDIUM:    { bar: "bg-yellow-500",  text: "text-yellow-700",  bg: "bg-yellow-50"  },
  LOW:       { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  NONE:      { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  POOR:      { bar: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50"     },
  FAIR:      { bar: "bg-yellow-500",  text: "text-yellow-700",  bg: "bg-yellow-50"  },
  GOOD:      { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  EXCELLENT: { bar: "bg-green-500",   text: "text-green-700",   bg: "bg-green-50"   },
};

const VERDICT_STYLE: Record<string, string> = {
  APPROVE:          "bg-emerald-100 text-emerald-800 border-emerald-300",
  "REQUEST CHANGES":"bg-yellow-100 text-yellow-800 border-yellow-300",
  REJECT:           "bg-red-100 text-red-800 border-red-300",
};

function levelToPercent(level: string): number {
  return { NONE: 100, LOW: 80, EXCELLENT: 95, GOOD: 75, FAIR: 45, MEDIUM: 45, HIGH: 20, POOR: 15, CRITICAL: 5 }[level] ?? 50;
}

interface MeterProps { label: string; icon: string; level: string }

function Meter({ label, icon, level }: MeterProps) {
  const c = LEVEL_COLOR[level] ?? LEVEL_COLOR["MEDIUM"];
  const pct = levelToPercent(level);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
          {icon} {label}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
          {level}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReviewSummaryBanner({
  securityLevel,
  performanceLevel,
  styleScore,
  verdict,
}: ReviewSummaryBannerProps) {
  const verdictKey = Object.keys(VERDICT_STYLE).find((k) => verdict.toUpperCase().includes(k)) ?? "REQUEST CHANGES";
  const verdictClass = VERDICT_STYLE[verdictKey];
  const verdictIcon = verdictKey === "APPROVE" ? "✅" : verdictKey === "REJECT" ? "❌" : "⚠️";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Review Summary</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${verdictClass}`}>
          {verdictIcon} {verdictKey}
        </span>
      </div>
      <div className="flex gap-5">
        <Meter label="Security"    icon="🔒" level={securityLevel}    />
        <Meter label="Performance" icon="⚡" level={performanceLevel} />
        <Meter label="Style"       icon="✨" level={styleScore}        />
      </div>
    </div>
  );
}

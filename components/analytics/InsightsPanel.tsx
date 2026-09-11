import { cn } from "@/lib/utils";

export type InsightTone = "positive" | "negative" | "warning" | "neutral";

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  text: string;
}

const TONE_STYLES: Record<InsightTone, string> = {
  positive: "border-emerald-200 bg-emerald-50",
  negative: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  neutral: "border-slate-200 bg-slate-50",
};

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-center text-sm text-slate-400">
        Add a few more expenses to unlock insights
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {insights.map((insight) => (
        <li
          key={insight.id}
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm text-slate-700",
            TONE_STYLES[insight.tone]
          )}
        >
          <span aria-hidden className="mt-0.5 text-base leading-none">
            {insight.icon}
          </span>
          <span>{insight.text}</span>
        </li>
      ))}
    </ul>
  );
}

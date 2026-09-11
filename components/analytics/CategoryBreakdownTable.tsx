import { CategoryPeriodStat } from "@/lib/insights";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface CategoryBreakdownTableProps {
  stats: CategoryPeriodStat[];
}

export function CategoryBreakdownTable({ stats }: CategoryBreakdownTableProps) {
  const withSpend = stats.filter((s) => s.currentTotal > 0);

  if (withSpend.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No spending data for this period
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {withSpend.map((stat) => (
        <li key={stat.category}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span>{CATEGORY_ICONS[stat.category]}</span>
              {stat.category}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-medium text-slate-900">{formatCurrency(stat.currentTotal)}</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  stat.deltaPct === null || Math.abs(stat.deltaPct) < 1
                    ? "text-slate-400"
                    : stat.deltaPct > 0
                      ? "text-red-600"
                      : "text-emerald-600"
                )}
              >
                {stat.deltaPct !== null
                  ? `${stat.deltaPct > 0 ? "↑" : stat.deltaPct < 0 ? "↓" : "→"} ${formatPercent(Math.abs(stat.deltaPct))}`
                  : "new"}
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${stat.shareOfCurrent}%`, backgroundColor: CATEGORY_COLORS[stat.category] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

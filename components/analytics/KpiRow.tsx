import { MonthRunRate } from "@/lib/forecast";
import { CategoryPeriodStat, PeriodComparison } from "@/lib/insights";
import { CATEGORY_COLORS } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface KpiRowProps {
  comparison: PeriodComparison;
  periodDays: number;
  runRate: MonthRunRate;
  previousMonthTotal: number | null;
  biggestMover: CategoryPeriodStat | null;
}

/** For spending, "up" is bad news (red) and "down" is good news (emerald) — the inverse of typical revenue KPIs. */
function deltaTone(deltaPct: number | null): string {
  if (deltaPct === null || Math.abs(deltaPct) < 1) return "text-slate-400";
  return deltaPct > 0 ? "text-red-600" : "text-emerald-600";
}

function deltaArrow(deltaPct: number | null): string {
  if (deltaPct === null || Math.abs(deltaPct) < 1) return "→";
  return deltaPct > 0 ? "↑" : "↓";
}

export function KpiRow({ comparison, periodDays, runRate, previousMonthTotal, biggestMover }: KpiRowProps) {
  const dailyAverage = periodDays > 0 ? comparison.currentTotal / periodDays : 0;
  const projectedDeltaPct =
    previousMonthTotal && previousMonthTotal > 0
      ? ((runRate.projectedTotal - previousMonthTotal) / previousMonthTotal) * 100
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm font-medium text-slate-500">Spend this period</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {formatCurrency(comparison.currentTotal)}
        </p>
        <p className={cn("mt-1 text-xs font-medium", deltaTone(comparison.deltaPct))}>
          {deltaArrow(comparison.deltaPct)}{" "}
          {comparison.deltaPct !== null ? formatPercent(Math.abs(comparison.deltaPct)) : "n/a"} vs prior period
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm font-medium text-slate-500">Projected this month</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-brand-600">
          {formatCurrency(runRate.projectedTotal)}
        </p>
        <p className={cn("mt-1 text-xs font-medium", deltaTone(projectedDeltaPct))}>
          Day {runRate.daysElapsed} of {runRate.daysInMonth}
          {projectedDeltaPct !== null && (
            <>
              {" "}
              · {deltaArrow(projectedDeltaPct)} {formatPercent(Math.abs(projectedDeltaPct))} vs last month
            </>
          )}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm font-medium text-slate-500">Daily average</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{formatCurrency(dailyAverage)}</p>
        <p className="mt-1 text-xs text-slate-400">Across the selected period</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm font-medium text-slate-500">Biggest mover</p>
        {biggestMover ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[biggestMover.category] }}
              />
              <span className="text-xl font-semibold tracking-tight text-slate-900">{biggestMover.category}</span>
            </div>
            <p className={cn("mt-1 text-xs font-medium", deltaTone(biggestMover.deltaPct))}>
              {deltaArrow(biggestMover.deltaPct)}{" "}
              {biggestMover.deltaPct !== null
                ? `${formatPercent(Math.abs(biggestMover.deltaPct))} (${formatCurrency(Math.abs(biggestMover.deltaAbs))})`
                : formatCurrency(Math.abs(biggestMover.deltaAbs))}{" "}
              vs prior period
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Not enough data yet</p>
        )}
      </div>
    </div>
  );
}

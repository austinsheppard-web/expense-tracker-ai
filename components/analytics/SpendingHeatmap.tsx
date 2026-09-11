import { DateBounds } from "@/lib/dateRange";
import { getDailyTotals } from "@/lib/insights";
import { Expense } from "@/lib/types";
import { addDaysISO, cn, formatCurrency, formatDate, parseLocalDate, todayISO } from "@/lib/utils";

interface SpendingHeatmapProps {
  expenses: Expense[];
  bounds: DateBounds;
}

interface HeatmapCell {
  date: string;
  total: number;
  inRange: boolean;
}

const MAX_DAYS = 371;
const LEVEL_CLASSES = ["bg-slate-100", "bg-brand-100", "bg-brand-300", "bg-brand-500", "bg-brand-700"];

function alignToSunday(iso: string): string {
  return addDaysISO(iso, -parseLocalDate(iso).getDay());
}

function alignToSaturday(iso: string): string {
  return addDaysISO(iso, 6 - parseLocalDate(iso).getDay());
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

export function SpendingHeatmap({ expenses, bounds }: SpendingHeatmapProps) {
  const endISO = bounds.end ?? todayISO();
  const rawStartISO = bounds.start ?? endISO;
  const spanDays =
    Math.round((parseLocalDate(endISO).getTime() - parseLocalDate(rawStartISO).getTime()) / 86400000) + 1;
  const cappedStartISO = spanDays > MAX_DAYS ? addDaysISO(endISO, -(MAX_DAYS - 1)) : rawStartISO;

  const gridStart = alignToSunday(cappedStartISO);
  const gridEnd = alignToSaturday(endISO);
  const dailyMap = new Map(getDailyTotals(expenses).map((d) => [d.date, d.total]));

  const cells: HeatmapCell[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDaysISO(cursor, 1)) {
    cells.push({
      date: cursor,
      total: dailyMap.get(cursor) ?? 0,
      inRange: cursor >= cappedStartISO && cursor <= endISO,
    });
  }

  if (cells.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No spending data for this period
      </div>
    );
  }

  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const nonzero = cells
    .filter((c) => c.inRange && c.total > 0)
    .map((c) => c.total)
    .sort((a, b) => a - b);
  const q25 = quantile(nonzero, 0.25);
  const q50 = quantile(nonzero, 0.5);
  const q75 = quantile(nonzero, 0.75);

  function levelFor(total: number): number {
    if (total <= 0) return 0;
    if (total <= q25) return 1;
    if (total <= q50) return 2;
    if (total <= q75) return 3;
    return 4;
  }

  let lastMonthKey = "";
  const monthLabels = weeks.map((week) => {
    const d = parseLocalDate(week[0].date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key === lastMonthKey) return null;
    lastMonthKey = key;
    return d.toLocaleDateString("en-US", { month: "short" });
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-2">
        <div className="flex flex-col justify-between pt-4 pb-0.5">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
            <span key={i} className="h-3 text-[10px] leading-3 text-slate-400">
              {label}
            </span>
          ))}
        </div>
        <div>
          <div className="mb-0.5 flex gap-1">
            {weeks.map((week, i) => (
              <div key={week[0].date} className="relative h-3 w-3 text-[10px] leading-3 text-slate-400">
                <span className="absolute left-0 top-0 whitespace-nowrap">{monthLabels[i]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week) => (
              <div key={week[0].date} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <div key={cell.date} className="group relative">
                    <div className={cn("h-3 w-3 rounded-sm", cell.inRange ? LEVEL_CLASSES[levelFor(cell.total)] : "bg-transparent")} />
                    {cell.inRange && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block">
                        {formatDate(cell.date)} · {formatCurrency(cell.total)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
            Less
            {LEVEL_CLASSES.map((cls) => (
              <span key={cls} className={cn("h-3 w-3 rounded-sm", cls)} />
            ))}
            More
          </div>
        </div>
      </div>
    </div>
  );
}

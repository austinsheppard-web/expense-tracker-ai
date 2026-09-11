import { CATEGORIES, Category, Expense } from "./types";
import { monthKey, monthLabel, parseLocalDate, WEEKDAY_LABELS } from "./utils";

export interface DailyTotal {
  date: string;
  total: number;
}

export interface CategoryMonthPoint {
  key: string;
  label: string;
  total: number;
  byCategory: Record<Category, number>;
}

export interface WeekdayStat {
  weekday: number; // 0 = Sunday
  label: string;
  total: number;
  count: number;
  average: number;
}

export interface PeriodComparison {
  currentTotal: number;
  previousTotal: number;
  deltaAbs: number;
  deltaPct: number | null; // null when previous period had no spending to compare against
}

export interface CategoryPeriodStat {
  category: Category;
  currentTotal: number;
  previousTotal: number;
  deltaAbs: number;
  deltaPct: number | null;
  shareOfCurrent: number; // 0-100
}

export interface DailyAnomaly {
  date: string;
  total: number;
  typicalDay: number;
  ratio: number;
}

/** Sums expenses per calendar day. Only days with at least one expense are included. */
export function getDailyTotals(expenses: Expense[]): DailyTotal[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Full monthly series (no truncation), including months with zero spend inside the span. */
export function getMonthlySeries(expenses: Expense[]): CategoryMonthPoint[] {
  if (expenses.length === 0) return [];

  const byMonth = new Map<string, Record<Category, number>>();
  for (const e of expenses) {
    const key = monthKey(e.date);
    if (!byMonth.has(key)) {
      const empty = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
      byMonth.set(key, empty);
    }
    const bucket = byMonth.get(key)!;
    bucket[e.category] += e.amount;
  }

  const keys = Array.from(byMonth.keys()).sort();
  const firstKey = keys[0];
  const lastKey = keys[keys.length - 1];

  // Fill any gap months with zero so the trend line doesn't skip silently.
  const points: CategoryMonthPoint[] = [];
  let cursor = firstKey;
  while (cursor <= lastKey) {
    const byCategory = byMonth.get(cursor) ?? (Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>);
    const total = CATEGORIES.reduce((sum, c) => sum + byCategory[c], 0);
    points.push({ key: cursor, label: monthLabel(cursor), total, byCategory });
    const [y, m] = cursor.split("-").map(Number);
    const next = new Date(y, m, 1); // cursor's month is 1-indexed, so this lands on the next month
    cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  }
  return points;
}

export function getWeekdayStats(expenses: Expense[]): WeekdayStat[] {
  const totals = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  for (const e of expenses) {
    const weekday = parseLocalDate(e.date).getDay();
    totals[weekday] += e.amount;
    counts[weekday] += 1;
  }
  return WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    total: totals[weekday],
    count: counts[weekday],
    average: counts[weekday] > 0 ? totals[weekday] / counts[weekday] : 0,
  }));
}

export function comparePeriods(current: Expense[], previous: Expense[]): PeriodComparison {
  const currentTotal = current.reduce((sum, e) => sum + e.amount, 0);
  const previousTotal = previous.reduce((sum, e) => sum + e.amount, 0);
  return {
    currentTotal,
    previousTotal,
    deltaAbs: currentTotal - previousTotal,
    deltaPct: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null,
  };
}

export function compareCategoriesAcrossPeriods(current: Expense[], previous: Expense[]): CategoryPeriodStat[] {
  const currentTotal = current.reduce((sum, e) => sum + e.amount, 0);
  const currentMap = new Map<Category, number>();
  const previousMap = new Map<Category, number>();
  for (const c of CATEGORIES) {
    currentMap.set(c, 0);
    previousMap.set(c, 0);
  }
  for (const e of current) currentMap.set(e.category, (currentMap.get(e.category) ?? 0) + e.amount);
  for (const e of previous) previousMap.set(e.category, (previousMap.get(e.category) ?? 0) + e.amount);

  return CATEGORIES.map((category) => {
    const currentCatTotal = currentMap.get(category) ?? 0;
    const previousCatTotal = previousMap.get(category) ?? 0;
    return {
      category,
      currentTotal: currentCatTotal,
      previousTotal: previousCatTotal,
      deltaAbs: currentCatTotal - previousCatTotal,
      deltaPct: previousCatTotal > 0 ? ((currentCatTotal - previousCatTotal) / previousCatTotal) * 100 : null,
      shareOfCurrent: currentTotal > 0 ? (currentCatTotal / currentTotal) * 100 : 0,
    };
  }).sort((a, b) => b.currentTotal - a.currentTotal);
}

/** The category with the largest absolute dollar swing between two periods (needs a nonzero baseline). */
export function biggestMover(stats: CategoryPeriodStat[]): CategoryPeriodStat | null {
  const eligible = stats.filter((s) => s.previousTotal > 0 || s.currentTotal > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((max, s) => (Math.abs(s.deltaAbs) > Math.abs(max.deltaAbs) ? s : max), eligible[0]);
}

/**
 * Flags days whose total spend is a statistical outlier (> mean + 2 standard
 * deviations of nonzero daily totals). Requires at least 10 spending days to
 * avoid flagging noise in sparse data.
 */
export function detectDailyAnomalies(expenses: Expense[], limit = 3): DailyAnomaly[] {
  const daily = getDailyTotals(expenses);
  if (daily.length < 10) return [];

  const mean = daily.reduce((sum, d) => sum + d.total, 0) / daily.length;
  const variance = daily.reduce((sum, d) => sum + (d.total - mean) ** 2, 0) / daily.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return [];

  const threshold = mean + 2 * stddev;
  return daily
    .filter((d) => d.total > threshold)
    .map((d) => ({ date: d.date, total: d.total, typicalDay: mean, ratio: d.total / mean }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

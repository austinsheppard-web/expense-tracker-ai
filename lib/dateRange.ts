import { Category, Expense } from "./types";
import { addDaysISO, parseLocalDate, todayISO } from "./utils";

export type RangePreset = "3m" | "6m" | "12m" | "ytd" | "all" | "custom";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

export interface DateBounds {
  start: string | null;
  end: string | null;
}

export function getRangeBounds(preset: RangePreset, expenses: Expense[], custom: DateBounds): DateBounds {
  const today = todayISO();
  switch (preset) {
    case "3m":
      return { start: addDaysISO(today, -90), end: today };
    case "6m":
      return { start: addDaysISO(today, -182), end: today };
    case "12m":
      return { start: addDaysISO(today, -365), end: today };
    case "ytd":
      return { start: `${today.slice(0, 4)}-01-01`, end: today };
    case "all": {
      if (expenses.length === 0) return { start: today, end: today };
      const earliest = expenses.reduce((min, e) => (e.date < min ? e.date : min), today);
      return { start: earliest, end: today };
    }
    case "custom":
      return custom;
  }
}

/** Same-length window immediately preceding `bounds`, used for period-over-period comparisons. */
export function getPreviousPeriodBounds(bounds: DateBounds): DateBounds {
  if (!bounds.start || !bounds.end) return { start: null, end: null };
  const start = parseLocalDate(bounds.start);
  const end = parseLocalDate(bounds.end);
  const lengthDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd = addDaysISO(bounds.start, -1);
  const prevStart = addDaysISO(prevEnd, -(lengthDays - 1));
  return { start: prevStart, end: prevEnd };
}

export function filterExpenses(
  expenses: Expense[],
  bounds: DateBounds,
  selectedCategories: Set<Category>
): Expense[] {
  return expenses.filter((e) => {
    if (!selectedCategories.has(e.category)) return false;
    if (bounds.start && e.date < bounds.start) return false;
    if (bounds.end && e.date > bounds.end) return false;
    return true;
  });
}

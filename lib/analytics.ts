import { CATEGORIES, Category, Expense } from "./types";
import { isSameMonth, monthKey, monthLabel } from "./utils";

export interface CategoryTotal {
  category: Category;
  total: number;
  percentage: number;
}

export interface MonthlyTotal {
  key: string;
  label: string;
  total: number;
}

export interface Summary {
  total: number;
  monthTotal: number;
  averagePerExpense: number;
  count: number;
  topCategory: CategoryTotal | null;
  byCategory: CategoryTotal[];
  byMonth: MonthlyTotal[];
}

export interface MonthlyCategorySummary {
  label: string;
  total: number;
  byCategory: CategoryTotal[];
}

/** Category breakdown scoped to the calendar month of `referenceDate` (defaults to now). */
export function computeMonthlyCategorySummary(
  expenses: Expense[],
  referenceDate: Date = new Date()
): MonthlyCategorySummary {
  const monthExpenses = expenses.filter((e) => isSameMonth(e.date, referenceDate));
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<Category, number>();
  for (const category of CATEGORIES) categoryMap.set(category, 0);
  for (const e of monthExpenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
  }

  const byCategory: CategoryTotal[] = CATEGORIES.map((category) => {
    const catTotal = categoryMap.get(category) ?? 0;
    return {
      category,
      total: catTotal,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(referenceDate);

  return { total, byCategory, label };
}

export function computeSummary(expenses: Expense[]): Summary {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const monthTotal = expenses
    .filter((e) => isSameMonth(e.date, now))
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = new Map<Category, number>();
  for (const category of CATEGORIES) categoryMap.set(category, 0);
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
  }

  const byCategory: CategoryTotal[] = CATEGORIES.map((category) => {
    const catTotal = categoryMap.get(category) ?? 0;
    return {
      category,
      total: catTotal,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  const topCategory = byCategory.find((c) => c.total > 0) ?? null;

  const monthMap = new Map<string, number>();
  for (const e of expenses) {
    const key = monthKey(e.date);
    monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount);
  }
  const byMonth: MonthlyTotal[] = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, monthTotalValue]) => ({ key, label: monthLabel(key), total: monthTotalValue }));

  return {
    total,
    monthTotal,
    averagePerExpense: expenses.length > 0 ? total / expenses.length : 0,
    count: expenses.length,
    topCategory,
    byCategory,
    byMonth,
  };
}

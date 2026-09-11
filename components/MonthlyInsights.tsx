"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { computeMonthlyCategorySummary } from "@/lib/analytics";
import { computeBudgetStreak } from "@/lib/insights";
import { CATEGORY_COLORS, CATEGORY_ICONS, Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MonthlyInsightsProps {
  expenses: Expense[];
}

export function MonthlyInsights({ expenses }: MonthlyInsightsProps) {
  const monthSummary = computeMonthlyCategorySummary(expenses);
  const chartCategories = monthSummary.byCategory.filter((c) => c.total > 0);
  const topCategories = chartCategories.slice(0, 3);
  const streak = computeBudgetStreak(expenses);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-6 border-b border-dashed border-slate-200 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Monthly Insights</h2>
        <p className="text-sm text-slate-500">{monthSummary.label}</p>
      </div>

      {chartCategories.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          No spending logged this month yet — add an expense to see your breakdown.
        </p>
      ) : (
        <>
          <div className="relative mx-auto mb-6 h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartCategories}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="62%"
                  outerRadius="98%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartCategories.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">
                Spending
              </span>
            </div>
          </div>

          <ul className="mb-6 space-y-3">
            {topCategories.map((entry) => (
              <li key={entry.category} className="flex items-center gap-3">
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[entry.category] }}
                />
                <span className="text-lg">{CATEGORY_ICONS[entry.category]}</span>
                <span className="text-sm text-slate-700">
                  {entry.category}: <span className="font-semibold text-slate-900">{formatCurrency(entry.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
        <p className="text-sm font-medium text-slate-500">Budget Streak</p>
        {streak.days > 0 ? (
          <>
            <p className="mt-1 text-4xl font-bold text-emerald-600">{streak.days}</p>
            <p className="text-sm text-slate-500">day{streak.days === 1 ? "" : "s"}!</p>
            <div className="mx-auto mt-3 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${streak.progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {streak.days} of {streak.milestone} days under your typical {formatCurrency(streak.dailyBudget)}/day
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Log a few days under your typical spend to start a streak.
          </p>
        )}
      </div>
    </div>
  );
}

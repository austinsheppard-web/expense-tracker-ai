"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { loadExpenses } from "@/lib/storage";
import { computeSummary } from "@/lib/analytics";
import { CATEGORY_COLORS, CATEGORY_ICONS, Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function TopCategoriesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoading(false);
  }, []);

  const summary = useMemo(() => computeSummary(expenses), [expenses]);
  const rankedCategories = summary.byCategory.filter((entry) => entry.total > 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Top Expense Categories</h1>
          <p className="text-sm text-slate-500">See which categories account for the most of your spending.</p>
        </div>

        {rankedCategories.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Add some expenses to see how your spending breaks down by category."
          />
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <ul className="divide-y divide-slate-100">
              {rankedCategories.map((entry, index) => (
                <li key={entry.category} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="w-6 text-sm font-semibold text-slate-400">#{index + 1}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg">
                    {CATEGORY_ICONS[entry.category]}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-900">{entry.category}</span>
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                        {formatCurrency(entry.total)}
                        <span className="ml-1.5 text-xs font-normal text-slate-400">
                          {entry.percentage.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${entry.percentage}%`,
                          backgroundColor: CATEGORY_COLORS[entry.category],
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

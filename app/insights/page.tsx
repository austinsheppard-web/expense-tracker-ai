"use client";

import { Header } from "@/components/Header";
import { MonthlyInsights } from "@/components/MonthlyInsights";
import { useExpenses } from "@/hooks/useExpenses";

export default function InsightsPage() {
  const { expenses, isLoading } = useExpenses();

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

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Monthly Insights</h1>
          <p className="text-sm text-slate-500">A quick snapshot of this month&apos;s spending.</p>
        </div>

        <MonthlyInsights expenses={expenses} />
      </main>
    </div>
  );
}

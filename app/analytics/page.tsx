"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RangeControl } from "@/components/analytics/RangeControl";
import { KpiRow } from "@/components/analytics/KpiRow";
import { TrendForecastChart } from "@/components/analytics/TrendForecastChart";
import { CategoryTrendChart } from "@/components/analytics/CategoryTrendChart";
import { SpendingHeatmap } from "@/components/analytics/SpendingHeatmap";
import { DayOfWeekChart } from "@/components/analytics/DayOfWeekChart";
import { CategoryBreakdownTable } from "@/components/analytics/CategoryBreakdownTable";
import { InsightsPanel, Insight } from "@/components/analytics/InsightsPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { DateBounds, RangePreset, filterExpenses, getPreviousPeriodBounds, getRangeBounds } from "@/lib/dateRange";
import { forecastMonthlySpend, projectCurrentMonth } from "@/lib/forecast";
import {
  biggestMover,
  compareCategoriesAcrossPeriods,
  comparePeriods,
  detectDailyAnomalies,
  getMonthlySeries,
  getWeekdayStats,
} from "@/lib/insights";
import { CATEGORIES, CATEGORY_ICONS, Category } from "@/lib/types";
import { formatCurrency, formatPercent, parseLocalDate } from "@/lib/utils";

export default function AnalyticsPage() {
  const { expenses, isLoading } = useExpenses();

  const [rangePreset, setRangePreset] = useState<RangePreset>("6m");
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(CATEGORIES));

  function toggleCategory(category: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleAllCategories() {
    setSelectedCategories((prev) => (prev.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES)));
  }

  const categoryFiltered = useMemo(
    () => filterExpenses(expenses, { start: null, end: null }, selectedCategories),
    [expenses, selectedCategories]
  );

  const bounds: DateBounds = useMemo(
    () => getRangeBounds(rangePreset, categoryFiltered, { start: customStart, end: customEnd }),
    [rangePreset, categoryFiltered, customStart, customEnd]
  );
  const previousBounds = useMemo(() => getPreviousPeriodBounds(bounds), [bounds]);

  const periodExpenses = useMemo(
    () => filterExpenses(categoryFiltered, bounds, selectedCategories),
    [categoryFiltered, bounds, selectedCategories]
  );
  const previousPeriodExpenses = useMemo(
    () => filterExpenses(categoryFiltered, previousBounds, selectedCategories),
    [categoryFiltered, previousBounds, selectedCategories]
  );

  const comparison = useMemo(() => comparePeriods(periodExpenses, previousPeriodExpenses), [periodExpenses, previousPeriodExpenses]);
  const categoryStats = useMemo(
    () => compareCategoriesAcrossPeriods(periodExpenses, previousPeriodExpenses),
    [periodExpenses, previousPeriodExpenses]
  );
  const mover = useMemo(() => biggestMover(categoryStats), [categoryStats]);
  const weekdayStats = useMemo(() => getWeekdayStats(periodExpenses), [periodExpenses]);
  const anomalies = useMemo(() => detectDailyAnomalies(periodExpenses), [periodExpenses]);

  const rangeMonthlySeries = useMemo(() => getMonthlySeries(periodExpenses), [periodExpenses]);
  const fullMonthlySeries = useMemo(() => getMonthlySeries(categoryFiltered), [categoryFiltered]);
  const forecastData = useMemo(() => forecastMonthlySpend(rangeMonthlySeries), [rangeMonthlySeries]);
  const runRate = useMemo(() => projectCurrentMonth(categoryFiltered), [categoryFiltered]);
  const previousMonthTotal = useMemo(() => {
    const idx = fullMonthlySeries.length - 2;
    return idx >= 0 ? fullMonthlySeries[idx].total : null;
  }, [fullMonthlySeries]);

  const periodDays =
    bounds.start && bounds.end
      ? Math.round((parseLocalDate(bounds.end).getTime() - parseLocalDate(bounds.start).getTime()) / 86400000) + 1
      : 1;

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    if (comparison.deltaPct !== null && Math.abs(comparison.deltaPct) >= 1) {
      const down = comparison.deltaPct < 0;
      list.push({
        id: "period-comparison",
        tone: down ? "positive" : "negative",
        icon: down ? "📉" : "📈",
        text: `You spent ${formatCurrency(comparison.currentTotal)} this period, ${formatPercent(Math.abs(comparison.deltaPct))} ${down ? "less" : "more"} than the period before it.`,
      });
    }

    if (previousMonthTotal && previousMonthTotal > 0) {
      const projectedDeltaPct = ((runRate.projectedTotal - previousMonthTotal) / previousMonthTotal) * 100;
      if (Math.abs(projectedDeltaPct) >= 1) {
        const down = projectedDeltaPct < 0;
        list.push({
          id: "run-rate",
          tone: down ? "positive" : "warning",
          icon: "🎯",
          text: `At your current pace, you're on track to spend ${formatCurrency(runRate.projectedTotal)} this month — ${formatPercent(Math.abs(projectedDeltaPct))} ${down ? "less" : "more"} than last month.`,
        });
      }
    }

    if (mover && mover.deltaPct !== null && Math.abs(mover.deltaPct) >= 5) {
      const down = mover.deltaAbs < 0;
      list.push({
        id: "biggest-mover",
        tone: down ? "positive" : "negative",
        icon: CATEGORY_ICONS[mover.category],
        text: `${mover.category} spending is ${down ? "down" : "up"} ${formatPercent(Math.abs(mover.deltaPct))} (${formatCurrency(Math.abs(mover.deltaAbs))}) vs the prior period — your biggest shift.`,
      });
    }

    const eligibleWeekdays = weekdayStats.filter((w) => w.count >= 2);
    if (eligibleWeekdays.length > 0) {
      const overallAverage = periodExpenses.length > 0 ? comparison.currentTotal / periodDays : 0;
      const busiest = eligibleWeekdays.reduce((max, w) => (w.average > max.average ? w : max), eligibleWeekdays[0]);
      if (overallAverage > 0 && busiest.average > overallAverage * 1.15) {
        const liftPct = ((busiest.average - overallAverage) / overallAverage) * 100;
        list.push({
          id: "weekday-pattern",
          tone: "neutral",
          icon: "📅",
          text: `You tend to spend the most on ${busiest.label}s — about ${formatPercent(liftPct)} above your typical day.`,
        });
      }
    }

    if (anomalies.length > 0) {
      const top = anomalies[0];
      list.push({
        id: "anomaly",
        tone: "warning",
        icon: "⚠️",
        text: `Your biggest single day this period was ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseLocalDate(top.date))} at ${formatCurrency(top.total)} — about ${top.ratio.toFixed(1)}x a typical day.`,
      });
    }

    if (categoryStats.length > 0 && categoryStats[0].currentTotal > 0) {
      const top = categoryStats[0];
      list.push({
        id: "top-category",
        tone: "neutral",
        icon: "🏆",
        text: `${top.category} is your top spending category this period at ${formatPercent(top.shareOfCurrent)} of total spend.`,
      });
    }

    return list;
  }, [comparison, previousMonthTotal, runRate, mover, weekdayStats, periodExpenses, periodDays, anomalies, categoryStats]);

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
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">
            Historical trends, forecasts, and spending patterns.{" "}
            <Link href="/" className="text-brand-600 hover:text-brand-700">
              Back to overview
            </Link>
          </p>
        </div>

        <RangeControl
          preset={rangePreset}
          onPresetChange={setRangePreset}
          customStart={customStart}
          customEnd={customEnd}
          onCustomChange={(start, end) => {
            setCustomStart(start);
            setCustomEnd(end);
          }}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onToggleAllCategories={toggleAllCategories}
        />

        <KpiRow
          comparison={comparison}
          periodDays={periodDays}
          runRate={runRate}
          previousMonthTotal={previousMonthTotal}
          biggestMover={mover}
        />

        <div className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Spending trend &amp; forecast</h2>
          <p className="mb-4 text-xs text-slate-400">
            Bars show actual monthly spend; the dashed line projects the next 3 months from your recent trend, with a
            shaded typical range.
          </p>
          <TrendForecastChart data={forecastData} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Category trends over time</h2>
            <CategoryTrendChart data={rangeMonthlySeries} />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Category breakdown</h2>
            <CategoryBreakdownTable stats={categoryStats} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 rounded-2xl bg-white p-5 shadow-card lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Daily spending</h2>
            <SpendingHeatmap expenses={periodExpenses} bounds={bounds} />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Spend by day of week</h2>
            <DayOfWeekChart data={weekdayStats} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Insights</h2>
          <InsightsPanel insights={insights} />
        </div>
      </main>
    </div>
  );
}

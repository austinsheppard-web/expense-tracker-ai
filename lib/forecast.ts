import { Expense } from "./types";
import { CategoryMonthPoint } from "./insights";
import { addMonthsToKey, daysInMonth, monthLabel, parseLocalDate, todayISO } from "./utils";

export interface ForecastMonthPoint {
  key: string;
  label: string;
  actual: number | null; // null for future (forecast-only) months
  forecast: number | null; // null for past (actual-only) months
  low: number | null;
  high: number | null;
}

/**
 * Simple ordinary-least-squares line through recent monthly totals, projected
 * forward. Deliberately plain (no external stats/ML library) so the number is
 * easy to explain: it's "continue the recent trend," not a black box.
 */
export function forecastMonthlySpend(history: CategoryMonthPoint[], monthsAhead = 3, lookback = 6): ForecastMonthPoint[] {
  const actualPoints: ForecastMonthPoint[] = history.map((h) => ({
    key: h.key,
    label: h.label,
    actual: h.total,
    forecast: null,
    low: null,
    high: null,
  }));

  if (history.length === 0) return actualPoints;

  const recent = history.slice(-lookback);
  const n = recent.length;
  const xs = recent.map((_, i) => i);
  const ys = recent.map((h) => h.total);

  let slope = 0;
  let intercept = ys[ys.length - 1] ?? 0;

  if (n >= 2) {
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
    const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
    slope = denominator !== 0 ? numerator / denominator : 0;
    intercept = yMean - slope * xMean;
  }

  const residuals = xs.map((x, i) => ys[i] - (intercept + slope * x));
  const residualStddev = Math.sqrt(residuals.reduce((sum, r) => sum + r ** 2, 0) / Math.max(n, 1));

  const lastKey = history[history.length - 1].key;
  const bridgePoint: ForecastMonthPoint = {
    ...actualPoints[actualPoints.length - 1],
    forecast: actualPoints[actualPoints.length - 1].actual,
    low: actualPoints[actualPoints.length - 1].actual,
    high: actualPoints[actualPoints.length - 1].actual,
  };

  const futurePoints: ForecastMonthPoint[] = [];
  for (let step = 1; step <= monthsAhead; step++) {
    const key = addMonthsToKey(lastKey, step);
    const x = n - 1 + step;
    const pointEstimate = Math.max(0, intercept + slope * x);
    futurePoints.push({
      key,
      label: monthLabel(key),
      actual: null,
      forecast: pointEstimate,
      low: Math.max(0, pointEstimate - 1.28 * residualStddev),
      high: pointEstimate + 1.28 * residualStddev,
    });
  }

  return [...actualPoints.slice(0, -1), bridgePoint, ...futurePoints];
}

export interface MonthRunRate {
  monthToDateTotal: number;
  daysElapsed: number;
  daysInMonth: number;
  projectedTotal: number;
}

/** Projects the current month's total by extrapolating month-to-date spend at its current daily pace. */
export function projectCurrentMonth(expenses: Expense[], referenceDate = parseLocalDate(todayISO())): MonthRunRate {
  const year = referenceDate.getFullYear();
  const monthIndex0 = referenceDate.getMonth();
  const daysElapsed = referenceDate.getDate();
  const totalDaysInMonth = daysInMonth(year, monthIndex0);

  const monthToDateTotal = expenses
    .filter((e) => {
      const d = parseLocalDate(e.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex0 && d.getDate() <= daysElapsed;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const dailyPace = daysElapsed > 0 ? monthToDateTotal / daysElapsed : 0;

  return {
    monthToDateTotal,
    daysElapsed,
    daysInMonth: totalDaysInMonth,
    projectedTotal: dailyPace * totalDaysInMonth,
  };
}

# Monthly Insights — Implementation

## Overview

The Monthly Insights screen (`/insights`) is a single-card summary of the current calendar month's spending: a donut chart of this month's category breakdown, a "top 3" list of the biggest categories, and a "Budget Streak" panel counting consecutive days spent at or under the user's own typical daily spend. It was built from a hand-drawn napkin sketch (donut chart, "Top 3!" category list, dashed streak box with a progress bar) as a new top-level page alongside Overview/Analytics/Top Categories/Top Vendors. Like the rest of the app, it is entirely client-side — it reads the same `localStorage`-backed `Expense[]` data via `useExpenses()` (`hooks/useExpenses.ts`) and does no network I/O.

This is a **frontend-only** feature: there is no `app/api` route or server-side code (the app has no `app/api` directory at all). All computation is plain arithmetic run in the browser.

## Architecture

- `lib/analytics.ts` — `computeMonthlyCategorySummary(expenses, referenceDate = new Date())` (`lib/analytics.ts:33-52`): filters `expenses` to the calendar month of `referenceDate` and returns a per-category breakdown plus a formatted month label ("September 2026"). This is a month-scoped sibling of the existing `computeSummary()`, which only exposes an all-time `byCategory` breakdown and a same-month *total* (no per-category split) — a new function was added rather than reshaping `computeSummary()`, since that function's existing shape is depended on by `app/page.tsx` and `app/top-categories/page.tsx`.
- `lib/insights.ts` — `computeBudgetStreak(expenses)` (`lib/insights.ts:47-86`): derives a "Budget Streak" from existing daily-total logic (`getDailyTotals`, already used by `detectDailyAnomalies`).
- `components/MonthlyInsights.tsx` — presentational component; takes `expenses: Expense[]` as its only prop and does all the derivation (`computeMonthlyCategorySummary`, `computeBudgetStreak`) internally via plain function calls (no `useMemo` — the component itself isn't memoized and these are cheap array scans over a single month/history, consistent with how `app/top-categories/page.tsx` computes `computeSummary` inline).
- `app/insights/page.tsx` — the page shell: loading state, `<Header>`, page title, and `<MonthlyInsights expenses={expenses} />`, following the same structure as `app/top-categories/page.tsx` and `app/analytics/page.tsx`.
- `components/Header.tsx` — added an "Insights" entry to `NAV_LINKS` (`components/Header.tsx:7-12`), between "Overview" and "Analytics".

Data flow: `useExpenses()` supplies the full `expenses` array (unfiltered — Insights intentionally has no date/category controls, unlike Analytics) → `app/insights/page.tsx` passes it straight to `<MonthlyInsights>` → the component derives the current month's breakdown and the streak on every render.

## Component structure

```
app/insights/page.tsx (InsightsPage)
├─ <Header>                // components/Header.tsx — nav tabs, "Insights" active
└─ <MonthlyInsights>       // components/MonthlyInsights.tsx — the whole card
   ├─ donut chart (Recharts <PieChart>/<Pie>) with a centered "Spending" label
   ├─ top-3 category list (colored bar + emoji + name + amount)
   └─ "Budget Streak" panel (day count, progress bar, caption)
```

`MonthlyInsights` is a single component rather than split into sub-components (unlike `components/analytics/*`, which is one component per chart/card) because each piece — donut, list, streak box — is small, non-reusable elsewhere, and shares one data source computed at the top of the function; splitting it would mean threading the same two derived values through props for no reuse benefit.

## User interactions

There are none beyond navigation — Insights has no filters, date range, or category toggles (contrast with `app/analytics/page.tsx`'s `RangeControl`). It is a fixed "this month, all categories" snapshot. The donut chart has no click/hover handlers beyond Recharts' default rendering (no `<Tooltip>` was added, unlike `components/CategoryChart.tsx`, since the amounts are already listed as text directly below the chart).

## Styling / accessibility notes

- Reuses existing design tokens (`rounded-2xl`, `shadow-card`, `slate-*` palette, `CATEGORY_COLORS`/`CATEGORY_ICONS` from `lib/types.ts`) so category color identity stays consistent with every other chart in the app (Overview's `CategoryChart`, Top Categories, Analytics).
- The center "Spending" label (`components/MonthlyInsights.tsx:50-54`) is a `pointer-events-none` absolutely-positioned `<div>` layered over the `ResponsiveContainer`, not a Recharts label — this was simpler than computing an SVG `<text>` position and matches the sketch's white rounded label sitting in the donut's hole.
- The dashed border on the "Budget Streak" box (`border border-dashed border-slate-300`) and the dashed divider under the card title echo the sketch's hand-drawn dashed rectangle/underline, translated into the app's existing flat design language rather than a literal hand-drawn style.
- Layout is single-column and centered (`max-w-2xl` page container, `mx-auto` chart/streak elements) since the source sketch is a single vertical card, not a multi-column dashboard.

## API / Interface

### `lib/analytics.ts`

```ts
interface MonthlyCategorySummary {
  label: string;        // e.g. "September 2026"
  total: number;
  byCategory: CategoryTotal[]; // all 6 categories, sorted by total desc, zero-total included
}

function computeMonthlyCategorySummary(expenses: Expense[], referenceDate?: Date): MonthlyCategorySummary;
```

### `lib/insights.ts`

```ts
interface BudgetStreak {
  days: number;
  dailyBudget: number;  // average of days with any spending — the implicit "budget" line
  milestone: number;    // next value from [7, 14, 30, 60, 90, 180, 365] greater than `days`
  progressPct: number;  // 0-100, days/milestone
}

function computeBudgetStreak(expenses: Expense[]): BudgetStreak;
```

`computeBudgetStreak` (`lib/insights.ts:61-86`) has no user-configurable budget input anywhere in the app (no settings/storage for one), so the "budget" line is derived rather than set: the average daily total across days that had *any* spending (`spendingDays`, filtered from `getDailyTotals`). Days with zero expenses are treated as automatically "under budget" and still extend the streak. Starting from `todayISO()`, it walks backward one day at a time (`addDaysISO(cursor, -1)`) while each day's total is `<= dailyBudget`, stopping at the first day that exceeds it or once it walks past the earliest recorded expense date. This is a deliberate, explainable heuristic ("days you spent at or under your own average") rather than a real budget feature — see Related documentation below if a configurable per-user budget is added later, as this function would need to change.

## Data model

No schema or storage changes. Both new functions are pure derivations over the existing `Expense[]` array (`lib/types.ts`) loaded via `lib/storage.ts` — same data source as every other page. Nothing new is persisted to `localStorage`.

## Configuration

No environment variables or feature flags.

## Error handling / edge cases

- No expenses this month: `computeMonthlyCategorySummary` returns `byCategory` with every category at `total: 0`; `MonthlyInsights` filters those out (`chartCategories`) and, when the filtered list is empty, renders a text empty state ("No spending logged this month yet...") instead of an empty/broken donut.
- No spending days at all (brand-new install before seeding, or all expenses deleted): `computeBudgetStreak` short-circuits to `{ days: 0, dailyBudget: 0, milestone: 7, progressPct: 0 }` before doing any date-walking, and the component shows "Log a few days under your typical spend to start a streak." instead of a `0`-day streak with a `$0.00/day` caption.
- Today has no expense yet: counts as under budget (`total` defaults to `0` via `totalsByDate.get(cursor) ?? 0`), so the streak includes the current in-progress day.
- Very long histories: the backward walk is bounded by `cursor >= earliestDate`, so it terminates in at most (today − earliest expense date) iterations — no unbounded loop.
- Singular/plural: the "days!" caption is `day` vs `days` based on `streak.days === 1` (`components/MonthlyInsights.tsx:79`).

## Security / edge cases

Same posture as the rest of the app: everything runs client-side over data already in `localStorage`; no user-controlled string reaches an API call or is interpolated into HTML; no new external dependency (the donut chart reuses the already-installed `recharts`, the same library `components/CategoryChart.tsx` uses).

## Testing

There is no automated test suite in this repository (consistent with `docs/dev/filter-expenses-implementation.md` and `docs/dev/analytics-dashboard-implementation.md`). This feature was verified manually: `npx tsc --noEmit` passes with no errors, and the page was checked via `npm run dev` plus a Playwright-driven browser session at both a 1200px desktop width and a 420px mobile width, confirming the donut, top-3 list, and streak panel render correctly against the app's real seed data and reflow to a single column on narrow viewports.

## Related documentation

- See the [user guide](../user/how-to-view-monthly-insights.md) for end-user steps.
- [Analytics dashboard implementation](analytics-dashboard-implementation.md) — `lib/insights.ts`'s `getDailyTotals` and the empty-state pattern this feature reuses were both introduced there; also the precedent for a frontend-only feature with a plain-arithmetic "interface" layer in `lib/`.

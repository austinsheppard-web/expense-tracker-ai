# Analytics Dashboard — Implementation

## Overview

The analytics dashboard (`/analytics`) is a second top-level page that gives a fuller picture of spending than the Overview page's summary cards: multi-month trend history, a 3-month forecast, category trends over time, a daily spending heatmap, day-of-week patterns, period-over-period comparison KPIs, and auto-generated natural-language insights. Like the rest of the app, it is entirely client-side — it reads the same `localStorage`-backed `Expense[]` data via `useExpenses()` (`hooks/useExpenses.ts`) and does no network I/O. All trend and forecast math is plain arithmetic (sums, an OLS linear regression, quantiles) run in the browser; there is no ML library, no external API, and no server component.

## Architecture

New code is split by responsibility:

- `lib/dateRange.ts` — range-preset → date-bounds resolution (`getRangeBounds`), the "same-length prior window" calculation used for comparisons (`getPreviousPeriodBounds`), and category+date filtering (`filterExpenses`).
- `lib/insights.ts` — pure analytics over an `Expense[]` slice: daily totals, a full (gap-filled) monthly series with a per-category breakdown, weekday stats, period comparisons (overall and per-category), the "biggest mover" category, and simple statistical daily-anomaly detection.
- `lib/forecast.ts` — `forecastMonthlySpend` (OLS regression over the last 6 monthly totals, projected 3 months forward with a ±1.28σ residual band) and `projectCurrentMonth` (run-rate projection: month-to-date ÷ days elapsed × days in month).
- `components/analytics/*` — presentational chart/table/card components, each taking pre-computed data as props (no data fetching or filtering logic inside components).
- `app/analytics/page.tsx` — owns all page-level state (range preset, custom dates, selected categories), derives every filtered slice and computed metric via `useMemo`, and composes the components.
- `components/Header.tsx` — converted to a client component (`usePathname`) to render Overview/Analytics nav tabs.

Data flow: `useExpenses()` supplies the full `expenses` array → `app/analytics/page.tsx` applies the category filter (`filterExpenses` with no date bound) to get `categoryFiltered` → applies the selected date range on top of that to get `periodExpenses`, plus the same range shifted one window back for `previousPeriodExpenses`. Charts that should reflect the selected historical window (trend/forecast, category trends) are built from `periodExpenses`; KPIs that need to stay correct regardless of the window (this month's run-rate projection, "vs last month") are built from `categoryFiltered` (full history, category-filtered only) so picking "3 months" doesn't starve the forecast's lookback or break the current-month projection.

This is a **frontend-only** feature — there is no `app/api` route involved (the app has no `app/api` directory).

## Component structure

```
app/analytics/page.tsx (AnalyticsPage)
├─ <Header>                          // components/Header.tsx — nav tabs (Overview/Analytics)
├─ <RangeControl>                    // range preset buttons + custom dates + category chips
├─ <KpiRow>                          // 4 KPI cards
├─ <TrendForecastChart>              // bars (actual) + dashed line + band (forecast)
├─ <CategoryTrendChart>              // stacked area by category, per month
├─ <CategoryBreakdownTable>          // per-category total + delta vs prior period
├─ <SpendingHeatmap>                 // GitHub-style daily calendar heatmap
├─ <DayOfWeekChart>                  // avg spend by weekday
└─ <InsightsPanel>                   // computed natural-language insight cards
```

State lives entirely in `AnalyticsPage` (`app/analytics/page.tsx`): `rangePreset`, `customStart`/`customEnd`, and `selectedCategories` (a `Set<Category>`, default = all). Every derived value — `bounds`, `periodExpenses`, `comparison`, `categoryStats`, `weekdayStats`, `forecastData`, `runRate`, and the `insights` array — is a `useMemo` keyed off that state plus `expenses`, so the whole page recomputes deterministically on any filter change. No chart component holds its own copy of the data or filters it further.

## User interactions

- **Time range** (`components/analytics/RangeControl.tsx`): six preset buttons (3/6/12 months, YTD, All time, Custom). Custom reveals two native `<input type="date">` pickers. Selecting a non-custom preset recomputes `bounds` via `getRangeBounds` (`lib/dateRange.ts:20`); there's no debounce needed since it's a discrete button click, not a text field.
- **Categories** (`components/analytics/RangeControl.tsx`): toggleable chips per category (`toggleCategory`/`toggleAllCategories` in `app/analytics/page.tsx`), mirroring the multi-select pattern already used in `components/ExportPanel.tsx`. Deselecting all categories is allowed and every chart/KPI degrades to an explicit "no data" state rather than erroring.
- **Heatmap hover** (`components/analytics/SpendingHeatmap.tsx:112-118`): each day cell is a `group relative` wrapper; hovering reveals an absolutely-positioned tooltip (`group-hover:block`) showing the date and that day's total — pure CSS, no JS mouse tracking.
- **Chart tooltips**: `TrendForecastChart` and `CategoryTrendChart` use Recharts' `<Tooltip>` (custom content on the former, `formatter` on the latter) consistent with the existing `TrendChart`/`CategoryChart` pattern.

## Styling / accessibility notes

- Reuses the existing design tokens throughout (`brand-*` scale, `shadow-card`, `rounded-2xl` cards) rather than introducing new colors — see `tailwind.config.ts`.
- Category color identity (`CATEGORY_COLORS`, `lib/types.ts`) is preserved everywhere a category appears (breakdown bars, stacked area, filter chips), so the same category always maps to the same color across the whole app, not just within one chart.
- Spend-direction color semantics follow the existing `Toast` convention (`components/Toast.tsx`): emerald = favorable (spending down), red = unfavorable (spending up) — see `deltaTone()` in `components/analytics/KpiRow.tsx:15-18`. This is the inverse of a typical revenue dashboard and is called out in a one-line comment since it isn't obvious from the code alone.
- All grid layouts collapse to a single column below `sm`/`lg` breakpoints (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`, etc.), matching the Overview page's responsive pattern.
- The heatmap's day-cell grid is wrapped in `overflow-x-auto` with `min-w-0` on its parent grid item (`app/analytics/page.tsx`) — without the explicit `min-w-0`, the grid item's default `min-width: auto` lets the heatmap's intrinsic width push the whole page into horizontal scroll on narrow viewports instead of scrolling only the heatmap itself. This was caught and fixed during manual testing at a 390px viewport.

## API / Interface

### `lib/dateRange.ts`

```ts
type RangePreset = "3m" | "6m" | "12m" | "ytd" | "all" | "custom";
interface DateBounds { start: string | null; end: string | null; }

function getRangeBounds(preset: RangePreset, expenses: Expense[], custom: DateBounds): DateBounds;
function getPreviousPeriodBounds(bounds: DateBounds): DateBounds; // same-length window immediately before `bounds`
function filterExpenses(expenses: Expense[], bounds: DateBounds, selectedCategories: Set<Category>): Expense[];
```

### `lib/insights.ts`

| Function | Returns | Notes |
|---|---|---|
| `getDailyTotals(expenses)` | `DailyTotal[]` | one entry per day with any spend, sorted ascending |
| `getMonthlySeries(expenses)` | `CategoryMonthPoint[]` | gap-filled (zero-value months included) full monthly history with a per-category breakdown |
| `getWeekdayStats(expenses)` | `WeekdayStat[]` (7, Sun→Sat) | total/count/average per weekday |
| `comparePeriods(current, previous)` | `PeriodComparison` | `deltaPct` is `null` when `previousTotal` is 0 (avoids a division-by-zero "Infinity%") |
| `compareCategoriesAcrossPeriods(current, previous)` | `CategoryPeriodStat[]` | sorted by `currentTotal` descending |
| `biggestMover(stats)` | `CategoryPeriodStat \| null` | largest absolute dollar swing between two periods |
| `detectDailyAnomalies(expenses, limit = 3)` | `DailyAnomaly[]` | days where total > mean + 2σ of nonzero daily totals; requires ≥ 10 spending days, otherwise returns `[]` |

### `lib/forecast.ts`

```ts
function forecastMonthlySpend(history: CategoryMonthPoint[], monthsAhead = 3, lookback = 6): ForecastMonthPoint[];
function projectCurrentMonth(expenses: Expense[], referenceDate = today): MonthRunRate;
```

`forecastMonthlySpend` fits an ordinary-least-squares line over the last `lookback` months (`lib/forecast.ts:19-58`), extends it `monthsAhead` months forward, and bands each forecast point at ±1.28 × the in-sample residual standard deviation (clamped at 0 on the low side). It's deliberately a plain regression rather than a black-box forecasting library, so the number is easy to explain to the end user: "continue the recent trend." `projectCurrentMonth` (`lib/forecast.ts:85-104`) is a simpler day-elapsed run-rate projection, used for the "Projected this month" KPI since a 6-month regression isn't the right tool for "how will this specific month end up."

## Data model

No schema or storage changes. Everything is derived in memory from the existing `Expense[]` array (`lib/types.ts`) loaded via `lib/storage.ts`. Dashboard filter state (range preset, custom dates, selected categories) is component state only — it is not persisted and resets to defaults (6 months, all categories) on reload, matching the existing Overview-page filter behavior.

## Configuration

No environment variables or feature flags. `lib/seed.ts` was expanded from a ~9-row, 20-day fixture to a ~12-month deterministic synthetic history (seeded PRNG — `mulberry32` in `lib/seed.ts:6-14`) so a fresh install has enough history for trend, forecast, and seasonal features to be meaningful; this only affects first-run demo data (`SEEDED_KEY` in `hooks/useExpenses.ts` prevents reseeding existing installs).

## Error handling / edge cases

- Every chart and KPI has an explicit empty/low-data state rather than rendering a broken chart: `TrendForecastChart` ("No monthly trend data yet"), `CategoryTrendChart` ("No category history yet"), `CategoryBreakdownTable` ("No spending data for this period"), `DayOfWeekChart` ("No spending data to chart yet"), `SpendingHeatmap` ("No spending data for this period"), `InsightsPanel` ("Add a few more expenses to unlock insights"), and `KpiRow`'s "Biggest mover" card ("Not enough data yet").
- `forecastMonthlySpend` requires ≥ 2 history points to fit a slope; with 0 or 1 points it falls back to a flat projection at the last known value (or `0`) rather than throwing.
- `detectDailyAnomalies` requires ≥ 10 distinct spending days before flagging anything, to avoid false positives ("your one recorded day is 100% above average") on sparse data.
- The heatmap caps its rendered span at 371 days (`MAX_DAYS`, `components/analytics/SpendingHeatmap.tsx:16`) even if "All time" spans longer, so a multi-year history can't blow up the grid.
- Selecting zero categories is a valid, non-error state — every widget shows its empty state rather than crashing on an empty `Expense[]`.

## Security / edge cases

Same posture as the rest of the app: all computation happens client-side over data already in `localStorage`; there's no query construction, no user-controlled string reaches an API call or is interpolated into HTML, and no new external dependency was added (charts use the already-installed `recharts`).

## Testing

There is no automated test suite in this repository (consistent with the rest of the app — see `docs/dev/filter-expenses-implementation.md`). The dashboard was verified manually via `npm run dev` plus a Playwright-driven browser session covering: 6-month and 12-month presets, category filtering (including deselecting all categories), the heatmap hover tooltip, and a 390×844 mobile viewport (which caught and led to the `min-w-0` fix noted above). `npx tsc --noEmit` and `npm run build` both pass with no errors or warnings.

## Related documentation

- See the [user guide](../user/how-to-use-the-analytics-dashboard.md) for end-user steps.
- [Filter expenses implementation](filter-expenses-implementation.md) — the Overview page's filtering pattern that `RangeControl`'s category chips and the range/date inputs follow.

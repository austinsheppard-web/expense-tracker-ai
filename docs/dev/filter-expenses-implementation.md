# Filter Expenses — Implementation

## Overview

The filter feature lets users narrow the expense list by free-text search, category, and date range without mutating the underlying data set. Filtering is entirely client-side: it recomputes a derived list from the in-memory `expenses` array on every filter change, so it works against the same `localStorage`-backed data the rest of the app uses and requires no network calls.

## Architecture

Filtering is centralized in the `useExpenses` hook rather than in the UI layer, so any consumer of the hook gets a consistent filtered view:

- `hooks/useExpenses.ts` — owns `filters` state (`ExpenseFilters`) and derives `filteredExpenses` via a `useMemo` over `expenses` and `filters`.
- `components/FilterBar.tsx` — presentational component; renders the search box, category `<select>`, and From/To date inputs, and calls back into the hook's setters. It holds no filtering logic itself.
- `app/page.tsx` — wires `useExpenses()` output into `<FilterBar>` (controls) and `<ExpenseList>` (results), and passes `filteredExpenses.length` down as the displayed result count.
- `lib/types.ts` — defines the `ExpenseFilters` shape and `DEFAULT_FILTERS` constant shared by the hook and the bar.

Flow: user types/selects in `FilterBar` → `onChange(nextFilters)` fires → `page.tsx`'s `setFilters` (from `useExpenses`) updates hook state → the `filteredExpenses` memo recomputes → `ExpenseList` re-renders with the new rows, and `FilterBar`'s result count updates in the same pass.

Note: `ExportPanel` (`app/page.tsx:163`) is passed the full `expenses` array, not `filteredExpenses` — CSV/JSON/PDF export is not currently scoped to the active filter, despite the top-level `README.md` describing export as covering "the currently filtered expenses" (a docs/behavior mismatch worth flagging if export is revisited).

This is a **frontend-only** feature: there is no `app/api` route or server-side code involved anywhere in the filter path (the app has no `app/api` directory at all — see `app/` containing only `layout.tsx`, `page.tsx`, `globals.css`, `favicon.ico`). All state lives in the browser and is derived from `localStorage`-backed data via `lib/storage.ts`.

## Component structure

```
app/page.tsx (Home)
├─ useExpenses()                 // hooks/useExpenses.ts — owns filters state + derives filteredExpenses
├─ <FilterBar>                   // components/FilterBar.tsx — controlled inputs, no local state
└─ <ExpenseList expenses={filteredExpenses}>  // renders the derived rows
```

State management: `filters: ExpenseFilters` is a single `useState` in `useExpenses` (hooks/useExpenses.ts:13), lifted above `FilterBar`. `FilterBar` itself holds no internal state — every field's value comes from the `filters` prop and every change is pushed back up through `onChange`, so `useExpenses` is the single source of truth for both the raw and derived (`filteredExpenses`) data.

Key props (`FilterBarProps`, components/FilterBar.tsx:5-11): `filters`, `onChange`, `onReset`, `hasActiveFilters`, `resultCount` — see full signature under API / Interface below.

## User interactions

- **Search** (`components/FilterBar.tsx:34-41`): typing in the text input fires `onChange` on every keystroke — there is no debounce, so `filteredExpenses` recomputes on each character.
- **Category** (`components/FilterBar.tsx:49-61`): a native `<select>`; choosing an option fires one `onChange` with the selected `Category | "All"`.
- **Date range** (`components/FilterBar.tsx:68-87`): two native `<input type="date">` pickers (From/To); the browser supplies its own date-picker UI. An empty value is normalized to `null` (`e.target.value || null`) rather than an empty string.
- **Clear filters** (`components/FilterBar.tsx:95-103`): a `<button type="button">` that calls `onReset` (→ `resetFilters` in `useExpenses`, resetting to `DEFAULT_FILTERS`). It only renders when `hasActiveFilters` is `true`, so it disappears once filters are back to their defaults.
- No client-side validation is performed on any field — e.g. an inverted date range (`startDate` after `endDate`) is accepted silently and simply yields zero results (see Error handling below).

## Styling / accessibility notes

- Layout uses Tailwind's responsive grid (`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5`, components/FilterBar.tsx:16) so the four controls stack to one column on mobile and spread to a 5-column row at `lg`.
- Every input has an explicit `<label htmlFor>` bound to the input's `id` (`search`, `category-filter`, `start-date`, `end-date`), so labels are correctly associated for screen readers.
- Focus states are visible via `focus:border-brand-500 focus:ring-2 focus:ring-brand-100` on every control, supporting keyboard navigation.
- Two accessibility gaps observed in the current markup: the decorative search-icon `<svg>` (components/FilterBar.tsx:22-33) has `pointer-events-none` but no `aria-hidden="true"`, so it may be exposed to assistive tech unnecessarily; and the result-count `<p>` (components/FilterBar.tsx:92-94) has no `aria-live` region, so screen-reader users aren't notified when the count changes after a filter edit.

## API / Interface

### `ExpenseFilters` (lib/types.ts:23-28)

```ts
export interface ExpenseFilters {
  search: string;
  category: Category | "All";
  startDate: string | null; // ISO date, e.g. "2026-03-05"
  endDate: string | null;
}

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: null,
  endDate: null,
};
```

### `useExpenses()` (hooks/useExpenses.ts)

Relevant returned fields:

| Field | Type | Description |
|---|---|---|
| `filters` | `ExpenseFilters` | Current filter state |
| `setFilters` | `(filters: ExpenseFilters) => void` | Replaces the whole filters object (React `useState` setter) |
| `resetFilters` | `() => void` | Resets `filters` to `DEFAULT_FILTERS` |
| `hasActiveFilters` | `boolean` | `true` if any field differs from its default |
| `filteredExpenses` | `Expense[]` | `expenses` filtered per `filters`, sorted newest-first by `date` (ties broken by `createdAt` descending) |

### `FilterBar` (components/FilterBar.tsx:5-11)

```ts
interface FilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}
```

`FilterBar` is fully controlled — it holds no internal state. Every input's `onChange` spreads the current `filters` and overwrites the one changed field, then calls the parent's `onChange`.

## Data model

No schema or storage changes — filtering operates purely in memory over the existing `Expense[]` array (`lib/types.ts:12-19`) loaded via `lib/storage.ts`. Filters themselves are not persisted; they reset to `DEFAULT_FILTERS` on page reload since `filters` state is initialized fresh in `useExpenses` (hooks/useExpenses.ts:13) and never written to `localStorage`.

## Configuration

No environment variables or feature flags. The only "configuration" is `CATEGORIES` (lib/types.ts:1-8), which populates the category `<select>` options in `FilterBar` and bounds the valid values of `ExpenseFilters["category"]`.

## Error handling

There is no dedicated error state for filtering — it's a pure, synchronous array transform with no I/O, so it can't throw or fail asynchronously. Known edge behaviors (by inspection of `hooks/useExpenses.ts:77-91`):

- **No matches**: `filteredExpenses` is simply `[]`; `FilterBar` shows "0 results" and `ExpenseList` is responsible for rendering its own empty state.
- **Search is case-insensitive** and matches against a concatenated `description + category` string, so a search term can match on category name even if typed in the search box rather than selected from the dropdown.
- **Date range is inclusive** on both ends (`e.date < filters.startDate` / `e.date > filters.endDate` are the only exclusions) and compares ISO date strings lexicographically, which is safe only because dates are stored as zero-padded `YYYY-MM-DD`.
- **An inverted range** (`startDate` after `endDate`) is not validated anywhere — the UI will simply show zero results rather than an error.

## Testing

There is no automated test suite in this repository (no `*.test.ts(x)` files, no test runner configured in `package.json`). Filtering is currently verified manually per the "Filter" step in the top-level `README.md`:

> Filter — use the search box, category dropdown, and From/To date pickers above the list; "Clear filters" appears once any filter is active.

To exercise it manually: `npm run dev`, open the app, and combine search/category/date inputs above the expense list, confirming the result count and "Clear filters" link (`components/FilterBar.tsx:95-103`) behave as expected.

## Security / edge cases

- All filtering happens client-side over data already in the browser's `localStorage` — there is no server-side filtering endpoint and thus no injection surface (no SQL/query construction).
- The search input is rendered as a controlled `<input>` value and only ever used for a `.includes()` string comparison (hooks/useExpenses.ts:83-87); it is never interpolated into HTML or used to build a regex, so it isn't an XSS or ReDoS vector.
- `setFilters` replaces the entire `ExpenseFilters` object rather than patching a single key at the hook level — callers (currently only `FilterBar`) must spread the previous filters when changing one field, or they will silently clear the others.

## Related documentation

See the [user guide](../user/how-to-filter-expenses.md) for end-user steps.

"use client";

import { CATEGORIES, ExpenseFilters } from "@/lib/types";

interface FilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}

export function FilterBar({ filters, onChange, onReset, hasActiveFilters, resultCount }: FilterBarProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="search" className="mb-1.5 block text-xs font-medium text-slate-500">
            Search
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            <input
              id="search"
              type="text"
              placeholder="Search descriptions or categories..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category-filter" className="mb-1.5 block text-xs font-medium text-slate-500">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as ExpenseFilters["category"] })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="mb-1.5 block text-xs font-medium text-slate-500">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="mb-1.5 block text-xs font-medium text-slate-500">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value || null })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

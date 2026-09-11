"use client";

import { RANGE_PRESETS, RangePreset } from "@/lib/dateRange";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RangeControlProps {
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  customStart: string | null;
  customEnd: string | null;
  onCustomChange: (start: string | null, end: string | null) => void;
  selectedCategories: Set<Category>;
  onToggleCategory: (category: Category) => void;
  onToggleAllCategories: () => void;
}

export function RangeControl({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomChange,
  selectedCategories,
  onToggleCategory,
  onToggleAllCategories,
}: RangeControlProps) {
  const allSelected = selectedCategories.size === CATEGORIES.length;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">Time range</p>
          <div className="flex flex-wrap gap-1.5">
            {RANGE_PRESETS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPresetChange(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  preset === opt.value
                    ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input
                type="date"
                aria-label="Custom range start"
                value={customStart ?? ""}
                max={customEnd ?? undefined}
                onChange={(e) => onCustomChange(e.target.value || null, customEnd)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                aria-label="Custom range end"
                value={customEnd ?? ""}
                min={customStart ?? undefined}
                onChange={(e) => onCustomChange(customStart, e.target.value || null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}
        </div>

        <div className="lg:text-right">
          <div className="mb-1.5 flex items-center gap-2 lg:justify-end">
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <button
              type="button"
              onClick={onToggleAllCategories}
              className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:justify-end">
            {CATEGORIES.map((category) => {
              const checked = selectedCategories.has(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onToggleCategory(category)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                    checked ? "border-slate-300 bg-slate-50 text-slate-700" : "border-slate-200 text-slate-400"
                  )}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: checked ? CATEGORY_COLORS[category] : "#cbd5e1" }}
                  />
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CATEGORIES, CATEGORY_COLORS, Category, Expense, ExpenseFilters } from "@/lib/types";
import { EXPORT_FORMATS, ExportFormat, filterExpensesForExport, runExport } from "@/lib/export";
import { cn, formatCurrency, formatDate, todayISO } from "@/lib/utils";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  initialFilters: ExpenseFilters;
}

const PREVIEW_LIMIT = 6;

function defaultFilename(): string {
  return `expenses-${todayISO()}`;
}

function categoriesFromFilter(category: ExpenseFilters["category"]): Set<Category> {
  return category === "All" ? new Set(CATEGORIES) : new Set([category]);
}

export function ExportPanel({ isOpen, onClose, expenses, initialFilters }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [filename, setFilename] = useState(defaultFilename());
  const [isExporting, setIsExporting] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormat("csv");
    setStartDate(initialFilters.startDate);
    setEndDate(initialFilters.endDate);
    setSelectedCategories(categoriesFromFilter(initialFilters.category));
    setFilename(defaultFilename());
    setIsExporting(false);
    setCompletedCount(null);
    // Only re-seed when the panel opens, so edits inside it aren't clobbered
    // by unrelated changes to the main filter bar while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const filtered = useMemo(
    () =>
      filterExpensesForExport(expenses, {
        startDate,
        endDate,
        categories: Array.from(selectedCategories),
      }),
    [expenses, startDate, endDate, selectedCategories]
  );

  const totalAmount = useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered]);
  const previewRows = filtered.slice(0, PREVIEW_LIMIT);
  const hiddenCount = filtered.length - previewRows.length;
  const allSelected = selectedCategories.size === CATEGORIES.length;
  const activeFormat = EXPORT_FORMATS.find((f) => f.value === format)!;

  function toggleCategory(category: Category) {
    setCompletedCount(null);
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleAllCategories() {
    setCompletedCount(null);
    setSelectedCategories(allSelected ? new Set() : new Set(CATEGORIES));
  }

  async function handleExport() {
    if (filtered.length === 0 || isExporting) return;
    setIsExporting(true);
    setCompletedCount(null);
    try {
      const result = await runExport(expenses, {
        format,
        startDate,
        endDate,
        categories: Array.from(selectedCategories),
        filename,
      });
      setCompletedCount(result.length);
    } finally {
      setIsExporting(false);
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="fixed inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-panel-title"
        className="relative z-10 flex h-full w-full max-w-md animate-slide-in-right flex-col bg-white shadow-card-hover"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="export-panel-title" className="text-lg font-semibold text-slate-900">
              Export expenses
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Choose a format, narrow the range, and download.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export panel"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Format</h3>
            <div className="grid grid-cols-3 gap-2">
              {EXPORT_FORMATS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                    format === opt.value
                      ? "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">{activeFormat.description}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Date range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="export-start" className="mb-1 block text-xs text-slate-500">
                  From
                </label>
                <input
                  id="export-start"
                  type="date"
                  value={startDate ?? ""}
                  max={endDate ?? undefined}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label htmlFor="export-end" className="mb-1 block text-xs text-slate-500">
                  To
                </label>
                <input
                  id="export-end"
                  type="date"
                  value={endDate ?? ""}
                  min={startDate ?? undefined}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Categories</h3>
              <button
                type="button"
                onClick={toggleAllCategories}
                className="text-xs font-medium text-brand-600 transition hover:text-brand-700"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((category) => {
                const checked = selectedCategories.has(category);
                return (
                  <label
                    key={category}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                      checked ? "border-slate-300 bg-slate-50 text-slate-700" : "border-slate-200 text-slate-400"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                    <span className="truncate">{category}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <label htmlFor="export-filename" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Filename
            </label>
            <div className="relative">
              <input
                id="export-filename"
                type="text"
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  setCompletedCount(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-14 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                .{format}
              </span>
            </div>
          </section>

          <section className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {filtered.length} record{filtered.length === 1 ? "" : "s"} selected
              </span>
              <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</h3>
            {filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                No expenses match these filters.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(e.date)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">{e.category}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-slate-600">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hiddenCount > 0 && (
                  <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-center text-[11px] text-slate-400">
                    +{hiddenCount} more row{hiddenCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          {completedCount !== null && !isExporting && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exported {completedCount} record{completedCount === 1 ? "" : "s"} as {format.toUpperCase()}.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0 || isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isExporting ? "Exporting..." : `Export ${filtered.length} record${filtered.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

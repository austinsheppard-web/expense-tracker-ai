"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { SummaryCards } from "@/components/SummaryCards";
import { CategoryChart } from "@/components/CategoryChart";
import { TrendChart } from "@/components/TrendChart";
import { FilterBar } from "@/components/FilterBar";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExportPanel } from "@/components/ExportPanel";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/components/Toast";
import { computeSummary } from "@/lib/analytics";
import { Expense, ExpenseInput } from "@/lib/types";

export default function Home() {
  const {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  function handleAddClick() {
    setEditingExpense(null);
    setIsFormOpen(true);
  }

  function handleEditClick(expense: Expense) {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  function handleFormSubmit(input: ExpenseInput) {
    if (editingExpense) {
      updateExpense(editingExpense.id, input);
      showToast("Expense updated");
    } else {
      addExpense(input);
      showToast("Expense added");
    }
    setIsFormOpen(false);
    setEditingExpense(null);
  }

  function handleConfirmDelete() {
    if (!deletingExpense) return;
    deleteExpense(deletingExpense.id);
    showToast("Expense deleted", "info");
    setDeletingExpense(null);
  }

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Overview</h1>
            <p className="text-sm text-slate-500">Track spending and spot trends at a glance.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export data
            </button>
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add expense
            </button>
          </div>
        </div>

        <SummaryCards summary={summary} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Spending by category</h2>
            <CategoryChart data={summary.byCategory} />
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Monthly trend</h2>
            <TrendChart data={summary.byMonth} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">All expenses</h2>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={filteredExpenses.length}
          />
          <ExpenseList
            expenses={filteredExpenses}
            totalCount={expenses.length}
            onEdit={handleEditClick}
            onDelete={setDeletingExpense}
            onAddExpense={handleAddClick}
          />
        </div>
      </main>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialValue={editingExpense}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        title="Delete expense"
        description={
          deletingExpense
            ? `Are you sure you want to delete "${deletingExpense.description}"? This can't be undone.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingExpense(null)}
      />

      <ExportPanel isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} expenses={expenses} />
    </div>
  );
}

"use client";

import { Expense } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

interface ExpenseListProps {
  expenses: Expense[];
  totalCount: number;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onAddExpense: () => void;
}

export function ExpenseList({ expenses, totalCount, onEdit, onDelete, onAddExpense }: ExpenseListProps) {
  if (totalCount === 0) {
    return (
      <EmptyState
        title="No expenses yet"
        description="Start tracking your spending by adding your first expense."
        actionLabel="Add expense"
        onAction={onAddExpense}
      />
    );
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        title="No matching expenses"
        description="Try adjusting your filters or search terms to find what you're looking for."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="hidden grid-cols-[100px_1fr_140px_120px_88px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="group grid grid-cols-2 items-center gap-2 px-5 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[100px_1fr_140px_120px_88px] sm:gap-4"
          >
            <span className="text-sm text-slate-500">{formatDate(expense.date)}</span>
            <span className="col-span-2 truncate text-sm font-medium text-slate-900 sm:col-span-1">
              {expense.description}
            </span>
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${CATEGORY_COLORS[expense.category]}1a`,
                color: CATEGORY_COLORS[expense.category],
              }}
            >
              <span aria-hidden>{CATEGORY_ICONS[expense.category]}</span>
              {expense.category}
            </span>
            <span className="text-right text-sm font-semibold text-slate-900 sm:text-right">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex justify-end gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(expense)}
                aria-label={`Edit ${expense.description}`}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" strokeLinecap="round" />
                  <path
                    d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDelete(expense)}
                aria-label={`Delete ${expense.description}`}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

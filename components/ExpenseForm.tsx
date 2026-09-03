"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { CATEGORIES, Category, ExpenseInput } from "@/lib/types";
import { todayISO } from "@/lib/utils";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => void;
  initialValue?: ExpenseInput | null;
}

interface FormState {
  date: string;
  amount: string;
  category: Category;
  description: string;
}

interface FormErrors {
  date?: string;
  amount?: string;
  description?: string;
}

const EMPTY_STATE: FormState = {
  date: todayISO(),
  amount: "",
  category: "Food",
  description: "",
};

export function ExpenseForm({ isOpen, onClose, onSubmit, initialValue }: ExpenseFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditing = Boolean(initialValue);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialValue
          ? {
              date: initialValue.date,
              amount: String(initialValue.amount),
              category: initialValue.category,
              description: initialValue.description,
            }
          : EMPTY_STATE
      );
      setErrors({});
    }
  }, [isOpen, initialValue]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.date) {
      next.date = "Date is required";
    } else if (form.date > todayISO()) {
      next.date = "Date can't be in the future";
    }

    const amountValue = Number(form.amount);
    if (!form.amount) {
      next.amount = "Amount is required";
    } else if (Number.isNaN(amountValue) || amountValue <= 0) {
      next.amount = "Enter an amount greater than 0";
    } else if (amountValue > 1_000_000) {
      next.amount = "Amount is too large";
    }

    if (!form.description.trim()) {
      next.description = "Description is required";
    } else if (form.description.trim().length > 120) {
      next.description = "Keep it under 120 characters";
    }

    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      date: form.date,
      amount: Math.round(Number(form.amount) * 100) / 100,
      category: form.category,
      description: form.description.trim(),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit expense" : "Add expense"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "date-error" : undefined}
            />
            {errors.date && (
              <p id="date-error" className="mt-1 text-xs text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                $
              </span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-7 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? "amount-error" : undefined}
              />
            </div>
            {errors.amount && (
              <p id="amount-error" className="mt-1 text-xs text-red-600">
                {errors.amount}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            id="description"
            type="text"
            placeholder="e.g. Lunch with the team"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-xs text-red-600">
              {errors.description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
          >
            {isEditing ? "Save changes" : "Add expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

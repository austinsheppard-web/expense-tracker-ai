"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadExpenses, saveExpenses } from "@/lib/storage";
import { seedExpenses } from "@/lib/seed";
import { DEFAULT_FILTERS, Expense, ExpenseFilters, ExpenseInput } from "@/lib/types";
import { generateId } from "@/lib/utils";

const SEEDED_KEY = "expense-tracker:seeded";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadExpenses();
    const hasSeeded = typeof window !== "undefined" && window.localStorage.getItem(SEEDED_KEY);

    if (stored.length === 0 && !hasSeeded) {
      const seeded = seedExpenses();
      setExpenses(seeded);
      saveExpenses(seeded);
      window.localStorage.setItem(SEEDED_KEY, "true");
    } else {
      setExpenses(stored);
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: Expense[]) => {
    setExpenses(next);
    saveExpenses(next);
  }, []);

  const addExpense = useCallback(
    (input: ExpenseInput) => {
      const newExpense: Expense = {
        ...input,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => {
        const next = [newExpense, ...prev];
        saveExpenses(next);
        return next;
      });
      return newExpense;
    },
    []
  );

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) => {
      setExpenses((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...input } : e));
        saveExpenses(next);
        return next;
      });
    },
    []
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveExpenses(next);
        return next;
      });
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filters.category !== "All" && e.category !== filters.category) return false;
        if (filters.startDate && e.date < filters.startDate) return false;
        if (filters.endDate && e.date > filters.endDate) return false;
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const haystack = `${e.description} ${e.category}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)));
  }, [expenses, filters]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "All" ||
    filters.startDate !== null ||
    filters.endDate !== null;

  return {
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
    replaceAll: persist,
  };
}

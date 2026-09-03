export const CATEGORIES = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  date: string; // ISO date string, e.g. "2026-03-05"
  amount: number;
  category: Category;
  description: string;
  createdAt: string; // ISO timestamp
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export interface ExpenseFilters {
  search: string;
  category: Category | "All";
  startDate: string | null;
  endDate: string | null;
}

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  startDate: null,
  endDate: null,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#f59e0b",
  Transportation: "#3b82f6",
  Entertainment: "#a855f7",
  Shopping: "#ec4899",
  Bills: "#ef4444",
  Other: "#64748b",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍔",
  Transportation: "🚗",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Bills: "📄",
  Other: "📦",
};

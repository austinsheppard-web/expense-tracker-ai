import { Expense } from "./types";

/**
 * The Expense type has no dedicated `vendor` field, so this treats the
 * free-text `description` field as the vendor identifier (trimmed;
 * blank descriptions are grouped under "Uncategorized"). A future
 * iteration may want a real normalized `vendor` field on Expense.
 */
export interface VendorTotal {
  vendor: string;
  total: number;
  count: number;
  percentage: number;
}

export function computeVendorTotals(expenses: Expense[]): VendorTotal[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const vendorMap = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const vendor = e.description.trim() || "Uncategorized";
    const entry = vendorMap.get(vendor) ?? { total: 0, count: 0 };
    entry.total += e.amount;
    entry.count += 1;
    vendorMap.set(vendor, entry);
  }

  return Array.from(vendorMap.entries())
    .map(([vendor, { total: vendorTotal, count }]) => ({
      vendor,
      total: vendorTotal,
      count,
      percentage: total > 0 ? (vendorTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

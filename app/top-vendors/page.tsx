"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { loadExpenses } from "@/lib/storage";
import { computeVendorTotals } from "@/lib/vendors";
import { Expense } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function TopVendorsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoading(false);
  }, []);

  const vendors = useMemo(() => computeVendorTotals(expenses), [expenses]);

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
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Top Vendors</h1>
          <p className="text-sm text-slate-500">
            Vendors ranked by total spend, based on each expense&apos;s description.
          </p>
        </div>

        {vendors.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Add some expenses to see which vendors you spend the most with."
          />
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="w-10 pb-3">#</th>
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3 text-right">Total spent</th>
                    <th className="pb-3 text-right">Transactions</th>
                    <th className="pb-3 text-right">% of spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vendor, index) => (
                    <tr key={vendor.vendor}>
                      <td className="py-3 align-top text-slate-400">{index + 1}</td>
                      <td className="py-3 align-top">
                        <div className="font-medium text-slate-900">{vendor.vendor}</div>
                        <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-brand-600"
                            style={{ width: `${Math.min(100, vendor.percentage)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 align-top text-right font-medium text-slate-900">
                        {formatCurrency(vendor.total)}
                      </td>
                      <td className="py-3 align-top text-right text-slate-500">{vendor.count}</td>
                      <td className="py-3 align-top text-right text-slate-500">
                        {formatPercent(vendor.percentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

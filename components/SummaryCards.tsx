import { Summary } from "@/lib/analytics";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total spending",
      value: formatCurrency(summary.total),
      hint: `${summary.count} expense${summary.count === 1 ? "" : "s"}`,
      accent: "text-slate-900",
    },
    {
      label: "This month",
      value: formatCurrency(summary.monthTotal),
      hint: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()),
      accent: "text-brand-600",
    },
    {
      label: "Average per expense",
      value: formatCurrency(summary.averagePerExpense),
      hint: "Across all recorded expenses",
      accent: "text-slate-900",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl bg-white p-5 shadow-card">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight ${card.accent}`}>{card.value}</p>
          <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
        </div>
      ))}

      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm font-medium text-slate-500">Top category</p>
        {summary.topCategory ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: `${CATEGORY_COLORS[summary.topCategory.category]}1a` }}
              >
                {CATEGORY_ICONS[summary.topCategory.category]}
              </span>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                {summary.topCategory.category}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {formatCurrency(summary.topCategory.total)} · {summary.topCategory.percentage.toFixed(0)}% of total
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No expenses yet</p>
        )}
      </div>
    </div>
  );
}

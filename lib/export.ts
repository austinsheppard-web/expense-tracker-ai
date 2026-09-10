import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Category, Expense } from "./types";
import { formatCurrency, formatDate } from "./utils";

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportFilterCriteria {
  startDate: string | null;
  endDate: string | null;
  categories: Category[];
}

export interface ExportOptions extends ExportFilterCriteria {
  format: ExportFormat;
  filename: string;
}

export const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: "csv", label: "CSV", description: "Spreadsheet-friendly — opens in Excel or Sheets" },
  { value: "json", label: "JSON", description: "Structured data for developers and APIs" },
  { value: "pdf", label: "PDF", description: "Formatted report, ready to print or share" },
];

export function filterExpensesForExport(expenses: Expense[], criteria: ExportFilterCriteria): Expense[] {
  const categorySet = new Set(criteria.categories);
  return expenses
    .filter((e) => {
      if (!categorySet.has(e.category)) return false;
      if (criteria.startDate && e.date < criteria.startDate) return false;
      if (criteria.endDate && e.date > criteria.endDate) return false;
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildCSV(expenses: Expense[]): string {
  const header = ["Date", "Category", "Amount", "Description"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

function buildJSON(expenses: Expense[]): string {
  return JSON.stringify(
    expenses.map((e) => ({
      date: e.date,
      category: e.category,
      amount: e.amount,
      description: e.description,
    })),
    null,
    2
  );
}

function buildPDF(expenses: Expense[]): Blob {
  const doc = new jsPDF();
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  doc.setFontSize(16);
  doc.text("Expense Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 24);
  doc.text(
    `${expenses.length} record${expenses.length === 1 ? "" : "s"}  ·  Total ${formatCurrency(total)}`,
    14,
    29
  );

  autoTable(doc, {
    startY: 34,
    head: [["Date", "Category", "Amount", "Description"]],
    body: expenses.map((e) => [formatDate(e.date), e.category, formatCurrency(e.amount), e.description]),
    headStyles: { fillColor: [63, 79, 227] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 2: { halign: "right" } },
  });

  return doc.output("blob");
}

function withExtension(filename: string, format: ExportFormat): string {
  const trimmed = filename.trim() || "expenses";
  const suffix = `.${format}`;
  return trimmed.toLowerCase().endsWith(suffix) ? trimmed : `${trimmed}${suffix}`;
}

/**
 * Filters, builds, and downloads the export file. Yields a frame first so a
 * caller-driven loading indicator actually paints before PDF generation
 * (the heaviest of the three formats) blocks the main thread.
 */
export async function runExport(expenses: Expense[], options: ExportOptions): Promise<Expense[]> {
  const filtered = filterExpensesForExport(expenses, options);
  const filename = withExtension(options.filename, options.format);

  await new Promise((resolve) => requestAnimationFrame(resolve));

  if (filtered.length === 0) {
    return filtered;
  }

  switch (options.format) {
    case "csv":
      triggerDownload(new Blob([buildCSV(filtered)], { type: "text/csv;charset=utf-8;" }), filename);
      break;
    case "json":
      triggerDownload(new Blob([buildJSON(filtered)], { type: "application/json;charset=utf-8;" }), filename);
      break;
    case "pdf":
      triggerDownload(buildPDF(filtered), filename);
      break;
  }

  return filtered;
}

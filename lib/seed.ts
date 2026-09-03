import { Expense } from "./types";
import { generateId, todayISO } from "./utils";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function seedExpenses(): Expense[] {
  const now = new Date().toISOString();
  return [
    { id: generateId(), date: daysAgo(1), amount: 42.5, category: "Food", description: "Groceries at Trader Joe's", createdAt: now },
    { id: generateId(), date: daysAgo(2), amount: 12.0, category: "Transportation", description: "Uber to downtown", createdAt: now },
    { id: generateId(), date: daysAgo(3), amount: 89.99, category: "Shopping", description: "New running shoes", createdAt: now },
    { id: generateId(), date: daysAgo(5), amount: 15.5, category: "Entertainment", description: "Movie tickets", createdAt: now },
    { id: generateId(), date: daysAgo(7), amount: 120.0, category: "Bills", description: "Internet bill", createdAt: now },
    { id: generateId(), date: daysAgo(9), amount: 8.75, category: "Food", description: "Coffee and bagel", createdAt: now },
    { id: generateId(), date: daysAgo(14), amount: 55.0, category: "Transportation", description: "Gas fill-up", createdAt: now },
    { id: generateId(), date: daysAgo(20), amount: 200.0, category: "Bills", description: "Electric bill", createdAt: now },
    { id: generateId(), date: todayISO(), amount: 6.25, category: "Other", description: "Parking meter", createdAt: now },
  ];
}

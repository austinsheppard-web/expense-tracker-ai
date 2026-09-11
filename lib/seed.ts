import { Category, Expense } from "./types";
import { daysInMonth, generateId, todayISO } from "./utils";

/** Deterministic PRNG (mulberry32) so demo data is reproducible across installs. */
function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toLocalISO(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

interface RecurringBill {
  day: number;
  category: Category;
  description: string;
  base: number;
  variance: number;
}

const RECURRING_BILLS: RecurringBill[] = [
  { day: 1, category: "Bills", description: "Rent", base: 1450, variance: 0 },
  { day: 4, category: "Bills", description: "Internet bill", base: 65, variance: 3 },
  { day: 12, category: "Bills", description: "Electric bill", base: 95, variance: 35 },
  { day: 18, category: "Bills", description: "Phone plan", base: 55, variance: 2 },
];

const VARIABLE_TEMPLATES: { category: Category; description: string; min: number; max: number }[] = [
  { category: "Food", description: "Groceries", min: 35, max: 140 },
  { category: "Food", description: "Coffee run", min: 4, max: 9 },
  { category: "Food", description: "Dinner out", min: 22, max: 85 },
  { category: "Transportation", description: "Gas fill-up", min: 30, max: 60 },
  { category: "Transportation", description: "Rideshare", min: 9, max: 28 },
  { category: "Entertainment", description: "Streaming subscription", min: 8, max: 18 },
  { category: "Entertainment", description: "Movie night", min: 15, max: 45 },
  { category: "Shopping", description: "Household supplies", min: 18, max: 65 },
  { category: "Shopping", description: "Clothing", min: 25, max: 120 },
  { category: "Other", description: "Miscellaneous", min: 5, max: 40 },
];

/**
 * Generates ~12 months of demo history with recurring bills plus randomized
 * day-to-day spending, so trend, forecast, and seasonal features have enough
 * signal to be meaningful on a fresh install.
 */
export function seedExpenses(): Expense[] {
  const rng = createRng(20260101);
  const now = new Date();
  const createdAt = now.toISOString();
  const expenses: Expense[] = [];
  const MONTHS_BACK = 11;

  for (let offset = MONTHS_BACK; offset >= 0; offset--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = monthDate.getFullYear();
    const monthIndex0 = monthDate.getMonth();
    const isCurrentMonth = offset === 0;
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth(year, monthIndex0);

    // Mild seasonal lift: higher shopping/entertainment in Nov-Dec, higher bills in summer/winter.
    const holidaySeason = monthIndex0 === 10 || monthIndex0 === 11;

    for (const bill of RECURRING_BILLS) {
      if (bill.day > lastDay) continue;
      const amount = bill.base + (rng() - 0.5) * 2 * bill.variance;
      expenses.push({
        id: generateId(),
        date: toLocalISO(new Date(year, monthIndex0, bill.day)),
        amount: Math.round(amount * 100) / 100,
        category: bill.category,
        description: bill.description,
        createdAt,
      });
    }

    const entriesThisMonth = 14 + Math.floor(rng() * 8);
    for (let i = 0; i < entriesThisMonth; i++) {
      const day = 1 + Math.floor(rng() * lastDay);
      const template = VARIABLE_TEMPLATES[Math.floor(rng() * VARIABLE_TEMPLATES.length)];
      let amount = template.min + rng() * (template.max - template.min);
      if (holidaySeason && (template.category === "Shopping" || template.category === "Entertainment")) {
        amount *= 1.4;
      }
      expenses.push({
        id: generateId(),
        date: toLocalISO(new Date(year, monthIndex0, day)),
        amount: Math.round(amount * 100) / 100,
        category: template.category,
        description: template.description,
        createdAt,
      });
    }

    // Occasional larger one-off purchase.
    if (rng() < 0.4) {
      const day = 1 + Math.floor(rng() * lastDay);
      expenses.push({
        id: generateId(),
        date: toLocalISO(new Date(year, monthIndex0, day)),
        amount: Math.round((150 + rng() * 400) * 100) / 100,
        category: "Shopping",
        description: "Big purchase",
        createdAt,
      });
    }
  }

  expenses.push({
    id: generateId(),
    date: todayISO(),
    amount: 6.25,
    category: "Other",
    description: "Parking meter",
    createdAt,
  });

  return expenses.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

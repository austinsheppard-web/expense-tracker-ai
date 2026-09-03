# Expense Tracker

A modern personal expense tracking app built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Data is stored in your browser's `localStorage` — no backend or database required.

## Features

- Add, edit, and delete expenses (date, amount, category, description)
- Categories: Food, Transportation, Entertainment, Shopping, Bills, Other
- Search and filter by category and date range
- Dashboard summary cards: total spending, this month's spending, average per expense, top category
- Spending-by-category donut chart and monthly trend bar chart (Recharts)
- CSV export of the currently filtered expenses
- Form validation, toast notifications, confirm-before-delete
- Responsive design for desktop and mobile

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load the app seeds a handful of sample expenses so the dashboard isn't empty — feel free to delete them.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```

## Testing the features

1. **Add an expense** — click "Add expense", fill in date/amount/category/description, submit. Try submitting with an empty description or a negative/zero amount to see validation errors.
2. **Edit an expense** — hover a row (or just look, on mobile) and click the pencil icon; change a field and save.
3. **Delete an expense** — click the trash icon, confirm in the dialog.
4. **Filter** — use the search box, category dropdown, and From/To date pickers above the list; "Clear filters" appears once any filter is active.
5. **Dashboard** — watch the summary cards, donut chart, and monthly trend bar chart update live as you add/edit/delete expenses.
6. **Export CSV** — click "Export CSV" to download the currently filtered set of expenses as `expenses.csv`.
7. **Persistence** — refresh the page; your data is reloaded from `localStorage`. Clearing the site's storage (or a different browser) starts fresh with the seed data.
8. **Mobile** — resize your browser or open dev tools' device toolbar; the layout reflows to a single column and row actions become tap-friendly.

## Project structure

```
app/                  Next.js App Router page, layout, global styles
components/           UI components (form, list, charts, modals, toasts)
hooks/useExpenses.ts  Central state: CRUD + filtering
lib/types.ts          Shared types and category metadata
lib/storage.ts        localStorage persistence
lib/analytics.ts      Summary/aggregation calculations
lib/utils.ts          Formatting, CSV export, id generation
lib/seed.ts           Sample data for first run
```

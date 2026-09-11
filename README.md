# Expense Tracker

A modern personal expense tracking app built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Data is stored in your browser's `localStorage` — no backend or database required.

## Features

- Add, edit, and delete expenses (date, amount, category, description)
- Categories: Food, Transportation, Entertainment, Shopping, Bills, Other
- Search and filter by category and date range
- Dashboard summary cards: total spending, this month's spending, average per expense, top category
- Spending-by-category donut chart and monthly trend bar chart (Recharts)
- Analytics dashboard (`/analytics`): historical trends, a 3-month spend forecast, category trends over time, a daily spending heatmap, day-of-week patterns, period-over-period KPIs, and auto-generated insights
- CSV/JSON/PDF export with date-range and category filtering
- Form validation, toast notifications, confirm-before-delete
- Responsive design for desktop and mobile

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load the app seeds about 12 months of sample expenses so the dashboard and analytics page aren't empty — feel free to delete them.

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
6. **Export data** — click "Export data", choose CSV/JSON/PDF, optionally narrow by date range and category, and download.
7. **Analytics** — click "Analytics" in the header nav; try the time-range presets, toggle categories, hover the daily spending heatmap, and watch the KPIs and insights update.
8. **Persistence** — refresh the page; your data is reloaded from `localStorage`. Clearing the site's storage (or a different browser) starts fresh with the seed data.
9. **Mobile** — resize your browser or open dev tools' device toolbar; the layout reflows to a single column and row actions become tap-friendly.

## Project structure

```
app/                   Next.js App Router pages (/ and /analytics), layout, global styles
components/            UI components (form, list, charts, modals, toasts)
components/analytics/  Analytics dashboard components (trend/forecast, heatmap, KPIs, insights)
hooks/useExpenses.ts   Central state: CRUD + filtering
lib/types.ts           Shared types and category metadata
lib/storage.ts         localStorage persistence
lib/analytics.ts       Summary/aggregation calculations for the Overview page
lib/insights.ts        Historical/comparison analytics for the Analytics page
lib/forecast.ts        Monthly spend forecast and current-month run-rate projection
lib/dateRange.ts       Time-range presets and date filtering for the Analytics page
lib/export.ts          CSV/JSON/PDF export
lib/utils.ts           Formatting, date helpers, id generation
lib/seed.ts            Sample data for first run (~12 months)
```

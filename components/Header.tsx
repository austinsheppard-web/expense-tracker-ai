export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <path d="M3 10h18M7 15h2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900">Expense Tracker</p>
            <p className="text-xs leading-tight text-slate-400">Personal finance dashboard</p>
          </div>
        </div>
      </div>
    </header>
  );
}

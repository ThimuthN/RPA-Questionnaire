export default function DepartmentLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-[color:var(--app-surface-muted)]" />
          <div className="h-7 w-48 rounded-full bg-[color:var(--app-surface-muted)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 rounded-full bg-[color:var(--app-surface-muted)]" />
          <div className="h-9 w-28 rounded-full bg-[color:var(--app-brand)]/20" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 space-y-3">
            <div className="h-2.5 w-20 rounded-full bg-[color:var(--app-surface-muted)]" />
            <div className="h-8 w-12 rounded-full bg-[color:var(--app-surface-muted)]" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 space-y-4">
          <div className="h-5 w-32 rounded-full bg-[color:var(--app-surface-muted)]" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-20 rounded-full bg-[color:var(--app-surface-muted)]" />
              <div className="flex-1 h-6 rounded-full bg-[color:var(--app-surface-muted)]" style={{ width: `${60 + i * 10}%` }} />
              <div className="h-3 w-6 rounded-full bg-[color:var(--app-surface-muted)]" />
            </div>
          ))}
        </div>
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 space-y-4">
          <div className="h-5 w-28 rounded-full bg-[color:var(--app-surface-muted)]" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--app-surface-muted)]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-full rounded-full bg-[color:var(--app-surface-muted)]" />
                <div className="h-2.5 w-24 rounded-full bg-[color:var(--app-surface-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

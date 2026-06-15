export default function DepartmentCandidatesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-48 rounded-full bg-[color:var(--app-surface-muted)]" />
        <div className="h-9 w-32 rounded-full bg-[color:var(--app-surface-muted)]" />
        <div className="h-9 w-32 rounded-full bg-[color:var(--app-surface-muted)]" />
        <div className="ml-auto h-9 w-24 rounded-full bg-[color:var(--app-surface-muted)]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[color:var(--app-border)] px-5 py-3">
          {[32, 20, 16, 12, 12].map((w, i) => (
            <div key={i} className={`h-3 rounded-full bg-[color:var(--app-surface-muted)]`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[color:var(--app-border)] px-5 py-4 last:border-0">
            <div className="flex items-center gap-3" style={{ width: "32%" }}>
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[color:var(--app-surface-muted)]" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded-full bg-[color:var(--app-surface-muted)]" />
                <div className="h-2.5 w-20 rounded-full bg-[color:var(--app-surface-muted)]" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-[color:var(--app-surface-muted)]" style={{ width: "20%" }} />
            <div className="h-3 w-20 rounded-full bg-[color:var(--app-surface-muted)]" style={{ width: "16%" }} />
            <div className="h-3 w-12 rounded-full bg-[color:var(--app-surface-muted)]" style={{ width: "12%" }} />
            <div className="h-3 w-12 rounded-full bg-[color:var(--app-surface-muted)]" style={{ width: "12%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CandidateProfileLoading() {
  return (
    <div className="flex h-full gap-6 animate-pulse">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <div className="h-24 w-24 rounded-full bg-[color:var(--app-surface-soft)] mx-auto" />
        <div className="h-5 w-40 rounded-full bg-[color:var(--app-surface-soft)] mx-auto" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 rounded-full bg-[color:var(--app-surface-soft)]" />
          ))}
        </div>
      </aside>
      {/* Main */}
      <div className="flex-1 space-y-4">
        <div className="h-10 w-full rounded-[14px] bg-[color:var(--app-surface-soft)]" />
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded-full bg-[color:var(--app-surface-soft)]" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

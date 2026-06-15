export default function CandidatesLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 w-64 rounded-[14px] bg-[color:var(--app-surface-soft)]" />
      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-[color:var(--app-border)] last:border-0">
            <div className="h-8 w-8 rounded-full bg-[color:var(--app-surface-soft)] shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 rounded-full bg-[color:var(--app-surface-soft)]" />
              <div className="h-3 w-24 rounded-full bg-[color:var(--app-surface-soft)]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[color:var(--app-surface-soft)]" />
            <div className="h-6 w-16 rounded-full bg-[color:var(--app-surface-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

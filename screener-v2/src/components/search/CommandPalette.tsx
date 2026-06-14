"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Search, Users, Briefcase, FileText } from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";

type QuickAction = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add candidate", href: "/people/candidates/new", icon: <Users size={14} /> },
  { label: "Create job", href: "/people/candidates/jobs/new", icon: <Briefcase size={14} /> },
  { label: "Analytics", href: "/people/analytics", icon: <FileText size={14} /> },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function stagePill(stage: string) {
  const labels: Record<string, string> = {
    applicant: "Applicant",
    pipeline: "Pipeline",
    screening: "Screening",
    interview: "Interview",
    advanced_review: "Review",
    finalized: "Finalized",
  };
  return labels[stage] ?? stage;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 180);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setResults(null);
      setCursor(0);
    }
  }, [open]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: SearchResult) => {
        setResults(data);
        setCursor(0);
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  type FlatItem =
    | { type: "candidate"; id: string; label: string; sub: string; href: string }
    | { type: "job"; id: string; label: string; sub: string; href: string }
    | { type: "applicant"; id: string; label: string; sub: string; href: string }
    | { type: "action"; label: string; href: string; icon: React.ReactNode };

  const flat: FlatItem[] = [];
  if (results) {
    results.candidates.forEach((c) =>
      flat.push({ type: "candidate", id: c.id, label: c.fullName, sub: stagePill(c.stage), href: `/people/candidates/${c.id}` })
    );
    results.jobs.forEach((j) =>
      flat.push({ type: "job", id: j.id, label: j.title, sub: j.department ?? (j.isOpen ? "Open" : "Closed"), href: `/people/candidates/jobs/${j.id}` })
    );
    results.applicants.forEach((a) =>
      flat.push({ type: "applicant", id: a.id, label: a.candidateName, sub: `Applied — ${a.jobTitle}`, href: `/people/candidates/applicants/${a.id}` })
    );
  } else {
    QUICK_ACTIONS.forEach((a) =>
      flat.push({ type: "action", label: a.label, href: a.href, icon: a.icon })
    );
  }

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href as Route);
  }, [router]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[cursor];
      if (item) navigate(item.href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.4)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[color:var(--app-border)]">
          <Search size={16} className="flex-shrink-0 text-[color:var(--app-muted)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search candidates, jobs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus:outline-none"
          />
          {loading ? (
            <span className="text-xs text-[color:var(--app-muted)]">Searching…</span>
          ) : (
            <kbd className="rounded-md border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-1.5 py-0.5 text-[10px] text-[color:var(--app-muted)]">
              Esc
            </kbd>
          )}
        </div>

        {/* Results */}
        {flat.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto py-2">
            {!results && (
              <p className="px-4 py-1 text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">
                Quick actions
              </p>
            )}
            {results && results.candidates.length > 0 && (
              <GroupHeader label="Candidates" />
            )}
            {results && results.jobs.length > 0 && flat.findIndex((f) => f.type === "job") === flat.indexOf(flat.find((f) => f.type === "job")!) && (
              <GroupHeader label="Jobs" />
            )}

            {flat.map((item, i) => {
              const isActive = cursor === i;
              if (item.type === "action") {
                return (
                  <button
                    key={`action-${item.label}`}
                    type="button"
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive ? "bg-[color:var(--app-surface-soft)]" : ""
                    }`}
                  >
                    <span className="text-[color:var(--app-muted)]">{item.icon}</span>
                    <span className="text-[color:var(--app-text)]">{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setCursor(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive ? "bg-[color:var(--app-surface-soft)]" : ""
                  }`}
                >
                  <span className="truncate font-medium text-[color:var(--app-heading)]">{item.label}</span>
                  <span className="flex-shrink-0 text-xs text-[color:var(--app-muted)]">{item.sub}</span>
                </button>
              );
            })}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="px-4 py-6 text-center text-sm text-[color:var(--app-muted)]">
            No results for &ldquo;{query}&rdquo;
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[color:var(--app-border)] px-4 py-2">
          <KbdHint keys={["↑", "↓"]} label="navigate" />
          <KbdHint keys={["↵"]} label="open" />
          <KbdHint keys={["Esc"]} label="close" />
        </div>
      </div>
    </div>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pb-1 pt-2 text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">
      {label}
    </p>
  );
}

function KbdHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="rounded border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-1 py-0.5 text-[10px] text-[color:var(--app-muted)]"
        >
          {k}
        </kbd>
      ))}
      <span className="text-[10px] text-[color:var(--app-muted)]">{label}</span>
    </div>
  );
}

// Trigger button to show in nav
export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
        document.dispatchEvent(e);
      }}
      className="flex items-center gap-2 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-1.5 text-xs text-[color:var(--app-muted)] transition hover:border-[color:var(--app-border-strong)] hover:text-[color:var(--app-text)]"
    >
      <Search size={12} />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-1 py-0.5 text-[10px] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

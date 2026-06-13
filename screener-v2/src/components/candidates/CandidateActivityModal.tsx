"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FileUp,
  Flag,
  Inbox,
  Layers,
  Link,
  PartyPopper,
  RotateCcw,
  StickyNote,
  ToggleRight,
  Trash2,
  Trophy,
  Unlink,
  User,
  UserCog,
  XCircle,
  X,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/primitives/Button";
import type { CandidateActivityItem } from "@/lib/candidates/workspace";
import { formatActivity, type ActivityColorKey } from "@/lib/candidates/activity-format";

const ICONS: Record<string, LucideIcon> = {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FileUp,
  Flag,
  Inbox,
  Layers,
  Link,
  PartyPopper,
  RotateCcw,
  StickyNote,
  ToggleRight,
  Trash2,
  Trophy,
  Unlink,
  User,
  UserCog,
  XCircle
};

const COLOR: Record<ActivityColorKey, { bg: string; text: string; line: string }> = {
  blue:   { bg: "bg-blue-500/15",     text: "text-blue-500",     line: "bg-blue-500/30" },
  green:  { bg: "bg-emerald-500/15",  text: "text-emerald-500",  line: "bg-emerald-500/30" },
  red:    { bg: "bg-red-500/15",      text: "text-red-500",      line: "bg-red-500/30" },
  amber:  { bg: "bg-amber-500/15",    text: "text-amber-500",    line: "bg-amber-500/30" },
  purple: { bg: "bg-violet-500/15",   text: "text-violet-500",   line: "bg-violet-500/30" },
  gray:   { bg: "bg-[color:var(--app-surface-soft)]", text: "text-[color:var(--app-muted)]", line: "bg-[color:var(--app-border)]" },
  teal:   { bg: "bg-teal-500/15",     text: "text-teal-500",     line: "bg-teal-500/30" },
  pink:   { bg: "bg-pink-500/15",     text: "text-pink-500",     line: "bg-pink-500/30" }
};

function formatTime(at: string): string {
  return new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDayLabel(at: string): string {
  const d = new Date(at);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function groupByDay(items: CandidateActivityItem[]) {
  const groups: Array<{ dayLabel: string; date: string; items: CandidateActivityItem[] }> = [];
  const seen = new Map<string, number>();
  for (const item of items) {
    const key = new Date(item.at).toDateString();
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({ dayLabel: formatDayLabel(item.at), date: key, items: [] });
    }
    groups[seen.get(key)!].items.push(item);
  }
  return groups;
}

function ActorAvatar({ name, isSystem }: { name?: string | null; isSystem?: boolean }) {
  if (isSystem || !name) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[9px] text-[color:var(--app-muted)]">
        ⚙
      </div>
    );
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-[9px] font-semibold text-white">
      {initials}
    </div>
  );
}

function ChangePill({ label, variant }: { label: string; variant: "before" | "after" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        variant === "before"
          ? "bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)] line-through decoration-[color:var(--app-muted)]/40"
          : "bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
      )}
    >
      {label}
    </span>
  );
}

function EventRow({
  item,
  isLast
}: {
  item: CandidateActivityItem;
  isLast: boolean;
}) {
  const fmt = formatActivity(item);
  const colors = COLOR[fmt.colorKey];
  const Icon = ICONS[fmt.iconName] ?? Activity;
  const isNote = item.kind === "note";

  return (
    <div className="flex gap-3">
      {/* Timeline column */}
      <div className="flex flex-col items-center pt-0.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", colors.bg)}>
          <Icon className={cn("h-3.5 w-3.5", colors.text)} />
        </div>
        {!isLast && (
          <div className={cn("mt-1 w-px flex-1 min-h-[20px]", colors.line)} />
        )}
      </div>

      {/* Content column */}
      <div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-0")}>
        {/* Actor + time row */}
        <div className="flex items-center gap-2 mb-0.5">
          <ActorAvatar name={item.actorName} isSystem={item.isSystemEvent} />
          <span className="text-[11px] font-medium text-[color:var(--app-muted)]">
            {item.isSystemEvent || !item.actorName ? "System" : item.actorName}
          </span>
          <span className="text-[11px] text-[color:var(--app-muted)]/60">·</span>
          <span className="text-[11px] text-[color:var(--app-muted)]/60">{formatTime(item.at)}</span>
        </div>

        {/* Headline */}
        <p className="text-sm font-medium text-[color:var(--app-heading)] leading-snug">
          {fmt.headline}
        </p>

        {/* Before → after chips */}
        {fmt.before && fmt.after && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ChangePill label={fmt.before} variant="before" />
            <ArrowRight className="h-3 w-3 text-[color:var(--app-muted)]/40 shrink-0" />
            <ChangePill label={fmt.after} variant="after" />
          </div>
        )}

        {/* Body — note kind gets a quote block, others get muted text */}
        {fmt.body && (
          isNote ? (
            <blockquote className="mt-2 border-l-2 border-[color:var(--app-brand)]/30 pl-3 text-[13px] leading-relaxed text-[color:var(--app-muted)] italic">
              {fmt.body}
            </blockquote>
          ) : (
            <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--app-muted)]">
              {fmt.body}
            </p>
          )
        )}
      </div>
    </div>
  );
}

function ActivityTimeline({ items }: { items: CandidateActivityItem[] }) {
  const groups = groupByDay(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <Activity className="h-8 w-8 text-[color:var(--app-muted)]/30" />
        <p className="text-sm text-[color:var(--app-muted)]">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          {/* Day separator */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--app-border)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]/70">
              {group.dayLabel}
            </span>
            <div className="h-px flex-1 bg-[color:var(--app-border)]" />
          </div>

          {/* Events for this day */}
          <div>
            {group.items.map((item, idx) => (
              <EventRow
                key={item.id}
                item={item}
                isLast={idx === group.items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CandidateActivityModal({ items }: { items: CandidateActivityItem[] }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handler);
    };
  }, [open]);

  // Preview — last 3 events
  const previewItems = items.slice(0, 3);

  return (
    <>
      {/* Inline preview card */}
      <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-[color:var(--app-heading)]">Activity log</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              {items.length === 0
                ? "No activity yet."
                : `${items.length} event${items.length === 1 ? "" : "s"} recorded.`}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={items.length === 0}>
            View all
          </Button>
        </div>

        {previewItems.length > 0 && (
          <div className="space-y-2 pt-1">
            {previewItems.map((item) => {
              const fmt = formatActivity(item);
              const colors = COLOR[fmt.colorKey];
              const Icon = ICONS[fmt.iconName] ?? Activity;
              return (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", colors.bg)}>
                    <Icon className={cn("h-2.5 w-2.5", colors.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-snug text-[color:var(--app-heading)]">
                      {fmt.headline}
                    </p>
                    <p className="text-[11px] text-[color:var(--app-muted)]">
                      {item.isSystemEvent || !item.actorName ? "System" : item.actorName}
                      {" · "}
                      {new Date(item.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full modal */}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
                  style={{ background: "radial-gradient(circle at top, color-mix(in srgb, var(--app-brand) 14%, transparent), transparent 24%), var(--app-modal-overlay)" }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(10px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal header */}
                    <div
                      className="flex items-center justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4"
                      style={{ background: "var(--app-modal-header)" }}
                    >
                      <div>
                        <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
                          Activity log
                        </h3>
                        <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                          Complete audit trail — all user and system actions for this candidate.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden rounded-full bg-[color:var(--app-surface-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--app-muted)] sm:inline">
                          {items.length} event{items.length === 1 ? "" : "s"}
                        </span>
                        <button
                          type="button"
                          aria-label="Close"
                          onClick={() => setOpen(false)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable timeline */}
                    <div
                      className="flex-1 overflow-y-auto px-5 py-5"
                      style={{ background: "var(--app-modal-body)" }}
                    >
                      <ActivityTimeline items={items} />
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}

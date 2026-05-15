"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import type { CandidateActivityItem } from "@/lib/candidates/workspace";

function ActivityActor({ name, isSystem }: { name?: string | null; isSystem?: boolean }) {
  if (isSystem) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--app-surface)] text-xs font-medium text-[color:var(--app-muted)]">
          ⚙
        </div>
        <span className="text-xs font-medium text-[color:var(--app-muted)]">System</span>
      </div>
    );
  }

  if (name) {
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    return (
      <div className="flex items-center gap-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-xs font-medium text-white">
          {initials}
        </div>
        <span className="text-xs font-medium text-[color:var(--app-heading)]">{name}</span>
      </div>
    );
  }

  return null;
}

export function ResultActivityModal({ items }: { items: CandidateActivityItem[] }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const latestItem = items[0] ?? null;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl text-[color:var(--app-heading)]">Recent activity</h2>
            <p className="text-sm text-[color:var(--app-text)]">Open the full candidate feed only when you need detail.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            Open activity
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${items.length} event${items.length === 1 ? "" : "s"}`} tone="neutral" />
          {latestItem ? <StatusPill label={new Date(latestItem.at).toLocaleString()} tone="neutral" /> : null}
        </div>

        {latestItem ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <ActivityActor name={latestItem.actorName} isSystem={latestItem.isSystemEvent} />
              <div className="flex-1">
                <p className="text-sm text-[color:var(--app-heading)]">{latestItem.title}</p>
                <p className="text-sm leading-6 text-[color:var(--app-text)]">{latestItem.detail}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--app-text)]">No recent candidate activity available.</p>
        )}
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
                  style={{
                    background:
                      "radial-gradient(circle at top, color-mix(in srgb, var(--app-brand) 14%, transparent), transparent 24%), var(--app-modal-overlay)"
                  }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(10px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4 md:px-6 md:py-5"
                      style={{ background: "var(--app-modal-header)" }}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label="Activity feed" tone="blue" />
                          <StatusPill label={`${items.length} events`} tone="neutral" />
                        </div>
                        <div>
                          <h3 className="text-xl text-[color:var(--app-heading)]">Candidate activity</h3>
                          <p className="text-sm text-[color:var(--app-muted)]">Notes, milestones, resumes, and results with user attribution.</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4 md:p-5" style={{ background: "var(--app-modal-body)" }}>
                      {items.length === 0 ? (
                        <p className="text-sm text-[color:var(--app-muted)]">No recent candidate activity available.</p>
                      ) : (
                        items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.04 }}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <ActivityActor name={item.actorName} isSystem={item.isSystemEvent} />
                                  <StatusPill label={item.kind} tone="neutral" />
                                </div>
                                <p className="text-xs text-[color:var(--app-muted)]">{new Date(item.at).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[color:var(--app-heading)]">{item.title}</p>
                                <p className="mt-1 text-sm leading-6 text-[color:var(--app-text)]">{item.detail}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
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

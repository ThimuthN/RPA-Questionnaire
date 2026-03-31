"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/primitives/Button";

type Option = {
  value: string;
  label: string;
};

export function ResultsFiltersModal({
  advancedCount,
  current,
  roleOptions,
  ownerOptions,
  stageOptions,
  reviewStateOptions,
  contextTypeOptions,
  integrityOptions,
  scoreBandOptions
}: {
  advancedCount: number;
  current: {
    q?: string;
    sort?: string;
    status?: string;
    reviewState?: string;
    contextType?: string;
    integrity?: string;
    role?: string;
    owner?: string;
    stage?: string;
    scoreBand?: string;
    pageSize?: string;
  };
  roleOptions: Option[];
  ownerOptions: Option[];
  stageOptions: Option[];
  reviewStateOptions: Option[];
  contextTypeOptions: Option[];
  integrityOptions: Option[];
  scoreBandOptions: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:-translate-y-[2px] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
      >
        Advanced filters
        {advancedCount > 0 ? (
          <span className="ml-2 rounded-full bg-[color:var(--app-brand-soft)] px-2 py-0.5 text-xs text-[color:var(--app-brand)]">
            {advancedCount}
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(6px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                  style={{ background: "var(--app-modal-overlay)" }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-3xl rounded-[28px] border border-[color:var(--app-border)] p-6"
                    style={{
                      background: "var(--app-modal-surface)",
                      boxShadow: "var(--app-modal-shadow)"
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl text-[color:var(--app-heading)]">Advanced filters</h2>
                        <p className="text-sm text-[color:var(--app-muted)]">Refine the results you want to review.</p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <form action="/results" className="mt-5 space-y-5">
                      <input type="hidden" name="q" value={current.q ?? ""} />
                      <input type="hidden" name="sort" value={current.sort ?? "newest"} />
                      <input type="hidden" name="status" value={current.status ?? ""} />
                      <input type="hidden" name="pageSize" value={current.pageSize ?? "12"} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FilterField label="Review state">
                          <select name="reviewState" defaultValue={current.reviewState ?? ""} className={fieldClassName}>
                            <option value="">All review states</option>
                            {reviewStateOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Assessment context">
                          <select name="contextType" defaultValue={current.contextType ?? ""} className={fieldClassName}>
                            <option value="">All contexts</option>
                            {contextTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Integrity">
                          <select name="integrity" defaultValue={current.integrity ?? ""} className={fieldClassName}>
                            <option value="">All integrity levels</option>
                            {integrityOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Candidate role">
                          <select name="role" defaultValue={current.role ?? ""} className={fieldClassName}>
                            <option value="">All roles</option>
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Linked owner">
                          <select name="owner" defaultValue={current.owner ?? ""} className={fieldClassName}>
                            <option value="">All linked owners</option>
                            {ownerOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Linked stage">
                          <select name="stage" defaultValue={current.stage ?? ""} className={fieldClassName}>
                            <option value="">All linked stages</option>
                            {stageOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                        <FilterField label="Score band">
                          <select name="scoreBand" defaultValue={current.scoreBand ?? ""} className={fieldClassName}>
                            <option value="">All score bands</option>
                            {scoreBandOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </FilterField>
                      </div>

                      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm text-[color:var(--app-muted)]">
                        Owner and stage only apply when the result is linked to a tracked person.
                      </div>

                      <div className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--app-border)] pt-4">
                        <Link
                          href="/results?clearView=1"
                          className="inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                        >
                          Reset all
                        </Link>
                        <div className="flex flex-wrap gap-3">
                          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Apply</Button>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

function FilterField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{label}</span>
      {children}
    </label>
  );
}

const fieldClassName =
  "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60";

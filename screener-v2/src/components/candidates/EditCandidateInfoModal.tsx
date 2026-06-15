"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { resumeSourceOptions } from "@/lib/candidates/types";
import type { CandidateDetail } from "@/lib/db/candidates";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

export function EditCandidateInfoModal({
  candidate,
  returnTo,
  open: controlledOpen,
  onOpenChange,
}: {
  candidate: CandidateDetail;
  returnTo?: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpenRef = useRef<(v: boolean) => void>(() => {});
  setOpenRef.current = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  function setOpen(v: boolean) { setOpenRef.current(v); }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [owners, setOwners] = useState<UserOption[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(candidate.hrOwnerId || "");

  async function loadOwners(deptId: string) {
    if (!deptId) {
      setOwners([]);
      return;
    }

    try {
      const response = await fetch(`/api/users?departmentId=${encodeURIComponent(deptId)}`, { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; users?: UserOption[] };
      if (Array.isArray(data.users)) {
        setOwners(data.users);
      }
    } catch {
      // Silently fail - owners are optional
    }
  }

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    loadOwners(candidate.departmentId || "");
  }, [candidate.departmentId]);

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
      {controlledOpen === undefined ? (
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Edit info
        </Button>
      ) : null}

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
                    className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4 md:px-6 md:py-5" style={{ background: "var(--app-modal-header)" }}>
                      <div>
                        <h3 className="text-xl text-[color:var(--app-heading)]">Edit info</h3>
                        <p className="text-sm text-[color:var(--app-muted)]">Keep the basics up to date.</p>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSubmitting(true);
                        setSubmitError(null);

                        const formData = new FormData(e.currentTarget);
                        try {
                          const response = await fetch(`/api/candidates/${candidate.id}`, {
                            method: "POST",
                            headers: {
                              Accept: "application/json"
                            },
                            body: formData
                          });

                          if (!response.ok) {
                            const data = (await response.json().catch(() => null)) as { message?: string } | null;
                            throw new Error(data?.message || `API error: ${response.status}`);
                          }

                          setOpen(false);
                          router.refresh();
                        } catch (err) {
                          setSubmitError(err instanceof Error ? err.message : "Failed to save");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="flex min-h-0 flex-1 flex-col"
                    >
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6" style={{ background: "var(--app-modal-body)" }}>
                        {submitError && (
                          <div className="rounded-[16px] border border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
                            {submitError}
                          </div>
                        )}
                        <input type="hidden" name="hrOwnerId" value={selectedOwnerId} />
                        {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Full name</span>
                            <input
                              name="fullName"
                              defaultValue={candidate.fullName}
                              required
                              disabled={isSubmitting}
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Email</span>
                            <input
                              name="email"
                              type="email"
                              defaultValue={candidate.email}
                              required
                              disabled={isSubmitting}
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Phone</span>
                            <input
                              name="phone"
                              defaultValue={candidate.phone || ""}
                              disabled={isSubmitting}
                              placeholder="Add a contact number"
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Current title</span>
                            <input
                              name="currentTitle"
                              defaultValue={candidate.currentTitle || ""}
                              disabled={isSubmitting}
                              placeholder="e.g. Senior Software Engineer"
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Location</span>
                            <input
                              name="location"
                              defaultValue={candidate.location || ""}
                              disabled={isSubmitting}
                              placeholder="e.g. New York, NY"
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Salary expectation</span>
                            <input
                              name="salaryExpectation"
                              defaultValue={candidate.salaryExpectation || ""}
                              disabled={isSubmitting}
                              placeholder="e.g. $80,000–$100,000"
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <label className="grid gap-1 md:col-span-2">
                            <span className="text-sm text-[color:var(--app-text)]">LinkedIn URL</span>
                            <input
                              name="linkedInUrl"
                              type="url"
                              defaultValue={candidate.linkedInUrl || ""}
                              disabled={isSubmitting}
                              placeholder="https://linkedin.com/in/..."
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>

                          <div className="grid gap-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                            <span className="text-sm text-[color:var(--app-text)]">Registered</span>
                            <p className="text-sm text-[color:var(--app-heading)]">
                              {new Date(candidate.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-[color:var(--app-muted)]">Original intake date for this candidate record.</p>
                          </div>

                          <div className="grid gap-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                            <span className="text-sm text-[color:var(--app-text)]">Department</span>
                            <p className="text-sm text-[color:var(--app-heading)]">{candidate.departmentName || "Not assigned"}</p>
                            <p className="text-xs text-[color:var(--app-muted)]">Use Transfer department to change this bucket.</p>
                          </div>

                          <div className="grid gap-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                            <span className="text-sm text-[color:var(--app-text)]">Role</span>
                            <p className="text-sm text-[color:var(--app-heading)]">{candidate.roleLabel || "Role not set"}</p>
                            <p className="text-xs text-[color:var(--app-muted)]">Role changes follow the same transfer flow.</p>
                          </div>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Owner</span>
                            <select
                              value={selectedOwnerId}
                              onChange={(e) => setSelectedOwnerId(e.target.value)}
                              disabled={isSubmitting}
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            >
                              <option value="">Unassigned</option>
                              {owners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                  {owner.name || owner.email}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Batch / cohort</span>
                            <input
                              name="batchId"
                              defaultValue={candidate.batchId || ""}
                              disabled={isSubmitting}
                              placeholder="Optional intake group"
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                            />
                          </label>
                        </div>

                        <div className="grid gap-2">
                          <span className="text-sm text-[color:var(--app-text)]">Source</span>
                          <ChoicePills
                            name="resumeSource"
                            idPrefix={`candidate-source-${candidate.id}`}
                            defaultValue={candidate.resumeSource || ""}
                            options={[
                              { value: "", label: "None" },
                              ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
                            ]}
                          />
                        </div>

                        <label className="grid gap-1">
                          <span className="text-sm text-[color:var(--app-text)]">Folder link</span>
                          <input
                            name="candidateFolderUrl"
                            defaultValue={candidate.candidateFolderUrl || ""}
                            placeholder="https://..."
                            disabled={isSubmitting}
                            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                          />
                        </label>

                        <label className="grid gap-1">
                          <span className="text-sm text-[color:var(--app-text)]">Candidate notes</span>
                          <textarea
                            name="notesSummary"
                            rows={4}
                            defaultValue={candidate.notesSummary || ""}
                            disabled={isSubmitting}
                            placeholder="Key context, expectations, risks, or recruiter notes..."
                            className="min-h-[120px] rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-footer)" }}>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
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

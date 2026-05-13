"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker, type RolePickerOption } from "@/components/roles/RolePicker";
import { resumeSourceOptions, type CandidateUiStatus } from "@/lib/candidates/types";
import type { CandidateDetail } from "@/lib/db/candidates";

export function EditCandidateInfoModal({
  candidate,
  uiStatus
}: {
  candidate: CandidateDetail;
  uiStatus: CandidateUiStatus;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RolePickerOption | null>(
    candidate.roleId && candidate.roleLabel
      ? {
          id: candidate.roleId,
          label: candidate.roleLabel,
          department: undefined,
          coreBasisRoleId: (candidate.coreBasisRoleId ?? "Associate")
        }
      : null
  );

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
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Edit info
      </Button>

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

                    <form action={`/api/candidates/${candidate.id}`} method="post" className="flex min-h-0 flex-1 flex-col">
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6" style={{ background: "var(--app-modal-body)" }}>
                        <input type="hidden" name="uiStatus" value={uiStatus} />
                        <input type="hidden" name="phone" value={candidate.phone || ""} />
                        <input type="hidden" name="batchId" value={candidate.batchId || ""} />
                        <input type="hidden" name="notesSummary" value={candidate.notesSummary || ""} />

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Full name</span>
                            <input
                              name="fullName"
                              defaultValue={candidate.fullName}
                              required
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                            />
                          </label>

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Email</span>
                            <input
                              name="email"
                              type="email"
                              defaultValue={candidate.email}
                              required
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                            />
                          </label>

                          <RolePicker
                            name="roleId"
                            label="Role"
                            value={selectedRole}
                            onChange={setSelectedRole}
                            placeholder="Optional"
                            helperText="Choose a saved role, or update the catalog from Manage roles."
                            layout="stacked"
                            className="grid gap-1"
                          />

                          <label className="grid gap-1">
                            <span className="text-sm text-[color:var(--app-text)]">Owner</span>
                            <input
                              name="hrOwner"
                              defaultValue={candidate.hrOwner || ""}
                              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
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
                            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-footer)" }}>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Save</Button>
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

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/primitives/Button";

export function CandidateCsvImportModal({ returnTo }: { returnTo: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

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
        <Upload className="h-4 w-4" />
        Import
      </Button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
                  style={{ background: "var(--app-modal-overlay)" }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(8px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    className="flex w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className="flex items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-5 md:px-6"
                      style={{ background: "var(--app-modal-header)" }}
                    >
                      <div className="space-y-1">
                        <h2 className="text-2xl text-[color:var(--app-heading)]">Import candidates</h2>
                        <p className="text-sm text-[color:var(--app-muted)]">Upload a CSV when you need to add candidates in bulk.</p>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <form
                      action="/api/candidates/bulk"
                      method="post"
                      encType="multipart/form-data"
                      className="space-y-4 px-5 py-5 md:px-6"
                      style={{ background: "var(--app-modal-body)" }}
                    >
                      <input type="hidden" name="action" value="import_csv" />
                      <input type="hidden" name="returnTo" value={returnTo} />

                      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                        <p className="text-sm text-[color:var(--app-heading)]">CSV format</p>
                        <p className="mt-1 text-sm text-[color:var(--app-muted)]">Use: `fullName,email,role,hrOwner`</p>
                      </div>

                      <label className="grid gap-2">
                        <span className="text-sm text-[color:var(--app-text)]">Choose file</span>
                        <input
                          type="file"
                          name="csvFile"
                          accept=".csv,text/csv"
                          className="w-full rounded-[18px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-4 text-sm text-[color:var(--app-text)]"
                        />
                      </label>

                      <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Import CSV</Button>
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

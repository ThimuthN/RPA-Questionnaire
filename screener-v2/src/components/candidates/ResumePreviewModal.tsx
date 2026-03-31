"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

export function ResumePreviewModal({
  fileName,
  previewUrl,
  downloadUrl
}: {
  fileName: string;
  previewUrl: string;
  downloadUrl?: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const viewerUrl = useMemo(() => `${previewUrl}#toolbar=1&navpanes=0&view=FitH`, [previewUrl]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Open CV
      </Button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(8px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
                  style={{ background: "radial-gradient(circle at top, color-mix(in srgb, var(--app-brand) 14%, transparent), transparent 24%), var(--app-modal-overlay)" }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className="flex h-[min(90vh,920px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[32px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4 md:px-6 md:py-5" style={{ background: "var(--app-modal-header)" }}>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label="CV preview" tone="blue" />
                          <StatusPill label="PDF" tone="neutral" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="truncate text-xl text-[color:var(--app-heading)] md:text-2xl">{fileName}</h2>
                          <p className="text-sm text-[color:var(--app-muted)]">Review the document in a focused popup without leaving the candidate page.</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {downloadUrl ? (
                          <a href={downloadUrl} target="_blank" rel="noreferrer">
                            <Button type="button" variant="secondary">Download PDF</Button>
                          </a>
                        ) : null}
                        <a href={previewUrl} target="_blank" rel="noreferrer">
                          <Button type="button" variant="secondary">Open in new tab</Button>
                        </a>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden p-3 md:p-5" style={{ background: "var(--app-modal-body)" }}>
                      <div className="h-full overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-white shadow-[var(--app-shadow)]">
                        <object data={viewerUrl} type="application/pdf" className="h-full min-h-[70vh] w-full">
                          <div className="flex h-full min-h-[420px] items-center justify-center bg-slate-50 px-6 text-center">
                            <div className="space-y-3">
                              <p className="text-sm text-slate-700">Preview is not available in this browser.</p>
                              <a href={previewUrl} target="_blank" rel="noreferrer">
                                <Button type="button" variant="secondary">Open PDF</Button>
                              </a>
                            </div>
                          </div>
                        </object>
                      </div>
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

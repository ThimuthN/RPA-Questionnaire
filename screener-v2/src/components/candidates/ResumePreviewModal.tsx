"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const viewerUrl = useMemo(() => `${previewUrl}#toolbar=1&navpanes=0&view=FitH`, [previewUrl]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        View preview
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(8px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/82 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
              transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,30,48,0.98),rgba(8,12,22,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.52)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-5">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill label="Resume preview" tone="blue" />
                    <StatusPill label="PDF" tone="neutral" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="truncate text-2xl text-white">{fileName}</h2>
                    <p className="text-sm text-slate-300">Review the document in a focused viewer without leaving the candidate page.</p>
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

              <div className="flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.16),transparent_24%),linear-gradient(180deg,rgba(8,12,20,0.98),rgba(4,8,16,1))] p-5">
                <div className="h-full overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_18px_60px_rgba(2,8,23,0.32)]">
                  <object data={viewerUrl} type="application/pdf" className="h-full min-h-[78vh] w-full">
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
      </AnimatePresence>
    </>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

type ActivityItem = {
  id: string;
  kind: string;
  at: string;
  title: string;
  detail: string;
};

export function CandidateActivityModal({ items }: { items: ActivityItem[] }) {
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Recent activity</h2>
            <p className="text-sm text-slate-300">Open the full feed when you need detail.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            Open activity
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-300">No activity yet.</p>
        ) : (
          <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-white/8">
            <div className="flex flex-wrap gap-2">
              <StatusPill label={`${items.length} events`} tone="neutral" />
              {latestItem ? <StatusPill label={new Date(latestItem.at).toLocaleString()} tone="neutral" /> : null}
            </div>
            <p className="mt-3 text-sm text-white">
              {latestItem ? latestItem.title : "Activity feed is ready when you need it."}
            </p>
            {latestItem ? <p className="mt-1 text-sm leading-6 text-slate-300">{latestItem.detail}</p> : null}
          </div>
        )}
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.16),transparent_24%),rgba(2,6,16,0.88)] p-4 md:p-6"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(10px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,30,48,0.98),rgba(8,12,22,0.985))] shadow-[0_28px_90px_rgba(0,0,0,0.52)]"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-4 md:px-6 md:py-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label="Activity feed" tone="blue" />
                          <StatusPill label={`${items.length} events`} tone="neutral" />
                        </div>
                        <div>
                          <h3 className="text-xl text-white">Recent activity</h3>
                          <p className="text-sm text-slate-300">Notes, results, resumes, and milestone changes in one place.</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <div className="max-h-[70vh] space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.12),transparent_18%),linear-gradient(180deg,rgba(8,12,20,0.98),rgba(4,8,16,1))] p-4 md:p-5">
                      {items.length === 0 ? (
                        <p className="text-sm text-slate-300">No activity yet.</p>
                      ) : (
                        items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            className="rounded-[18px] border border-white/10 bg-black/20 p-4"
                            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.04 }}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={item.kind} tone="neutral" />
                              <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                            </div>
                            <p className="mt-3 text-sm text-white">{item.title}</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                              {item.detail}
                            </p>
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

"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const previewItems = items.slice(0, 3);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl text-white">Recent activity</h2>
            <p className="text-sm text-slate-300">Open the full feed when you need detail.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            Open activity
          </Button>
        </div>

        {previewItems.length === 0 ? (
          <p className="text-sm text-slate-300">No activity yet.</p>
        ) : (
          <div className="grid gap-3">
            {previewItems.map((item) => (
              <div key={item.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={item.kind} tone="neutral" />
                  <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                </div>
                <p className="mt-3 text-sm text-white">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,27,40,0.98),rgba(14,19,30,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl text-white">Recent activity</h3>
                <p className="text-sm text-slate-300">Notes, results, resumes, and milestone changes in one feed.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-5 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <p className="text-sm text-slate-300">No activity yet.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={item.kind} tone="neutral" />
                      <StatusPill label={new Date(item.at).toLocaleString()} tone="neutral" />
                    </div>
                    <p className="mt-3 text-sm text-white">{item.title}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                      {item.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

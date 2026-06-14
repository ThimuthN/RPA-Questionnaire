"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type Slot = { id: string; startsAt: string; endsAt: string };

function formatSlot(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return { dateStr, timeStr };
}

export function SchedulingPageClient({
  token,
  slots,
  durationMin,
}: {
  token: string;
  slots: Slot[];
  durationMin: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function confirmSlot() {
    if (!selected) return;
    setStatus("submitting");
    try {
      const res = await fetch(`/api/schedule/${token}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? "Could not confirm your slot.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8 text-center space-y-4">
        <CheckCircle2 size={40} className="mx-auto text-green-400" />
        <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">
          Interview confirmed
        </h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          A calendar invite has been sent to your email. We look forward to speaking with you.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8 text-center space-y-3">
        <Calendar size={32} className="mx-auto text-[color:var(--app-muted)]" />
        <p className="text-sm text-[color:var(--app-muted)]">
          No availability windows have been added yet. Please check back soon or contact the hiring team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[color:var(--app-muted)]">
        <Clock size={13} />
        <span>{durationMin} min session — select a time that works for you</span>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => {
          const { dateStr, timeStr } = formatSlot(slot.startsAt, slot.endsAt);
          const isSelected = selected === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelected(slot.id)}
              className={`w-full rounded-[18px] border px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-brand-400 bg-brand-500/10 text-[color:var(--app-heading)]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] hover:border-[color:var(--app-border-strong)] text-[color:var(--app-text)]"
              }`}
            >
              <p className="text-sm font-medium">{dateStr}</p>
              <p className={`text-xs mt-0.5 ${isSelected ? "text-brand-300" : "text-[color:var(--app-muted)]"}`}>
                {timeStr}
              </p>
            </button>
          );
        })}
      </div>

      {status === "error" && (
        <p className="rounded-[14px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </p>
      )}

      <Button
        onClick={confirmSlot}
        disabled={!selected || status === "submitting"}
        className="w-full disabled:opacity-50"
      >
        {status === "submitting" ? "Confirming…" : "Confirm this time"}
      </Button>
    </div>
  );
}

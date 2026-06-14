"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Copy, Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type Window = { id: string; startsAt: string; endsAt: string };

function formatWindow(w: Window) {
  const s = new Date(w.startsAt);
  const e = new Date(w.endsAt);
  return `${s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export function SelfSchedulingDrawer({
  isOpen,
  onClose,
  panelId,
  roundName,
  durationMin,
}: {
  isOpen: boolean;
  onClose: () => void;
  panelId: string;
  roundName: string;
  durationMin: number;
}) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStart, setNewStart] = useState("");
  const [schedulingUrl, setSchedulingUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSchedulingUrl("");
    setCopied(false);
    setNewStart("");
    setLoading(true);
    fetch(`/api/panels/${panelId}/availability`)
      .then((r) => r.json())
      .then((d) => setWindows(d.windows ?? []))
      .catch(() => setError("Could not load availability windows."))
      .finally(() => setLoading(false));
  }, [isOpen, panelId]);

  function computeEnd(start: string): string {
    if (!start) return "";
    const d = new Date(start);
    d.setMinutes(d.getMinutes() + durationMin);
    return d.toISOString().slice(0, 16);
  }

  async function addWindow() {
    if (!newStart) return;
    setAdding(true);
    setError("");
    try {
      const endsAt = new Date(computeEnd(newStart)).toISOString();
      const startsAt = new Date(newStart).toISOString();
      const res = await fetch(`/api/panels/${panelId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windows: [{ startsAt, endsAt }] }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed.");
      const freshRes = await fetch(`/api/panels/${panelId}/availability`);
      const fresh = await freshRes.json();
      setWindows(fresh.windows ?? []);
      setNewStart("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding window.");
    } finally {
      setAdding(false);
    }
  }

  async function removeWindow(windowId: string) {
    setError("");
    try {
      await fetch(`/api/panels/${panelId}/availability?windowId=${windowId}`, { method: "DELETE" });
      setWindows((prev) => prev.filter((w) => w.id !== windowId));
    } catch {
      setError("Failed to remove window.");
    }
  }

  async function generateLink() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/panels/${panelId}/scheduling-link`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Failed to generate link.");
      }
      const { url } = await res.json();
      setSchedulingUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating link.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(schedulingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                    <Calendar className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[color:var(--app-heading)]">
                      Candidate self-scheduling
                    </h2>
                    <p className="text-xs text-[color:var(--app-muted)]">{roundName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 transition hover:bg-[color:var(--app-surface-soft)]"
                >
                  <X className="h-5 w-5 text-[color:var(--app-muted)]" />
                </button>
              </div>

              <div className="space-y-5 p-6">
                {error && (
                  <p className="rounded-[14px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}

                {/* Availability windows */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                    Availability windows
                  </p>
                  {loading ? (
                    <p className="text-sm text-[color:var(--app-muted)]">Loading…</p>
                  ) : windows.length === 0 ? (
                    <p className="text-sm text-[color:var(--app-muted)]">No windows added yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {windows.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between gap-2 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3.5 py-2"
                        >
                          <span className="text-sm text-[color:var(--app-text)]">{formatWindow(w)}</span>
                          <button
                            type="button"
                            onClick={() => removeWindow(w.id)}
                            className="text-[color:var(--app-muted)] hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add window */}
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="flex-1 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3.5 py-2.5 text-sm text-[color:var(--app-text)] outline-none focus:border-brand-300/60"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addWindow}
                    disabled={!newStart || adding}
                    className="shrink-0"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <p className="text-xs text-[color:var(--app-muted)]">
                  Each window auto-ends after {durationMin} min. Add multiple slots so the candidate can pick their preference.
                </p>

                {/* Scheduling link */}
                {schedulingUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                      Scheduling link
                    </p>
                    <div className="flex items-center gap-2 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3.5 py-2.5">
                      <span className="flex-1 truncate text-xs text-[color:var(--app-muted)]">{schedulingUrl}</span>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="shrink-0 text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
                      >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Share this link with the candidate. It expires in 72 hours and can only be used once.
                    </p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={generateLink}
                    disabled={windows.length === 0 || generating}
                    className="w-full disabled:opacity-50"
                  >
                    {generating ? "Generating…" : "Generate scheduling link"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

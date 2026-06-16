"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, X, Send, Loader2, GripVertical } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const RESERVED = new Set(["applicants", "jobs", "new", "pool", "board", "analytics"]);
const POS_KEY = "starry-dock-pos";

const LAUNCHER_SIZE = 64;
const PANEL_W = 380;
const PANEL_H = 520;

// Keep the dock fully on-screen. Without this, the open 380×520 panel can be
// positioned from a saved launcher offset such that its header (and the close
// button) sit off the viewport edge — so it can't be minimized again.
function clampToViewport(p: { right: number; bottom: number }, w: number, h: number) {
  if (typeof window === "undefined") return p;
  const maxRight = Math.max(8, window.innerWidth - w - 8);
  const maxBottom = Math.max(8, window.innerHeight - h - 8);
  return {
    right: Math.min(Math.max(8, p.right), maxRight),
    bottom: Math.min(Math.max(8, p.bottom), maxBottom)
  };
}

function candidateIdFromPath(pathname: string): string | undefined {
  const m = pathname.match(/^\/people\/candidates\/([^/]+)/);
  if (m && !RESERVED.has(m[1]!)) return m[1];
  const d = pathname.match(/^\/departments\/[^/]+\/candidates\/([^/]+)/);
  if (d) return d[1];
  return undefined;
}

const QUICK_ACTIONS_CANDIDATE = [
  { label: "Summarize candidate", prompt: "Give me a tight summary of this candidate's fit for the role — strengths, gaps, and what to probe in an interview." },
  { label: "Draft outreach email", prompt: "Draft a short, warm outreach email inviting this candidate to a first screening call. Keep it professional and personalized." },
  { label: "Screening questions", prompt: "Suggest 5 role-relevant screening questions for this candidate, focused on skills and experience." }
];

const QUICK_ACTIONS_GENERAL = [
  { label: "Draft a job description", prompt: "Help me draft a clear, inclusive job description. Ask me for the role title and key requirements first." },
  { label: "Screening questions", prompt: "Suggest a set of strong, role-relevant screening questions. Ask me which role first." }
];

export function StarryDock({ configured }: { configured: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ right: number; bottom: number }>({ right: 20, bottom: 88 });
  const posRef = useRef(pos);
  const dragRef = useRef<{ x: number; y: number; right: number; bottom: number; moved: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const candidateId = candidateIdFromPath(pathname ?? "");
  const quickActions = candidateId ? QUICK_ACTIONS_CANDIDATE : QUICK_ACTIONS_GENERAL;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.right === "number" && typeof p?.bottom === "number") {
          const next = clampToViewport({ right: p.right, bottom: p.bottom }, LAUNCHER_SIZE, LAUNCHER_SIZE);
          posRef.current = next;
          setPos(next);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  // Whenever we open (and on window resize), pull the dock fully into view so the
  // header + close button are always reachable. Escape also minimizes it.
  useEffect(() => {
    const w = open ? PANEL_W : LAUNCHER_SIZE;
    const h = open ? PANEL_H : LAUNCHER_SIZE;
    const next = clampToViewport(posRef.current, w, h);
    posRef.current = next;
    setPos(next);

    function onResize() {
      const clamped = clampToViewport(posRef.current, w, h);
      posRef.current = clamped;
      setPos(clamped);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commitPos(next: { right: number; bottom: number }) {
    posRef.current = next;
    setPos(next);
  }

  function onDragStart(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, right: posRef.current.right, bottom: posRef.current.bottom, moved: false };
  }
  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    const w = open ? PANEL_W : LAUNCHER_SIZE;
    const h = open ? PANEL_H : LAUNCHER_SIZE;
    commitPos(clampToViewport({ right: d.right - dx, bottom: d.bottom - dy }, w, h));
  }
  function onDragEnd() {
    const d = dragRef.current;
    dragRef.current = null;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
    } catch {
      /* ignore */
    }
    return d?.moved ?? false;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), candidateId })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: !res.ok || !data.ok ? data.error || "Something went wrong reaching Starry." : data.text || "(no response)" }
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error reaching Starry." }]);
    } finally {
      setLoading(false);
    }
  }

  // Collapsed: draggable launcher (drag to reposition; click to open)
  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open Starry AI assistant (drag to move)"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={() => {
          if (!onDragEnd()) setOpen(true);
        }}
        style={{ right: pos.right, bottom: pos.bottom, touchAction: "none" }}
        className="fixed z-50 inline-flex cursor-grab items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_30%,transparent)] transition hover:brightness-105 active:cursor-grabbing"
      >
        <Sparkles className="h-4 w-4" />
        Ask Starry
      </button>
    );
  }

  return (
    <div
      style={{ right: pos.right, bottom: pos.bottom }}
      className="fixed z-50 flex h-[520px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow)]"
    >
      {/* Header — drag handle */}
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={() => onDragEnd()}
        style={{ touchAction: "none" }}
        className="flex cursor-grab items-center justify-between gap-2 border-b border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_14%,var(--app-surface)),var(--app-surface))] px-4 py-3 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-[color:var(--app-muted)]" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[color:var(--app-heading)]">Starry</p>
            <p className="text-[11px] text-[color:var(--app-muted)]">
              {!configured ? "Limited — no model connected" : candidateId ? "Viewing candidate context" : "AI hiring assistant"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpen(false)}
          aria-label="Minimize Starry"
          title="Minimize (Esc)"
          className="shrink-0 rounded-full p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!configured ? (
          <div className="rounded-[12px] border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--pill-amber-text)]">
            Starry isn&apos;t connected to a model yet, so AI answers are unavailable. An admin can enable it in{" "}
            <Link href="/integrations" className="font-semibold underline">Integrations</Link>.
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[color:var(--app-muted)]">
              Hi — I&apos;m Starry. I can review résumés, assess role fit, suggest screening questions, and draft candidate emails. I assist; you decide.
            </p>
            <div className="flex flex-col gap-1.5">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => void send(a.prompt)}
                  className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-text)] transition hover:border-[color:var(--app-brand)]/40 hover:text-[color:var(--app-heading)]"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] whitespace-pre-wrap rounded-[14px] rounded-br-sm bg-[color:var(--app-brand)] px-3 py-2 text-sm text-white"
                    : "max-w-[90%] whitespace-pre-wrap rounded-[14px] rounded-bl-sm bg-[color:var(--app-surface-soft)] px-3 py-2 text-sm text-[color:var(--app-text)]"
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-[color:var(--app-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starry is thinking…
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-[color:var(--app-border)] p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder="Ask Starry…"
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] outline-none focus:border-[color:var(--app-brand)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--app-brand)] text-white transition hover:brightness-105 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

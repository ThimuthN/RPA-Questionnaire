"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const RESERVED = new Set(["applicants", "jobs", "new", "pool", "board", "analytics"]);

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

export function StarryDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const candidateId = candidateIdFromPath(pathname ?? "");
  const quickActions = candidateId ? QUICK_ACTIONS_CANDIDATE : QUICK_ACTIONS_GENERAL;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

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
      if (!res.ok || !data.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.error || "Something went wrong reaching Starry." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.text || "(no response)" }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error reaching Starry." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Starry AI assistant"
        className="fixed bottom-20 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_30%,transparent)] transition hover:-translate-y-[1px] hover:brightness-105"
      >
        <Sparkles className="h-4 w-4" />
        Ask Starry
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-5 z-50 flex h-[520px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_14%,var(--app-surface)),var(--app-surface))] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[color:var(--app-heading)]">Starry</p>
            <p className="text-[11px] text-[color:var(--app-muted)]">{candidateId ? "Viewing candidate context" : "AI hiring assistant"}</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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

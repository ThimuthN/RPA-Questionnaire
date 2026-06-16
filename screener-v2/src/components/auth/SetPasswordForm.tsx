"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "var(--app-danger)",
  "var(--app-danger)",
  "var(--pill-amber-text)",
  "var(--app-brand)",
  "var(--app-brand-strong)"
];

function scorePassword(pw: string): number {
  if (pw.length < 8) return 0;
  let score = 1;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export function SetPasswordForm({
  mode,
  token,
  email,
  defaultName,
  submitLabel
}: {
  mode: "invite" | "reset";
  token: string;
  email?: string;
  defaultName?: string;
  submitLabel: string;
}) {
  const endpoint = mode === "invite" ? "/api/auth/accept-invite" : "/api/auth/reset-password";
  const collectName = mode === "invite" && !defaultName?.trim();

  const [name, setName] = useState(defaultName ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => scorePassword(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && confirm === password && (!collectName || name.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, ...(collectName ? { name: name.trim() } : {}) })
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; next?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.assign(data.next ?? "/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {email ? (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-[color:var(--app-text)]">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-2.5 text-sm text-[color:var(--app-muted)]">
            <Check className="h-3.5 w-3.5 text-[color:var(--app-brand)]" />
            {email}
          </div>
        </div>
      ) : null}

      {collectName ? (
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-[color:var(--app-text)]">Your name</label>
          <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-[color:var(--app-text)]">
          {mode === "invite" ? "Create a password" : "New password"}
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {password.length > 0 ? (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex h-1 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-full flex-1 rounded-full transition-colors"
                  style={{ background: i < strength ? STRENGTH_COLORS[strength] : "var(--app-border)" }}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium" style={{ color: STRENGTH_COLORS[strength] }}>
              {STRENGTH_LABELS[strength]}
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-[color:var(--app-text)]">Confirm password</label>
        <input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          className={inputClass}
        />
        {mismatch ? <p className="text-[12px] text-[color:var(--app-danger)]">Passwords don&apos;t match.</p> : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-4 py-3 text-sm text-[color:var(--app-danger)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--app-brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--app-brand-strong)] active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
    </form>
  );
}

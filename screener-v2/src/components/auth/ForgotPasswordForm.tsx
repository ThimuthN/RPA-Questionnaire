"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      // Always show the same confirmation — no account enumeration.
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          If an account exists for <span className="font-medium text-[color:var(--app-text)]">{email.trim()}</span>,
          we&apos;ve sent a link to reset your password. Check your inbox.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-[color:var(--app-brand)] hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-[color:var(--app-text)]">Email address</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--app-brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--app-brand-strong)] active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </button>
      <div className="text-center">
        <Link href="/login" className="text-sm text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

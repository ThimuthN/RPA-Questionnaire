"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";

type Mode = "invite" | "password";

export function CreateUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("invite");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setError("");
    setInviteLink(null);
    setInvitedEmail("");
    setCopied(false);
    formRef.current?.reset();
  }

  function close() {
    setOpen(false);
    reset();
    if (inviteLink) router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData(formRef.current);
      const payload = Object.fromEntries(formData.entries());
      const endpoint = mode === "invite" ? "/api/users/invite" : "/api/users";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        setError(data.message || "Something went wrong.");
        return;
      }
      if (mode === "invite") {
        setInviteLink(data.acceptUrl ?? null);
        setInvitedEmail(data.email ?? String(payload.email ?? ""));
      } else {
        close();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50";

  return (
    <>
      <Button onClick={() => { setOpen(true); reset(); }}>Add teammate</Button>

      <Modal isOpen={open} onClose={close} title={inviteLink ? "Invitation sent" : "Add teammate"}>
        {inviteLink ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-[16px] border border-[color:var(--app-brand)]/25 bg-[color:var(--app-brand-soft)] px-4 py-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--app-brand)]" />
              <p className="text-sm text-[color:var(--app-text)]">
                An invitation email was sent to <strong>{invitedEmail}</strong>. They&apos;ll set a password to
                activate their account. You can also share this link directly:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input readOnly value={inviteLink} className={`${inputClass} flex-1 text-xs`} onFocus={(e) => e.target.select()} />
              <Button type="button" variant="secondary" onClick={copyLink} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-[color:var(--app-muted)]">The link expires in 72 hours and can be used once.</p>
            <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
              <Button type="button" variant="secondary" onClick={reset}>Invite another</Button>
              <Button type="button" onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-1">
              <button
                type="button"
                onClick={() => { setMode("invite"); setError(""); }}
                className={`flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium transition ${mode === "invite" ? "bg-[color:var(--app-surface)] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]" : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"}`}
              >
                <Mail className="h-4 w-4" /> Invite by email
              </button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium transition ${mode === "password" ? "bg-[color:var(--app-surface)] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]" : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"}`}
              >
                <KeyRound className="h-4 w-4" /> Set password
              </button>
            </div>

            <p className="mb-4 text-sm text-[color:var(--app-muted)]">
              {mode === "invite"
                ? "Send an email invitation — the teammate sets their own password. Recommended."
                : "Create the account with a password you set now."}
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1">
                <label className="text-sm text-[color:var(--app-text)]">Full name {mode === "invite" ? <span className="text-[color:var(--app-muted)]">(optional)</span> : null}</label>
                <input type="text" name="name" placeholder="John Doe" disabled={isSubmitting} className={inputClass} />
              </div>

              <div className="grid gap-1">
                <label className="text-sm text-[color:var(--app-text)]">Email</label>
                <input type="email" name="email" placeholder="user@company.com" required disabled={isSubmitting} className={inputClass} />
              </div>

              {mode === "password" ? (
                <div className="grid gap-1">
                  <label className="text-sm text-[color:var(--app-text)]">Password</label>
                  <input type="password" name="password" placeholder="Min 8 characters" minLength={8} required disabled={isSubmitting} className={inputClass} />
                </div>
              ) : null}

              {error && <NotificationBanner tone="error">{error}</NotificationBanner>}

              <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
                <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "invite" ? "Send invitation" : "Create user"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}

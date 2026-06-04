"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";

export function CreateUserModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Failed to create user");
        return;
      }

      setOpen(false);
      formRef.current.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create user</Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create user">
        <div className="space-y-1 mb-4">
          <p className="text-sm text-[color:var(--app-muted)]">
            Create a new user account with a secure password.
          </p>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]">Full name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]">Email</label>
            <input
              type="email"
              name="email"
              placeholder="user@company.com"
              required
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Min 8 characters"
              minLength={8}
              required
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            />
          </div>

          {error && <NotificationBanner tone="error">{error}</NotificationBanner>}

          <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

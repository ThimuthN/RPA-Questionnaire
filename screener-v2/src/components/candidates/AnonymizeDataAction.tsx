"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

export function AnonymizeDataAction({
  candidateId,
  candidateName,
  backHref
}: {
  candidateId: string;
  candidateName: string;
  backHref: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnonymize() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/anonymize`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to anonymize");
      router.push(backHref as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Anonymize data
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
        >
          <div className="w-full max-w-md space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 shadow-2xl">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[color:var(--app-heading)]">
                Anonymize personal data
              </h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                This replaces all personal identifiers for{" "}
                <strong className="text-[color:var(--app-text)]">{candidateName}</strong> with redacted
                placeholders. Assessment results, pipeline history, and activity logs are preserved for audit
                purposes.
              </p>
            </div>

            <div className="space-y-1 rounded-[14px] border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
              <p className="font-medium">What will be removed:</p>
              <ul className="list-inside list-disc space-y-0.5 text-amber-200/80">
                <li>Full name - redacted placeholder</li>
                <li>Email - anonymized placeholder</li>
                <li>Phone number</li>
                <li>Position applied for</li>
                <li>All notes content</li>
              </ul>
            </div>

            <p className="text-xs text-[color:var(--app-muted)]">
              This action cannot be undone. Use <strong>Delete record</strong> instead if you want to remove the
              candidate entirely.
            </p>

            {error ? (
              <p className="rounded-[12px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={() => void handleAnonymize()} disabled={busy}>
                {busy ? "Anonymizing..." : "Anonymize data"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

export function InterviewKitForm({ mode }: { mode: "create" }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/interview-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, isGlobal }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; kit?: { id: string }; message?: string };
      if (!res.ok || !data.ok) throw new Error(data.message ?? "Failed to create kit");
      router.push(`/assessments/kits/${data.kit!.id}` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error ? (
        <p className="rounded-[14px] border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
      ) : null}

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[color:var(--app-heading)]">Title <span className="text-[color:var(--app-danger)]">*</span></span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Engineer Technical"
          className={inputClass}
          disabled={saving}
          maxLength={120}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[color:var(--app-heading)]">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What this kit is used for"
          className={inputClass}
          disabled={saving}
        />
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isGlobal}
          onChange={(e) => setIsGlobal(e.target.checked)}
          disabled={saving}
          className="h-4 w-4 rounded border-[color:var(--app-border)] accent-[color:var(--app-brand)]"
        />
        <span className="text-sm text-[color:var(--app-text)]">
          <strong className="text-[color:var(--app-heading)]">Global kit</strong> — available to all departments
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create kit"}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={saving}>Cancel</Button>
      </div>
    </form>
  );
}

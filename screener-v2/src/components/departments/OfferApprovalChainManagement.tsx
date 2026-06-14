"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";

interface Approver {
  id: string;
  name: string | null;
  email: string;
}

interface ChainStep {
  id: string;
  sortOrder: number;
  approver: Approver;
}

interface Props {
  departmentId: string;
  initialSteps: ChainStep[];
  teamUsers: Approver[];
}

export function OfferApprovalChainManagement({ departmentId, initialSteps, teamUsers }: Props) {
  const [steps, setSteps] = useState<ChainStep[]>(
    [...initialSteps].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const usersAlreadyAdded = new Set(steps.map((s) => s.approver.id));
  const availableUsers = teamUsers.filter((u) => !usersAlreadyAdded.has(u.id));

  function addStep() {
    if (!selectedUserId) return;
    const user = teamUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    const nextOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.sortOrder)) + 1 : 0;
    setSteps((current) => [
      ...current,
      { id: `pending-${selectedUserId}`, sortOrder: nextOrder, approver: user },
    ]);
    setSelectedUserId("");
    setSaved(false);
  }

  function removeStep(approverId: string) {
    setSteps((current) => {
      const filtered = current.filter((s) => s.approver.id !== approverId);
      return filtered.map((s, i) => ({ ...s, sortOrder: i }));
    });
    setSaved(false);
  }

  function moveStep(index: number, direction: "up" | "down") {
    setSteps((current) => {
      const next = [...current];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return current;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
    setSaved(false);
  }

  async function saveChain() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/departments/${departmentId}/offer-approval-chain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: steps.map((s, i) => ({ approverId: s.approver.id, sortOrder: i })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || data.ok === false) throw new Error(data.message ?? "Failed to save");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">Offer Approval Chain</h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Approvers are notified in order. All must approve before an offer can be sent.
            {steps.length === 0 ? " No chain configured — offers will auto-approve." : ""}
          </p>
        </div>
        <Button onClick={saveChain} disabled={saving}>
          {saving ? "Saving…" : "Save chain"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-[14px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] px-4 py-2 text-sm text-[color:var(--app-danger)]">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-[14px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] px-4 py-2 text-sm text-[color:var(--app-success)]">
          Approval chain saved.
        </div>
      ) : null}

      {steps.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5 text-center">
          <p className="text-sm text-[color:var(--app-muted)]">
            No approvers added. Offers for this workspace will auto-approve when submitted.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.approver.id}
              className="flex items-center gap-3 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--app-brand-soft)] text-xs font-semibold text-[color:var(--app-brand)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[color:var(--app-heading)]">
                  {step.approver.name ?? step.approver.email}
                </p>
                {step.approver.name ? (
                  <p className="truncate text-xs text-[color:var(--app-muted)]">{step.approver.email}</p>
                ) : null}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => moveStep(index, "up")}
                  disabled={index === 0 || saving}
                  aria-label="Move up"
                  className="rounded-lg p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] disabled:opacity-30"
                  type="button"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveStep(index, "down")}
                  disabled={index === steps.length - 1 || saving}
                  aria-label="Move down"
                  className="rounded-lg p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] disabled:opacity-30"
                  type="button"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeStep(step.approver.id)}
                  disabled={saving}
                  aria-label="Remove approver"
                  className="rounded-lg p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] disabled:opacity-30"
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {availableUsers.length > 0 ? (
        <div className="flex items-center gap-2 border-t border-[color:var(--app-border)] pt-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={saving}
            className="flex-1 rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] disabled:opacity-50"
          >
            <option value="">Add an approver…</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </select>
          <Button onClick={addStep} disabled={!selectedUserId || saving} variant="secondary">
            Add
          </Button>
        </div>
      ) : teamUsers.length === 0 ? (
        <p className="border-t border-[color:var(--app-border)] pt-3 text-xs text-[color:var(--app-muted)]">
          Add team members to this workspace before configuring approvers.
        </p>
      ) : (
        <p className="border-t border-[color:var(--app-border)] pt-3 text-xs text-[color:var(--app-muted)]">
          All workspace members are already in the chain.
        </p>
      )}
    </div>
  );
}

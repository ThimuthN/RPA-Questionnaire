"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

type OfferStatus = "draft" | "submitted_for_approval" | "approved" | "sent" | "accepted" | "rejected" | "expired";

interface OfferRecord {
  id: string;
  status: OfferStatus;
  compensationType: string;
  compensationAmount: number | null;
  currency: string;
  targetStartDate: string | null;
  expiresAt: string | null;
  offerNotes: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  approvalSteps?: ApprovalStepRecord[];
}

interface ApprovalStepRecord {
  id: string;
  approverId: string;
  sortOrder: number;
  status: string;
  note: string | null;
  decidedAt: string | null;
  approver: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ApprovalRouteStep {
  approverId: string;
  sortOrder: number;
  approverName: string | null;
  approverEmail: string;
}

const offerStatusTone: Record<OfferStatus, "neutral" | "blue" | "amber" | "emerald" | "red"> = {
  draft: "neutral",
  submitted_for_approval: "amber",
  approved: "emerald",
  sent: "blue",
  accepted: "emerald",
  rejected: "red",
  expired: "amber",
};

const offerStatusLabel: Record<OfferStatus, string> = {
  draft: "Draft",
  submitted_for_approval: "Approval pending",
  approved: "Approved",
  sent: "Offer sent",
  accepted: "Accepted",
  rejected: "Declined",
  expired: "Expired",
};

const currencyOptions = ["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "INR", "LKR"];
const compensationTypes = [
  { value: "salary", label: "Annual salary" },
  { value: "hourly", label: "Hourly rate" },
  { value: "contract", label: "Contract / daily rate" },
];

function formatCompensation(amount: number | null, currency: string, type: string) {
  if (!amount) return "Amount not set";
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  if (type === "hourly") return `${formatted} / hr`;
  if (type === "contract") return `${formatted} / day`;
  return `${formatted} / yr`;
}

function inputClass(extra?: string) {
  return `rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50 ${extra ?? ""}`;
}

function approverLabel(step: { approverName?: string | null; approverEmail: string } | ApprovalStepRecord) {
  if ("approver" in step) {
    return step.approver.name ?? step.approver.email;
  }
  return step.approverName ?? step.approverEmail;
}

export function CandidateOfferPanel({
  candidateId,
  initialOffer,
  canManage,
  currentUserId,
  approvalRoute = [],
}: {
  candidateId: string;
  initialOffer: OfferRecord | null;
  canManage: boolean;
  currentUserId?: string | null;
  approvalRoute?: ApprovalRouteStep[];
}) {
  const router = useRouter();
  const [offer, setOffer] = useState<OfferRecord | null>(initialOffer);
  const [editing, setEditing] = useState(!initialOffer && canManage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  const [form, setForm] = useState({
    compensationType: initialOffer?.compensationType ?? "salary",
    compensationAmount: initialOffer?.compensationAmount?.toString() ?? "",
    currency: initialOffer?.currency ?? "USD",
    targetStartDate: initialOffer?.targetStartDate ? initialOffer.targetStartDate.slice(0, 10) : "",
    expiresAt: initialOffer?.expiresAt ? initialOffer.expiresAt.slice(0, 10) : "",
    offerNotes: initialOffer?.offerNotes ?? "",
  });

  const approvalSteps = offer?.approvalSteps ?? [];
  const currentPendingStep = approvalSteps.find((step) => step.status === "pending") ?? null;
  const completedApprovalCount = approvalSteps.filter((step) => step.status === "approved").length;
  const totalApprovalCount = approvalSteps.length;
  const remainingApprovalCount = approvalSteps.filter((step) => step.status === "pending").length;
  const canCurrentUserApprove = Boolean(
    currentUserId &&
      offer?.status === "submitted_for_approval" &&
      currentPendingStep &&
      currentPendingStep.approverId === currentUserId
  );

  async function saveOffer(action: "upsert" | "send" | "revoke" | "submit_for_approval") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...form }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; offer?: OfferRecord };
      if (!res.ok || data.ok === false) throw new Error(data.message ?? "Failed to save offer");
      if (data.offer) setOffer(data.offer);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprovalDecision(action: "approve" | "reject") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/offer/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: approvalNote.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; status?: OfferStatus };
      if (!res.ok || data.ok === false) {
        throw new Error(data.message ?? `Failed to ${action} offer`);
      }
      setOffer((current) => current ? {
        ...current,
        status: (data.status ?? current.status) as OfferStatus,
        approvalSteps:
          action === "approve" && currentPendingStep
            ? current.approvalSteps?.map((step) =>
                step.id === currentPendingStep.id
                  ? {
                      ...step,
                      status: "approved",
                      note: approvalNote.trim() || null,
                      decidedAt: new Date().toISOString(),
                    }
                  : step
              )
            : current.approvalSteps
      } : current);
      setApprovalNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} offer`);
    } finally {
      setSaving(false);
    }
  }

  if (!canManage && !offer) {
    return (
      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6 text-center">
        <p className="text-sm text-[color:var(--app-muted)]">No offer has been created for this candidate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offer && !editing ? (
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <StatusPill label={offerStatusLabel[offer.status]} tone={offerStatusTone[offer.status]} />
              <p className="text-2xl font-semibold text-[color:var(--app-heading)]">
                {formatCompensation(offer.compensationAmount, offer.currency, offer.compensationType)}
              </p>
            </div>
            {canManage && offer.status === "draft" ? (
              <Button type="button" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-[14px] border border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-soft)] px-3 py-2 text-sm text-[color:var(--app-danger)]">{error}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3 border-t border-[color:var(--app-border)] pt-4">
            <OfferFact label="Type" value={compensationTypes.find(c => c.value === offer.compensationType)?.label ?? offer.compensationType} />
            {offer.targetStartDate ? (
              <OfferFact label="Start date" value={new Date(offer.targetStartDate).toLocaleDateString()} />
            ) : null}
            {offer.expiresAt ? (
              <OfferFact label="Expires" value={new Date(offer.expiresAt).toLocaleDateString()} />
            ) : null}
          </div>

          {offer.offerNotes ? (
            <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 text-sm text-[color:var(--app-text)]">
              {offer.offerNotes}
            </div>
          ) : null}

          {offer.status === "draft" ? (
            <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Approval route</p>
              {approvalRoute.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-[color:var(--app-heading)]">
                    This offer must be approved before it can be sent.
                  </p>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    {approvalRoute
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((step) => approverLabel(step))
                      .join(" → ")}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[color:var(--app-muted)]">
                  No department approval route is configured. Submitting this offer will auto-approve it.
                </p>
              )}
            </div>
          ) : null}

          {offer.status === "submitted_for_approval" ? (
            <div className="rounded-[16px] border border-amber-400/20 bg-amber-500/8 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">Decision owner</p>
              <p className="mt-2 text-sm font-semibold text-amber-100">
                {currentPendingStep ? `Waiting on ${approverLabel(currentPendingStep)}` : "Pending approver decision"}
              </p>
              <p className="mt-1 text-xs text-amber-100/75">
                {completedApprovalCount} of {totalApprovalCount} approval step{totalApprovalCount === 1 ? "" : "s"} completed.
                {remainingApprovalCount > 0 ? ` ${remainingApprovalCount} pending.` : ""}
              </p>
            </div>
          ) : null}

          {offer.status === "approved" ? (
            <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/8 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">Decision status</p>
              <p className="mt-2 text-sm font-semibold text-emerald-100">All approvals complete</p>
              <p className="mt-1 text-xs text-emerald-100/75">
                This offer is ready to send from the ATS.
              </p>
            </div>
          ) : null}

          {offer.status === "expired" ? (
            <div className="rounded-[14px] border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
              This offer expired on {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : "an unknown date"}. Create a new offer to re-engage the candidate.
            </div>
          ) : null}

          {offer.sentAt ? (
            <p className="text-xs text-[color:var(--app-muted)]">Sent {new Date(offer.sentAt).toLocaleDateString()}</p>
          ) : null}
          {offer.respondedAt ? (
            <p className="text-xs text-[color:var(--app-muted)]">
              Candidate responded {new Date(offer.respondedAt).toLocaleDateString()}
            </p>
          ) : null}

          {canManage ? (
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--app-border)] pt-4">
              {offer.status === "draft" ? (
                <Button type="button" onClick={() => void saveOffer("submit_for_approval")} disabled={saving}>
                  {saving ? "Submitting..." : "Submit for approval"}
                </Button>
              ) : null}
              {offer.status === "approved" ? (
                <Button type="button" onClick={() => void saveOffer("send")} disabled={saving}>
                  {saving ? "Sending..." : "Mark as sent"}
                </Button>
              ) : null}
              {offer.status === "submitted_for_approval" ? (
                <p className="text-xs text-amber-400">Waiting on approver sign-off — offer cannot be sent until all approvals are complete.</p>
              ) : null}
              {(offer.status === "sent" || offer.status === "submitted_for_approval") ? (
                <Button type="button" variant="secondary" onClick={() => void saveOffer("revoke")} disabled={saving}>
                  Revoke offer
                </Button>
              ) : null}
              {offer.status === "expired" ? (
                <Button type="button" variant="secondary" onClick={() => void saveOffer("revoke")} disabled={saving}>
                  {saving ? "Removing..." : "Remove expired offer"}
                </Button>
              ) : null}
            </div>
          ) : null}

          {canCurrentUserApprove ? (
            <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Approver action</p>
                <p className="text-sm text-[color:var(--app-heading)]">
                  You are the current approver for this offer.
                </p>
              </div>
              <label className="grid gap-1">
                <span className="text-xs text-[color:var(--app-muted)]">Approval note</span>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  rows={3}
                  disabled={saving}
                  placeholder="Optional context for the hiring team"
                  className={inputClass("min-h-[84px]")}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void handleApprovalDecision("approve")} disabled={saving}>
                  {saving ? "Saving..." : "Approve offer"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => void handleApprovalDecision("reject")} disabled={saving}>
                  {saving ? "Saving..." : "Reject and return to draft"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {(editing || !offer) && canManage ? (
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 space-y-4">
          <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
            {offer ? "Edit offer" : "Create offer"}
          </h3>

          {error ? (
            <p className="rounded-[14px] border border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-soft)] px-3 py-2 text-sm text-[color:var(--app-danger)]">{error}</p>
          ) : null}

          <div className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2.5 text-xs leading-5 text-[color:var(--app-muted)]">
            Submit for approval routes the offer through this department&apos;s approval chain. If no chain is configured, the offer is auto-approved and can be sent immediately.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs text-[color:var(--app-muted)]">Compensation type</span>
              <select
                value={form.compensationType}
                onChange={(e) => setForm({ ...form, compensationType: e.target.value })}
                disabled={saving}
                className={inputClass()}
              >
                {compensationTypes.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-[color:var(--app-muted)]">Currency</span>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                disabled={saving}
                className={inputClass()}
              >
                {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-xs text-[color:var(--app-muted)]">Amount</span>
              <input
                type="number"
                value={form.compensationAmount}
                onChange={(e) => setForm({ ...form, compensationAmount: e.target.value })}
                placeholder="e.g. 85000"
                disabled={saving}
                className={inputClass("w-full")}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-[color:var(--app-muted)]">Target start date</span>
              <input
                type="date"
                value={form.targetStartDate}
                onChange={(e) => setForm({ ...form, targetStartDate: e.target.value })}
                disabled={saving}
                className={inputClass()}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-[color:var(--app-muted)]">Offer expires</span>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                disabled={saving}
                className={inputClass()}
              />
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-xs text-[color:var(--app-muted)]">Offer notes</span>
              <textarea
                value={form.offerNotes}
                onChange={(e) => setForm({ ...form, offerNotes: e.target.value })}
                rows={3}
                placeholder="Benefits, conditions, or context for this offer"
                disabled={saving}
                className={inputClass("w-full min-h-[80px]")}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={() => void saveOffer("upsert")} disabled={saving}>
              {saving ? "Saving..." : "Save offer"}
            </Button>
            {offer ? (
              <Button type="button" variant="ghost" onClick={() => { setEditing(false); setError(null); }} disabled={saving}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!offer && !canManage ? null : null}
    </div>
  );
}

function OfferFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{label}</p>
      <p className="text-sm text-[color:var(--app-heading)]">{value}</p>
    </div>
  );
}

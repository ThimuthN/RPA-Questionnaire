"use client";

import Link from "next/link";
import type { Route } from "next";
import { FileText, ChevronRight, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { CandidateBulkActionsBar } from "@/components/candidates/CandidateBulkActionsBar";
import { candidateStageLabels, type CandidateStage } from "@/lib/candidates/types";
import type { CandidateWorkspaceItem } from "@/lib/candidates/workspace";

const stageOrder: Record<CandidateStage, number> = {
  new: 1,
  screening: 2,
  interview: 3,
  testing: 4,
  decision: 5,
  offer: 6,
  closed: 7
};

const nextStageLabel: Record<CandidateStage, string | null> = {
  new: "Send to Screener",
  screening: "Move to Interview",
  interview: "Move to Review",
  testing: "Finalize",
  decision: "Offer",
  offer: "Close",
  closed: null
};

const tableShellClassName =
  "overflow-hidden rounded-[24px] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]";

const tableHeadClassName =
  "bg-[color:var(--app-table-head)] border-b border-[color:var(--app-border)] text-left text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]";

const tableCellClassName =
  "px-4 py-4 text-sm text-[color:var(--app-text)] align-middle border-t border-[color:var(--app-border)]";

const actionPillPrimaryClassName =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-2.5 py-2 text-xs font-medium text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--app-brand)_28%,transparent)] transition hover:-translate-y-[1px] hover:brightness-105";

const actionPillSecondaryClassName =
  "inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2.5 py-2 text-xs font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:-translate-y-[1px] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]";

const actionIconPillClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-brand-strong)] shadow-[var(--app-shadow-soft)] transition hover:-translate-y-[1px] hover:border-brand-300/50 hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-brand)]";

function contextualAction(candidate: CandidateWorkspaceItem) {
  if (candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "Result"
    };
  }

  if (candidate.latestAssessmentStatus === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Send"
    };
  }

  return null;
}

export function CandidateWorkspaceTable({
  rows,
  currentPathAndQuery,
  roleOptions,
  departmentOptions
}: {
  rows: CandidateWorkspaceItem[];
  currentPathAndQuery: string;
  roleOptions?: Array<{ id: string; label: string }>;
  departmentOptions?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [rejectConfirming, setRejectConfirming] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<Record<string, string>>({});
  const [promoting, setPromoting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const validIds = new Set(rows.map((candidate) => candidate.id));
    setSelectedCandidateIds((current) => current.filter((candidateId) => validIds.has(candidateId)));
  }, [rows]);

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((value) => value !== candidateId)
        : [...current, candidateId]
    );
  }

  function selectAllOnPage() {
    setSelectedCandidateIds(rows.map((candidate) => candidate.id));
  }

  function clearSelection() {
    setSelectedCandidateIds([]);
  }

  return (
    <form action="/api/candidates/bulk" method="post" className="space-y-4">
      <input type="hidden" name="returnTo" value={currentPathAndQuery} />
      <CandidateBulkActionsBar
        selectedCount={selectedCandidateIds.length}
        onSelectAll={selectAllOnPage}
        onClearSelection={clearSelection}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
      />

      <div className={tableShellClassName}>
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full table-fixed text-left">
            <thead className={tableHeadClassName}>
              <tr>
                <th className="w-12 px-4 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th className="w-[24%] px-4 py-3 font-medium">Name</th>
                <th className="w-[13%] px-4 py-3 font-medium">Owner</th>
                <th className="w-[19%] px-4 py-3 font-medium">Status</th>
                <th className="w-[16%] px-4 py-3 font-medium">Department</th>
                <th className="w-[8%] px-4 py-3 font-medium">Updated</th>
                <th className="w-[15%] px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((candidate) => {
                const action = contextualAction(candidate);
                const isSelected = selectedCandidateIds.includes(candidate.id);
                return (
                  <tr key={candidate.id} className="min-h-[88px] transition hover:bg-[color:var(--app-table-row-hover)]">
                    <td className={tableCellClassName}>
                      <input
                        type="checkbox"
                        name="candidateId"
                        value={candidate.id}
                        checked={isSelected}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-transparent text-brand-400 cursor-pointer"
                      />
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-1">
                        <p className="font-medium text-[color:var(--app-heading)] truncate">{candidate.fullName}</p>
                        <p className="text-xs text-[color:var(--app-muted)] truncate">{candidate.roleLabel || "Role not set"}</p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span className="truncate">{candidate.hrOwner || "Unassigned"}</span>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          {nextStageLabel[candidate.stage as CandidateStage] ? (
                            <button
                              type="button"
                              disabled={promoting[candidate.id]}
                              onClick={async () => {
                                setPromoting(prev => ({ ...prev, [candidate.id]: true }));
                                try {
                                  const res = await fetch(`/api/candidates/${candidate.id}/promote`, {
                                    method: "POST"
                                  });
                                  if (res.ok) {
                                    router.refresh();
                                  } else {
                                    setPromoteError(prev => ({ ...prev, [candidate.id]: "Failed to promote candidate" }));
                                    setTimeout(() => setPromoteError(prev => ({ ...prev, [candidate.id]: "" })), 3000);
                                  }
                                } catch (err) {
                                  setPromoteError(prev => ({ ...prev, [candidate.id]: err instanceof Error ? err.message : "Unknown error" }));
                                  setTimeout(() => setPromoteError(prev => ({ ...prev, [candidate.id]: "" })), 3000);
                                } finally {
                                  setPromoting(prev => ({ ...prev, [candidate.id]: false }));
                                }
                              }}
                              className={actionPillSecondaryClassName + " disabled:opacity-50"}
                              title={nextStageLabel[candidate.stage as CandidateStage] || ""}
                            >
                              <span>{nextStageLabel[candidate.stage as CandidateStage]}</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                        {promoteError[candidate.id] && (
                          <p className="text-xs text-[color:var(--app-danger)]">{promoteError[candidate.id]}</p>
                        )}
                        <p className="text-xs text-[color:var(--app-muted)]">
                          {candidate.currentFocus || candidateStageLabels[candidate.stage as CandidateStage]}
                        </p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span className="text-sm text-[color:var(--app-text)] truncate">
                        {candidate.roleDepartment || "—"}
                      </span>
                    </td>
                    <td className={tableCellClassName}>
                      <span>{candidate.staleDays === 0 ? "Today" : `${candidate.staleDays}d ago`}</span>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {action ? (
                          <Link href={action.href} className={actionPillPrimaryClassName}>
                            {action.label}
                          </Link>
                        ) : null}
                        {candidate.hasResume && candidate.latestResumeStorageKey ? (
                          <a
                            href={`/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(candidate.latestResumeStorageKey)}`}
                            target="_blank"
                            rel="noreferrer"
                            className={actionIconPillClassName}
                            title="Open CV"
                            aria-label="Open CV"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : null}
                        <Link href={`/candidates/${candidate.id}` as Route} className={actionPillSecondaryClassName}>
                          Profile
                        </Link>
                        {rejectConfirming === candidate.id ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/candidates/${candidate.id}`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      fullName: candidate.fullName,
                                      email: candidate.email,
                                      stage: "closed",
                                      finalDecision: "rejected",
                                      nextAction: "none"
                                    })
                                  });
                                  if (res.ok) {
                                    router.refresh();
                                  } else {
                                    setPromoteError(prev => ({ ...prev, [candidate.id]: "Failed to reject candidate" }));
                                  }
                                } catch (err) {
                                  setPromoteError(prev => ({ ...prev, [candidate.id]: err instanceof Error ? err.message : "Unknown error" }));
                                } finally {
                                  setRejectConfirming(null);
                                }
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] text-[color:var(--app-danger)] transition hover:-translate-y-[1px]"
                              title="Confirm rejection"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectConfirming(null)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)] transition hover:-translate-y-[1px]"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRejectConfirming(candidate.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)] transition hover:-translate-y-[1px] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                            title="Reject candidate"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}

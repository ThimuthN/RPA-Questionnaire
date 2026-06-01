"use client";

import Link from "next/link";
import type { Route } from "next";
import { FileText, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { CandidateBulkActionsBar } from "@/components/candidates/CandidateBulkActionsBar";
import { candidateStageLabels, type CandidateStage } from "@/lib/candidates/types";
import {
  getForwardCandidateStages,
  normalizeCandidateStage
} from "@/lib/candidates/stage-workflow";
import type { CandidateWorkspaceItem } from "@/lib/candidates/workspace";

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

const stageActionSelectClassName =
  "h-8 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2.5 text-xs font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] outline-none transition hover:border-[color:var(--app-border-strong)] focus:border-brand-300/50 disabled:opacity-50";

function contextualAction(candidate: CandidateWorkspaceItem) {
  if (candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "View result"
    };
  }

  if (candidate.latestAssessmentStatus === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Send assessment"
    };
  }

  return null;
}

function displayStageLabel(stage: CandidateStage) {
  return stage === "screening" ? "Screening assessment" : candidateStageLabels[stage];
}

function displayStageActionLabel(stage: CandidateStage) {
  if (stage === "screening") return "Move to Screening";
  return `Move to ${displayStageLabel(stage)}`;
}

function finalDecisionLabel(candidate: CandidateWorkspaceItem) {
  if (candidate.finalizedAs === "hired") return "Hired";
  if (candidate.finalizedAs === "rejected") return "Rejected";
  return null;
}

export function CandidateWorkspaceTable({
  rows,
  currentPathAndQuery,
  roleOptions,
  departmentOptions,
  permissions = []
}: {
  rows: CandidateWorkspaceItem[];
  currentPathAndQuery: string;
  roleOptions?: Array<{ id: string; label: string; departmentId?: string }>;
  departmentOptions?: Array<{ id: string; name: string }>;
  permissions?: string[];
}) {
  const router = useRouter();
  const canManageCandidates = permissions.includes("manage_candidates");
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

  async function moveCandidate(candidateId: string, stage: CandidateStage) {
    setPromoting((current) => ({ ...current, [candidateId]: true }));
    setPromoteError((current) => ({ ...current, [candidateId]: "" }));

    try {
      const response = await fetch(`/api/candidates/${candidateId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (!response.ok || data.ok === false || data.error) {
        throw new Error(data.error || data.message || "Failed to move candidate.");
      }
      router.refresh();
    } catch (err) {
      setPromoteError((current) => ({
        ...current,
        [candidateId]: err instanceof Error ? err.message : "Failed to move candidate."
      }));
    } finally {
      setPromoting((current) => ({ ...current, [candidateId]: false }));
    }
  }

  return (
    <form action="/api/candidates/bulk" method="post" className="space-y-4">
      <input type="hidden" name="returnTo" value={currentPathAndQuery} />
      {canManageCandidates ? (
        <CandidateBulkActionsBar
          selectedCount={selectedCandidateIds.length}
          onSelectAll={selectAllOnPage}
          onClearSelection={clearSelection}
          roleOptions={roleOptions}
          departmentOptions={departmentOptions}
        />
      ) : null}

      <div className={tableShellClassName}>
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full table-fixed text-left">
            <thead className={tableHeadClassName}>
              <tr>
                <th scope="col" className="w-12 px-4 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="w-[24%] px-4 py-3 font-medium">Candidate</th>
                <th scope="col" className="w-[13%] px-4 py-3 font-medium">Owner</th>
                <th scope="col" className="w-[19%] px-4 py-3 font-medium">Pipeline</th>
                <th scope="col" className="w-[16%] px-4 py-3 font-medium">Role / department</th>
                <th scope="col" className="w-[8%] px-4 py-3 font-medium">Updated</th>
                <th scope="col" className="w-[15%] px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((candidate) => {
                const action = contextualAction(candidate);
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const stage = normalizeCandidateStage(candidate.stage);
                const forwardStages = getForwardCandidateStages(stage);
                const decision = finalDecisionLabel(candidate);
                return (
                  <tr key={candidate.id} className="min-h-[88px] transition hover:bg-[color:var(--app-table-row-hover)]">
                    <td className={tableCellClassName}>
                      {canManageCandidates ? (
                        <input
                          type="checkbox"
                          name="candidateId"
                          value={candidate.id}
                          checked={isSelected}
                          onChange={() => toggleCandidate(candidate.id)}
                          className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-transparent text-brand-400 cursor-pointer"
                        />
                      ) : null}
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-1">
                        <p className="font-medium text-[color:var(--app-heading)] truncate">{candidate.fullName}</p>
                        <p className="text-xs text-[color:var(--app-muted)] truncate">{candidate.email}</p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span className="truncate">{candidate.hrOwner || "Unassigned"}</span>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-2">
                        {promoteError[candidate.id] && (
                          <p className="text-xs text-[color:var(--app-danger)]">{promoteError[candidate.id]}</p>
                        )}
                        <p className="text-sm font-medium text-[color:var(--app-heading)]">{displayStageLabel(stage)}</p>
                        <CandidateAssessmentPill status={candidate.latestAssessmentStatus} />
                        {decision ? (
                          <StatusPill label={decision} tone={candidate.finalizedAs === "hired" ? "emerald" : "red"} />
                        ) : null}
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-1">
                        <p className="truncate text-sm text-[color:var(--app-text)]">
                          {candidate.roleLabel || candidate.positionAppliedFor || "Role not set"}
                        </p>
                        <p className="truncate text-xs text-[color:var(--app-muted)]">
                          {candidate.departmentName || candidate.roleDepartment || "Department not assigned"}
                        </p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span>{candidate.staleDays === 0 ? "Today" : `${candidate.staleDays}d ago`}</span>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {permissions.includes("promote_candidate") && forwardStages.length > 0 ? (
                          <select
                            aria-label={`Move ${candidate.fullName} to stage`}
                            value=""
                            disabled={promoting[candidate.id]}
                            onChange={(event) => {
                              const nextStage = event.target.value as CandidateStage;
                              if (nextStage) {
                                void moveCandidate(candidate.id, nextStage);
                              }
                            }}
                            className={stageActionSelectClassName}
                          >
                            <option value="">Move...</option>
                            {forwardStages.map((targetStage) => (
                              <option key={targetStage} value={targetStage}>
                                {displayStageActionLabel(targetStage)}
                              </option>
                            ))}
                          </select>
                        ) : null}
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
                            title="Open resume"
                            aria-label="Open resume"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : null}
                        <Link href={`/candidates/${candidate.id}` as Route} className={actionPillSecondaryClassName}>
                          Open profile
                        </Link>
                        {permissions.includes("manage_candidates") && rejectConfirming === candidate.id ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/candidates/${candidate.id}/reject`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({})
                                  });
                                  if (res.ok) {
                                    router.refresh();
                                  } else {
                                    setPromoteError(prev => ({ ...prev, [candidate.id]: "Failed to reject candidate" }));
                                  }
                                } catch (err) {
                                  setPromoteError(prev => ({ ...prev, [candidate.id]: err instanceof Error ? err.message : "Unexpected error" }));
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
                        ) : canManageCandidates ? (
                          <button
                            type="button"
                            onClick={() => setRejectConfirming(candidate.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)] transition hover:-translate-y-[1px] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                            title="Reject candidate"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
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

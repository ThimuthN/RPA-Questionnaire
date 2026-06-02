"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MoreHorizontal, User } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { CandidateBulkActionsBar } from "@/components/candidates/CandidateBulkActionsBar";
import type { CandidateStage } from "@/lib/candidates/types";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";
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

const iconButtonClassName =
  "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]";

const stageActionSelectClassName =
  "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] outline-none transition hover:border-[color:var(--app-border-strong)] focus:border-brand-300/50 disabled:opacity-50";

const quickActionItemClassName =
  "block w-full rounded-[14px] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]";

const quickActionDangerClassName =
  "block w-full rounded-[14px] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-danger)] transition hover:bg-[color:var(--app-danger-soft)]";

function contextualAction(candidate: CandidateWorkspaceItem) {
  if (candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "Open assessment evidence"
    };
  }

  if (candidate.latestAssessmentStatus === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Assign assessment"
    };
  }

  return null;
}

function displayStageActionLabel(stage: CandidateStage) {
  if (stage === "screening") return "Move to Screening";
  return `Move to ${getCandidateStageLabel(stage)}`;
}

function finalDecisionLabel(candidate: CandidateWorkspaceItem) {
  if (candidate.finalizedAs === "hired") return "Hired";
  if (candidate.finalizedAs === "rejected") return "Rejected";
  return null;
}

function resumeHref(candidate: CandidateWorkspaceItem) {
  if (!candidate.hasResume || !candidate.latestResumeStorageKey) return null;
  return `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(candidate.latestResumeStorageKey)}`;
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const validIds = new Set(rows.map((candidate) => candidate.id));
    setSelectedCandidateIds((current) => current.filter((candidateId) => validIds.has(candidateId)));
  }, [rows]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuBtnRef.current && !menuBtnRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };

    const handleScroll = () => {
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

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
                <th scope="col" className="w-10 px-4 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="w-[26%] px-4 py-3 font-medium">Candidate</th>
                <th scope="col" className="w-[12%] px-4 py-3 font-medium">Owner</th>
                <th scope="col" className="w-[21%] px-4 py-3 font-medium">Pipeline</th>
                <th scope="col" className="w-[16%] px-4 py-3 font-medium">Role / department</th>
                <th scope="col" className="w-[7%] px-4 py-3 font-medium">Updated</th>
                <th scope="col" className="w-20 px-4 py-3 font-medium text-right">Quick access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((candidate) => {
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const stage = normalizeCandidateStage(candidate.stage);
                const decision = finalDecisionLabel(candidate);
                const profileHref = `/people/candidates/${candidate.id}` as Route;
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
                        <Link href={profileHref} className="block truncate font-medium text-[color:var(--app-heading)] hover:underline">
                          {candidate.fullName}
                        </Link>
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
                        <p className="text-sm font-medium text-[color:var(--app-heading)]">{getCandidateStageLabel(stage)}</p>
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
                      <div className="flex items-center justify-end gap-2">
                        <Link href={profileHref} className={iconButtonClassName} title="Open profile">
                          <User size={16} />
                        </Link>
                        <button
                          type="button"
                          className={iconButtonClassName}
                          onClick={(e) => {
                            if (openMenuId === candidate.id) {
                              setOpenMenuId(null);
                            } else {
                              const btn = e.currentTarget;
                              const rect = btn.getBoundingClientRect();
                              menuBtnRef.current = btn;
                              setMenuPos({
                                top: rect.bottom + 8,
                                left: rect.right - 256,
                              });
                              setOpenMenuId(candidate.id);
                            }
                          }}
                          title="Quick actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openMenuId && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setOpenMenuId(null)}
        >
          <div
            className="absolute w-64 space-y-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-2 shadow-[var(--app-shadow-soft)]"
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {rows.find((c) => c.id === openMenuId) && (() => {
              const candidate = rows.find((c) => c.id === openMenuId)!;
              const profileHref = `/people/candidates/${candidate.id}` as Route;
              const candidateResumeHref = resumeHref(candidate);
              const action = contextualAction(candidate);
              const stage = normalizeCandidateStage(candidate.stage);
              const forwardStages = getForwardCandidateStages(stage);

              return (
                <>
                  <Link href={profileHref} className={quickActionItemClassName}>
                    Open profile
                  </Link>

                  {candidateResumeHref ? (
                    <a
                      href={candidateResumeHref}
                      target="_blank"
                      rel="noreferrer"
                      className={quickActionItemClassName}
                    >
                      View resume
                    </a>
                  ) : null}

                  {action ? (
                    <Link href={action.href} className={quickActionItemClassName}>
                      {action.label}
                    </Link>
                  ) : null}

                  {permissions.includes("promote_candidate") && forwardStages.length > 0 ? (
                    <label className="block space-y-1 rounded-[14px] px-3 py-2">
                      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                        Move stage
                      </span>
                      <select
                        aria-label={`Move ${candidate.fullName} to stage`}
                        value=""
                        disabled={promoting[candidate.id]}
                        onChange={(event) => {
                          const nextStage = event.target.value as CandidateStage;
                          if (nextStage) {
                            void moveCandidate(candidate.id, nextStage);
                          }
                          setOpenMenuId(null);
                        }}
                        className={stageActionSelectClassName}
                      >
                        <option value="">Choose stage...</option>
                        {forwardStages.map((targetStage) => (
                          <option key={targetStage} value={targetStage}>
                            {displayStageActionLabel(targetStage)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {canManageCandidates ? (
                    rejectConfirming === candidate.id ? (
                      <div className="space-y-1 border-t border-[color:var(--app-border)] pt-2">
                        <p className="px-3 text-xs text-[color:var(--app-muted)]">
                          Confirm rejecting this candidate?
                        </p>
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
                              setOpenMenuId(null);
                            }
                          }}
                          className={quickActionDangerClassName}
                        >
                          Confirm reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectConfirming(null)}
                          className={quickActionItemClassName}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRejectConfirming(candidate.id)}
                        className={quickActionDangerClassName}
                      >
                        Reject candidate
                      </button>
                    )
                  ) : null}
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}
    </form>
  );
}

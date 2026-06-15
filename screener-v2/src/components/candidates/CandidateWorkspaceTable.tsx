"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { getSourceLabel } from "@/lib/candidates/source";
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
  "px-3 py-3.5 text-sm text-[color:var(--app-text)] align-middle border-t border-[color:var(--app-border)]";

const iconButtonClassName =
  "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]";

const quickAccessLinkClassName =
  "inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:-translate-y-[1px] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]";

const quickAccessPrimaryLinkClassName =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-3 py-2 text-xs font-medium text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--app-brand)_24%,transparent)] transition hover:-translate-y-[1px] hover:brightness-105";

const stageActionSelectClassName =
  "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-text)] outline-none transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)] disabled:opacity-50";

const quickActionItemClassName =
  "block w-full rounded-[14px] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]";

const quickActionDangerClassName =
  "block w-full rounded-[14px] px-3 py-2 text-left text-xs font-medium text-[color:var(--app-danger)] transition hover:bg-[color:var(--app-danger-soft)]";

function contextualAction(candidate: CandidateWorkspaceItem, workspaceId?: string, returnTo?: string) {
  if (candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "Open assessment evidence",
      shortLabel: "Evidence"
    };
  }

  if (candidate.latestAssessmentStatus === "none") {
    const href = buildCandidateProfileHref(candidate.id, workspaceId, returnTo) + "&tab=pipeline";
    return {
      href: href as Route,
      label: "Assign assessment",
      shortLabel: "Assign"
    };
  }

  return null;
}

function displayStageActionLabel(stage: CandidateStage) {
  return `Move to ${getCandidateStageLabel(stage)}`;
}

function finalDecisionLabel(candidate: CandidateWorkspaceItem) {
  if (candidate.finalizedAs === "hired") return "Hired";
  if (candidate.finalizedAs === "rejected") return "Rejected";
  return null;
}

function candidateDisplayStage(candidate: CandidateWorkspaceItem): CandidateStage {
  if (candidate.orgStage === "finalized" || candidate.finalizedAs) {
    return "finalized";
  }

  return normalizeCandidateStage(candidate.stage);
}

function resumeHref(candidate: CandidateWorkspaceItem) {
  if (!candidate.hasResume || !candidate.latestResumeStorageKey) return null;
  return `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(candidate.latestResumeStorageKey)}`;
}

function buildCandidateProfileHref(candidateId: string, workspaceId?: string, returnTo?: string): Route {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.set("workspaceId", workspaceId);
  }
  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  const query = params.toString();
  return `/people/candidates/${candidateId}${query ? `?${query}` : ""}` as Route;
}

export function CandidateWorkspaceTable({
  rows,
  currentPathAndQuery,
  workspaceId,
  roleOptions,
  departmentOptions,
  userOptions,
  permissions = []
}: {
  rows: CandidateWorkspaceItem[];
  currentPathAndQuery: string;
  workspaceId?: string;
  roleOptions?: Array<{ id: string; label: string; departmentId?: string }>;
  departmentOptions?: Array<{ id: string; name: string }>;
  userOptions?: Array<{ id: string; name: string; email: string }>;
  permissions?: string[];
}) {
  const router = useRouter();
  const canManageCandidates = permissions.includes("manage_candidates");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [rejectConfirming, setRejectConfirming] = useState<string | null>(null);
  const [promoteError, setPromoteError] = useState<Record<string, string>>({});
  const [promoting, setPromoting] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, maxHeight: 420 });
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const validIds = new Set(rows.map((candidate) => candidate.id));
    setSelectedCandidateIds((current) => current.filter((candidateId) => validIds.has(candidateId)));
  }, [rows]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target) &&
        menuPanelRef.current &&
        !menuPanelRef.current.contains(target)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
          userOptions={userOptions}
        />
      ) : null}

      <div className={tableShellClassName}>
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full table-fixed text-left">
            <thead className={tableHeadClassName}>
              <tr>
                <th scope="col" className="w-10 px-3 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="px-3 py-3 font-medium">Candidate</th>
                <th scope="col" className="w-[16%] px-3 py-3 font-medium">Stage</th>
                <th scope="col" className="hidden w-[15%] px-3 py-3 font-medium lg:table-cell">Role / dept</th>
                <th scope="col" className="hidden w-[12%] px-3 py-3 font-medium xl:table-cell">Assigned</th>
                <th scope="col" className="hidden w-[100px] px-3 py-3 font-medium md:table-cell">Source</th>
                <th scope="col" className="w-[96px] px-3 py-3 font-medium">Updated</th>
                <th scope="col" className="w-[150px] px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((candidate) => {
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const stage = candidateDisplayStage(candidate);
                const decision = finalDecisionLabel(candidate);
                // Use explicit workspace prop, falling back to the candidate's own department
                // so the sidebar stays in department context when navigating from a global view
                const effectiveWorkspaceId = workspaceId ?? candidate.departmentId;
                const action = contextualAction(candidate, effectiveWorkspaceId, currentPathAndQuery);
                const profileHref = buildCandidateProfileHref(candidate.id, effectiveWorkspaceId, currentPathAndQuery);
                return (
                  <tr key={candidate.id} className="min-h-[88px] cursor-pointer transition hover:bg-[color:var(--app-table-row-hover)]">
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
                      <div className="space-y-1.5">
                        {promoteError[candidate.id] && (
                          <p className="text-xs text-[color:var(--app-danger)]">{promoteError[candidate.id]}</p>
                        )}
                        <p className="truncate text-sm font-medium text-[color:var(--app-heading)]" title={getCandidateStageLabel(stage)}>{getCandidateStageLabel(stage)}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <CandidateAssessmentPill status={candidate.latestAssessmentStatus} />
                          {decision ? (
                            <StatusPill label={decision} tone={candidate.finalizedAs === "hired" ? "emerald" : "red"} />
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className={`${tableCellClassName} hidden lg:table-cell`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-[color:var(--app-text)]" title={candidate.roleLabel || candidate.positionAppliedFor || "No role"}>
                          {candidate.roleLabel || candidate.positionAppliedFor || "No role"}
                        </p>
                        <p className="truncate text-xs text-[color:var(--app-muted)]" title={candidate.departmentName || candidate.roleDepartment || "No department"}>
                          {candidate.departmentName || candidate.roleDepartment || "No department"}
                        </p>
                      </div>
                    </td>
                    <td className={`${tableCellClassName} hidden xl:table-cell`}>
                      {candidate.teamOwnerSummary ? (
                        <span className="block truncate text-sm text-[color:var(--app-text)]" title={candidate.teamOwnerSummary}>{candidate.teamOwnerSummary}</span>
                      ) : (
                        <StatusPill label="Unassigned" tone="amber" />
                      )}
                    </td>
                    <td className={`${tableCellClassName} hidden md:table-cell`}>
                      {candidate.resumeSource ? (
                        <span className="inline-flex items-center rounded-full border border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--pill-blue-text)]">
                          {getSourceLabel(candidate.resumeSource)}
                        </span>
                      ) : (
                        <span className="text-xs text-[color:var(--app-muted)] opacity-50">—</span>
                      )}
                    </td>
                    <td className={tableCellClassName}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {candidate.staleDays >= 30 ? (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--app-danger)]" title="Stale: 30+ days inactive" />
                        ) : candidate.staleDays >= 7 ? (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--app-warning)]" title="Stale: 7+ days inactive" />
                        ) : null}
                        <span className={candidate.staleDays >= 30 ? "text-[color:var(--app-danger)]" : candidate.staleDays >= 7 ? "text-[color:var(--app-warning)]" : ""}>
                          {candidate.staleDays === 0 ? "Today" : `${candidate.staleDays}d`}
                        </span>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        {action ? (
                          <Link href={action.href} className={quickAccessPrimaryLinkClassName} title={action.label}>
                            {action.shortLabel}
                          </Link>
                        ) : (
                          <Link href={profileHref} className={quickAccessLinkClassName} title="Open candidate profile">
                            Profile
                          </Link>
                        )}
                        <button
                          type="button"
                          className={iconButtonClassName}
                          onClick={(e) => {
                            if (openMenuId === candidate.id) {
                              setOpenMenuId(null);
                            } else {
                              const btn = e.currentTarget;
                              const rect = btn.getBoundingClientRect();
                              const menuWidth = 256;
                              const preferredHeight = 360;
                              const viewportPadding = 12;
                              const bottomSpace = window.innerHeight - rect.bottom - viewportPadding;
                              const topSpace = rect.top - viewportPadding;
                              const renderAbove = bottomSpace < preferredHeight && topSpace > bottomSpace;
                              const nextTop = renderAbove
                                ? Math.max(viewportPadding, rect.top - Math.min(preferredHeight, topSpace))
                                : Math.max(viewportPadding, rect.bottom + 8);
                              const unclampedLeft = rect.right - menuWidth;
                              const nextLeft = Math.min(
                                window.innerWidth - menuWidth - viewportPadding,
                                Math.max(viewportPadding, unclampedLeft)
                              );
                              menuBtnRef.current = btn;
                              setMenuPos({
                                top: nextTop,
                                left: nextLeft,
                                maxHeight: Math.max(
                                  220,
                                  Math.min(
                                    preferredHeight,
                                    renderAbove ? topSpace : bottomSpace
                                  )
                                )
                              });
                              setOpenMenuId(candidate.id);
                            }
                          }}
                          title="Quick actions"
                          aria-label={`Quick actions for ${candidate.fullName}`}
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
            ref={menuPanelRef}
            className="absolute w-64 space-y-1 overflow-y-auto rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-2 shadow-[var(--app-shadow-soft)]"
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              maxHeight: `${menuPos.maxHeight}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {rows.find((c) => c.id === openMenuId) && (() => {
              const candidate = rows.find((c) => c.id === openMenuId)!;
              const effectiveWorkspaceId = workspaceId ?? candidate.departmentId;
              const profileHref = buildCandidateProfileHref(candidate.id, effectiveWorkspaceId, currentPathAndQuery);
              const candidateResumeHref = resumeHref(candidate);
              const action = contextualAction(candidate, effectiveWorkspaceId, currentPathAndQuery);
              const stage = candidateDisplayStage(candidate);
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
                      <div className="space-y-2">
                        {forwardStages.map((targetStage) => (
                          <button
                            key={targetStage}
                            type="button"
                            disabled={promoting[candidate.id]}
                            onClick={() => {
                              void moveCandidate(candidate.id, targetStage);
                              setOpenMenuId(null);
                            }}
                            className={stageActionSelectClassName}
                          >
                            {displayStageActionLabel(targetStage)}
                          </button>
                        ))}
                      </div>
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

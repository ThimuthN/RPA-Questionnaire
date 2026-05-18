"use client";

import Link from "next/link";
import type { Route } from "next";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { CandidateBulkActionsBar } from "@/components/candidates/CandidateBulkActionsBar";
import { InlineStatusSelect } from "@/components/candidates/InlineStatusSelect";
import { candidateStageLabels } from "@/lib/candidates/types";
import type { CandidateWorkspaceItem } from "@/lib/candidates/workspace";

const tableShellClassName =
  "overflow-hidden rounded-[24px] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]";

const tableHeadClassName =
  "bg-[color:var(--app-surface-soft)] text-left text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)]";

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
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

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
                  <tr key={candidate.id} className="h-[88px] transition hover:bg-[color:var(--app-surface-soft)]/70">
                    <td className={tableCellClassName}>
                      <input
                        type="checkbox"
                        name="candidateId"
                        value={candidate.id}
                        checked={isSelected}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-transparent text-brand-400"
                      />
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-1">
                        <p className="font-medium text-[color:var(--app-heading)]">{candidate.fullName}</p>
                        <p className="text-xs text-[color:var(--app-muted)]">{candidate.roleLabel || "Role not set"}</p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span>{candidate.hrOwner || "Unassigned"}</span>
                    </td>
                    <td className={tableCellClassName}>
                      <div className="space-y-2">
                        <InlineStatusSelect
                          candidateId={candidate.id}
                          currentStatus={candidate.uiStatus}
                          returnTo={currentPathAndQuery}
                        />
                        <p className="text-xs text-[color:var(--app-muted)]">
                          {candidate.currentFocus || candidateStageLabels[candidate.stage]}
                        </p>
                      </div>
                    </td>
                    <td className={tableCellClassName}>
                      <span className="text-sm text-[color:var(--app-text)]">
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

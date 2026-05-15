"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import type { ResultReviewState } from "@/lib/assessment-engine/types";
import { candidateStageLabels, type CandidateUiStatus } from "@/lib/candidates/types";
import { BulkReviewControls } from "@/components/results/BulkReviewControls";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import type { WorkspaceResultRow } from "@/lib/results/workspace";
import type { ResultStatusFilter } from "@/lib/results/triage";

const resultsTableCellClassName = "px-4 py-4 align-middle text-sm";
const actionPillPrimaryClassName =
  "inline-flex items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-3 py-2 text-xs font-medium text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--app-brand)_28%,transparent)] transition hover:-translate-y-[1px] hover:brightness-105";

const actionPillSecondaryClassName =
  "inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:-translate-y-[1px] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]";

function toneForStatus(status: ResultStatusFilter) {
  return status === "pass" ? "emerald" : status === "review" ? "amber" : "red";
}

function linkedStatusLabel(status: CandidateUiStatus) {
  if (status === "moved_forward") return "Advanced";
  if (status === "need_review") return "Needs review";
  if (status === "rejected") return "Closed";
  return "In progress";
}

function reviewStateTone(state: ResultReviewState) {
  if (state === "reviewed") return "emerald";
  if (state === "flagged") return "amber";
  return "neutral";
}

function reviewStateLabel(state: ResultReviewState) {
  if (state === "reviewed") return "Reviewed";
  if (state === "flagged") return "Flagged";
  return "Unreviewed";
}

function buildResultsHref(queryString: string, overrides: Record<string, string | undefined>) {
  const next = new URLSearchParams(queryString);
  for (const [key, value] of Object.entries(overrides)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  const serialized = next.toString();
  return `/results${serialized ? `?${serialized}` : ""}` as Route;
}

function toggleCompareHref(queryString: string, currentCompareIds: string[], attemptId: string) {
  const nextIds = currentCompareIds.includes(attemptId)
    ? currentCompareIds.filter((id) => id !== attemptId)
    : [...currentCompareIds, attemptId].slice(0, 4);
  return buildResultsHref(queryString, {
    compare: nextIds.length > 0 ? nextIds.join(",") : undefined
  });
}

export function ResultsWorkspaceTable({
  rows,
  currentPathAndQuery,
  currentQueryString,
  compareIds
}: {
  rows: WorkspaceResultRow[];
  currentPathAndQuery: string;
  currentQueryString: string;
  compareIds: string[];
}) {
  const [selectedAttemptIds, setSelectedAttemptIds] = useState<string[]>([]);
  const currentCompareIds = compareIds;

  useEffect(() => {
    const validIds = new Set(rows.map((row) => row.attemptId));
    setSelectedAttemptIds((current) => current.filter((attemptId) => validIds.has(attemptId)));
  }, [rows]);

  function toggleAttempt(attemptId: string) {
    setSelectedAttemptIds((current) =>
      current.includes(attemptId)
        ? current.filter((value) => value !== attemptId)
        : [...current, attemptId]
    );
  }

  function selectAllOnPage() {
    setSelectedAttemptIds(rows.map((row) => row.attemptId));
  }

  function clearSelection() {
    setSelectedAttemptIds([]);
  }

  return (
    <form action="/api/results/bulk" method="post" className="space-y-4">
      <input type="hidden" name="returnTo" value={currentPathAndQuery} />
      {selectedAttemptIds.length > 0 ? (
        <StagePanel tone="summary" className="space-y-4">
          <BulkReviewControls
            selectedCount={selectedAttemptIds.length}
            onSelectAll={selectAllOnPage}
            onClearSelection={clearSelection}
          />
        </StagePanel>
      ) : null}

      <StagePanel tone="open" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1140px] w-full table-fixed text-left text-sm">
            <thead
              className="border-b text-[color:var(--app-muted)]"
              style={{
                borderColor: "var(--app-border)",
                background: "var(--app-table-head)"
              }}
            >
              <tr>
                <th className="w-12 px-4 py-3">Select</th>
                <th className="w-[21%] px-4 py-3">Participant</th>
                <th className="w-[17%] px-4 py-3">Assessment</th>
                <th className="w-[11%] px-4 py-3">Score</th>
                <th className="w-[11%] px-4 py-3">Review</th>
                <th className="w-[14%] px-4 py-3">Linked record</th>
                <th className="w-[10%] px-4 py-3">Submitted</th>
                <th className="w-[16%] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedAttemptIds.includes(row.attemptId);
                const stackLabel =
                  row.stacks.length === 0
                    ? "General"
                    : row.stacks.length === 1
                      ? row.stacks[0]
                      : `${row.stacks[0]} +${row.stacks.length - 1}`;
                return (
                  <tr
                    key={row.attemptId}
                    className="h-[88px] align-middle transition hover:bg-[color:var(--app-table-row-hover)]"
                    style={{
                      borderBottom: "1px solid var(--app-border)"
                    }}
                  >
                    <td className={resultsTableCellClassName}>
                      <input
                        type="checkbox"
                        name="attemptId"
                        value={row.attemptId}
                        checked={isSelected}
                        onChange={() => toggleAttempt(row.attemptId)}
                        className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent text-brand-500"
                      />
                    </td>
                    <td className={resultsTableCellClassName}>
                      <div className="space-y-1">
                        <p className="font-medium text-[color:var(--app-heading)]">{row.candidateName || "Unnamed participant"}</p>
                        <p className="truncate text-[color:var(--app-muted)]" title={row.candidateEmail || "No email"}>
                          {row.candidateEmail || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className={resultsTableCellClassName}>
                      <div className="space-y-1">
                        <p className="text-[color:var(--app-heading)]">{row.candidateRoleLabel || row.coreExamRoleLabel || "General assessment"}</p>
                        <p className="truncate text-xs text-[color:var(--app-muted)]" title={stackLabel}>
                          {stackLabel}
                        </p>
                      </div>
                    </td>
                    <td className={resultsTableCellClassName}>
                      <div className="space-y-1 whitespace-nowrap">
                        <p className="font-medium text-[color:var(--app-heading)]">{row.finalPercent.toFixed(1)} / 100</p>
                        <StatusPill label={row.resultStatus} tone={toneForStatus(row.resultStatus)} />
                      </div>
                    </td>
                    <td className={resultsTableCellClassName}>
                      <div className="whitespace-nowrap">
                        <StatusPill label={reviewStateLabel(row.reviewState)} tone={reviewStateTone(row.reviewState)} />
                      </div>
                    </td>
                    <td className={resultsTableCellClassName}>
                      {row.candidateId ? (
                        <div className="space-y-1">
                          <p className="text-[color:var(--app-text)]">{row.candidateOwner || "Linked profile"}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">
                            {row.candidateStage ? candidateStageLabels[row.candidateStage] : row.candidateUiStatus ? linkedStatusLabel(row.candidateUiStatus) : "No stage"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-[color:var(--app-muted)]">Not linked yet</p>
                      )}
                    </td>
                    <td className={resultsTableCellClassName}>
                      <p
                        className="whitespace-nowrap text-[color:var(--app-text)]"
                        title={new Date(row.submittedAt).toLocaleString()}
                      >
                        {new Date(row.submittedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className={resultsTableCellClassName}>
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <Link href={`/results/${row.attemptId}`} className={actionPillPrimaryClassName}>
                          View
                        </Link>
                        {row.candidateId && (
                          <Link href={`/candidates/${row.candidateId}`} className={actionPillSecondaryClassName}>
                            Profile
                          </Link>
                        )}
                        <Link
                          href={toggleCompareHref(currentQueryString, currentCompareIds, row.attemptId)}
                          className={actionPillSecondaryClassName}
                        >
                          {compareIds.includes(row.attemptId) ? "Remove" : "Compare"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </StagePanel>
    </form>
  );
}

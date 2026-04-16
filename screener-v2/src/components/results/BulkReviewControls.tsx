"use client";

import { useState } from "react";
import { resultReviewStateValues, type ResultReviewState } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import {
  candidateNoteTypeLabels,
  candidateNoteTypeValues,
  candidateUiStatusValues
} from "@/lib/candidates/types";

const fieldClass =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2.5 text-sm text-[color:var(--app-text)] outline-none";

const inputClass =
  "w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2.5 text-sm text-[color:var(--app-text)] outline-none";

const linkedStatusLabels: Record<(typeof candidateUiStatusValues)[number], string> = {
  in_progress: "In progress",
  need_review: "Needs review",
  moved_forward: "Advanced",
  rejected: "Closed"
};

const reviewStateLabels: Record<ResultReviewState, string> = {
  unreviewed: "Unreviewed",
  reviewed: "Reviewed",
  flagged: "Flagged"
};

const noteTypeLabels: Record<(typeof candidateNoteTypeValues)[number], string> = {
  screening: "Review",
  interview: "Interview",
  technical: "Technical",
  decision: "Decision",
  general: "General"
};

export function BulkReviewControls({
  selectedCount,
  onSelectAll,
  onClearSelection
}: {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}) {
  const [action, setAction] = useState<"set_review_state" | "assign_owner" | "set_ui_status" | "add_note">("set_review_state");
  if (selectedCount === 0) {
    return null;
  }

  const selectionLabel =
    selectedCount === 1 ? "1 result selected." : `${selectedCount} results selected.`;

  const submitLabel = `Apply to ${selectedCount} selected`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl text-[color:var(--app-heading)]">Bulk actions</h2>
          <p className="text-sm text-[color:var(--app-muted)]">
            Update review state or apply linked profile actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onSelectAll}
          >
            Select all on page
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </div>
      </div>

      <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
        {selectionLabel}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Action</span>
          <select
            name="action"
            value={action}
            onChange={(event) =>
              setAction(event.target.value as "set_review_state" | "assign_owner" | "set_ui_status" | "add_note")
            }
            className={fieldClass}
          >
            <option value="set_review_state">Update review state</option>
            <option value="set_ui_status">Update linked status</option>
            <option value="assign_owner">Assign linked owner</option>
            <option value="add_note">Add linked note</option>
          </select>
        </label>

        {action === "set_review_state" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Review state</span>
            <select name="reviewState" defaultValue="reviewed" className={fieldClass}>
              {resultReviewStateValues.map((state) => (
                <option key={state} value={state}>
                  {reviewStateLabels[state]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {action === "assign_owner" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Linked owner</span>
            <input name="owner" placeholder="Owner or reviewer" className={inputClass} />
          </label>
        ) : null}

        {action === "set_ui_status" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Linked status</span>
            <select name="status" defaultValue="moved_forward" className={fieldClass}>
              {candidateUiStatusValues.map((status) => (
                <option key={status} value={status}>
                  {linkedStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {action === "add_note" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Note type</span>
            <select name="noteType" defaultValue="decision" className={fieldClass}>
              {candidateNoteTypeValues.map((type) => (
                <option key={type} value={type}>
                  {noteTypeLabels[type] ?? candidateNoteTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Apply</span>
          <Button type="submit">
            {submitLabel}
          </Button>
        </div>
      </div>

      {action === "add_note" ? (
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Note</span>
          <textarea
            name="noteBody"
            rows={3}
            placeholder="Add a note to each linked profile selected from this results view."
            className="w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
          />
        </label>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import {
  candidateUiStatusLabels,
  candidateUiStatusValues,
  type CandidateUiStatus
} from "@/lib/candidates/types";

export function CandidateBulkActionsBar({
  selectedCount,
  onClearSelection,
  onSelectAll,
  defaultStatus = "need_review",
  roleOptions,
  departmentOptions
}: {
  selectedCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  defaultStatus?: CandidateUiStatus;
  roleOptions?: Array<{ id: string; label: string }>;
  departmentOptions?: Array<{ id: string; name: string }>;
}) {
  const [action, setAction] = useState<"assign_owner" | "set_ui_status" | "add_note" | "set_department">("assign_owner");

  const helperText = useMemo(() => {
    if (action === "assign_owner") return "Assign an owner to the selected candidates.";
    if (action === "set_ui_status") return "Set the next hiring status for the selected candidates.";
    if (action === "set_department") return "Set the department for the selected candidates.";
    return "Add one note to every selected candidate.";
  }, [action]);

  if (selectedCount === 0) return null;

  return (
    <div className="rounded-[20px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg text-[color:var(--app-heading)]">Bulk actions</h2>
            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
              {selectedCount} selected
            </span>
          </div>
          <p className="text-sm text-[color:var(--app-muted)]">{helperText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onSelectAll}>
            Select all on page
          </Button>
          <Button type="button" variant="ghost" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[200px_minmax(0,1fr)_auto]">
        <select
          name="action"
          value={action}
          onChange={(event) => setAction(event.target.value as typeof action)}
          className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
        >
          <option value="assign_owner">Assign owner</option>
          <option value="set_ui_status">Change status</option>
          <option value="add_note">Add note</option>
          <option value="set_department">Set department</option>
        </select>

        {action === "assign_owner" ? (
          <input
            name="hrOwnerId"
            placeholder="Owner ID"
            className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
          />
        ) : null}

        {action === "set_ui_status" ? (
          <select
            name="status"
            defaultValue={defaultStatus}
            className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
          >
            {candidateUiStatusValues.map((status) => (
              <option key={status} value={status}>
                {candidateUiStatusLabels[status]}
              </option>
            ))}
          </select>
        ) : null}

        {action === "add_note" ? (
          <input
            name="noteBody"
            placeholder="Add one note to all selected candidates"
            className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
          />
        ) : null}

        {action === "set_department" ? (
          <select
            name="departmentId"
            className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]"
          >
            <option value="">Select department...</option>
            {(departmentOptions ?? []).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        ) : null}

        <Button type="submit">
          Apply
        </Button>
      </div>
    </div>
  );
}

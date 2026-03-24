"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import {
  candidateNoteTypeLabels,
  candidateNoteTypeValues,
  candidateUiStatusValues
} from "@/lib/candidates/types";

const fieldClass =
  "w-full rounded-[16px] border border-white/16 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none";

const inputClass =
  "w-full rounded-[16px] border border-white/16 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none";

const linkedStatusLabels: Record<(typeof candidateUiStatusValues)[number], string> = {
  in_progress: "In progress",
  need_review: "Needs review",
  moved_forward: "Advanced",
  rejected: "Closed"
};

const noteTypeLabels: Record<(typeof candidateNoteTypeValues)[number], string> = {
  screening: "Review",
  interview: "Interview",
  technical: "Technical",
  decision: "Decision",
  general: "General"
};

function countSelected(form: HTMLFormElement | null) {
  if (!form) return 0;
  return Array.from(
    form.querySelectorAll<HTMLInputElement>('input[name="attemptId"][type="checkbox"]')
  ).filter((input) => input.checked).length;
}

function setAllSelected(form: HTMLFormElement | null, checked: boolean) {
  if (!form) return 0;
  const inputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[name="attemptId"][type="checkbox"]')
  );
  for (const input of inputs) {
    input.checked = checked;
  }
  return checked ? inputs.length : 0;
}

export function BulkReviewControls({ formId }: { formId: string }) {
  const [action, setAction] = useState<"assign_owner" | "set_ui_status" | "add_note">("set_ui_status");
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const sync = () => setSelectedCount(countSelected(form));
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, [formId]);

  const selectionLabel = useMemo(() => {
    if (selectedCount === 0) return "No results selected.";
    if (selectedCount === 1) return "1 result selected.";
    return `${selectedCount} results selected.`;
  }, [selectedCount]);

  const submitLabel =
    selectedCount > 0 ? `Apply to ${selectedCount} selected` : "Select results to apply";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl text-white">Linked workflow actions</h2>
          <p className="text-sm text-slate-300">
            These actions update linked profile records for selected results. Assessment-only results are unchanged.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const form = document.getElementById(formId) as HTMLFormElement | null;
              setSelectedCount(setAllSelected(form, true));
            }}
          >
            Select all on page
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const form = document.getElementById(formId) as HTMLFormElement | null;
              setSelectedCount(setAllSelected(form, false));
            }}
          >
            Clear selection
          </Button>
        </div>
      </div>

      <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
        {selectionLabel}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Action</span>
          <select
            name="action"
            value={action}
            onChange={(event) =>
              setAction(event.target.value as "assign_owner" | "set_ui_status" | "add_note")
            }
            className={fieldClass}
          >
            <option value="set_ui_status">Update linked status</option>
            <option value="assign_owner">Assign linked owner</option>
            <option value="add_note">Add linked note</option>
          </select>
        </label>

        {action === "assign_owner" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Linked owner</span>
            <input name="owner" placeholder="Owner or reviewer" className={inputClass} />
          </label>
        ) : null}

        {action === "set_ui_status" ? (
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Linked status</span>
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
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Note type</span>
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
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Apply</span>
          <Button type="submit" disabled={selectedCount === 0}>
            {submitLabel}
          </Button>
        </div>
      </div>

      {action === "add_note" ? (
        <label className="grid gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Note</span>
          <textarea
            name="noteBody"
            rows={3}
            placeholder="Add a note to each linked profile selected from this results view."
            className="w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-300/60"
          />
        </label>
      ) : null}
    </div>
  );
}

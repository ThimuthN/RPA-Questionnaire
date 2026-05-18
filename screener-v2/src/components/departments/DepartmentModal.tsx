"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { FormInput } from "@/components/primitives/FormInput";
import { Modal } from "@/components/primitives/Modal";
import type { DepartmentRecord } from "@/lib/db/departments";

export function DepartmentModal({
  mode = "create",
  department,
  created,
  updated,
  error
}: {
  mode?: "create" | "edit";
  department?: DepartmentRecord;
  created?: string;
  updated?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (created || updated || error) setOpen(true);
  }, [created, updated, error]);

  const title = mode === "create" ? "Add department" : "Edit department";
  const subtitle = mode === "create" ? "Create a new department." : "Update department details.";
  const action = mode === "create" ? "/api/departments" : `/api/departments/${department?.id}`;
  const submitLabel = mode === "create" ? "Create department" : "Save department";

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {mode === "create" ? "Add department" : "Edit"}
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-[color:var(--app-muted)]">{subtitle}</p>
        </div>
        <form action={action} method="post" className="space-y-4">
          <FormInput
            name="name"
            label="Name"
            defaultValue={department?.name || ""}
            placeholder="e.g., Engineering"
            required
            minLength={2}
          />

          <FormInput
            name="sortOrder"
            label="Sort order"
            type="number"
            defaultValue={department?.sortOrder?.toString() || "0"}
            placeholder="0"
            min="0"
          />

          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <input
                id="dept-active"
                name="isActive"
                type="checkbox"
                defaultChecked={department?.isActive ?? true}
                className="h-4 w-4 rounded border-[color:var(--app-border)] accent-brand"
              />
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="dept-active">
                Department is active
              </label>
            </div>
          )}

          {created ? <p className="text-sm text-[color:var(--app-success)]">Created {created}.</p> : null}
          {updated ? <p className="text-sm text-[color:var(--app-success)]">Updated {updated}.</p> : null}
          {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

          <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

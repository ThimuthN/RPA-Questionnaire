"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { FormInput } from "@/components/primitives/FormInput";
import { Modal } from "@/components/primitives/Modal";
import type { AppUserRow } from "@/lib/auth/app-auth";

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export function AddUserModal({
  mode = "create",
  user,
  created,
  updated,
  error
}: {
  mode?: "create" | "edit";
  user?: AppUserRow;
  created?: string;
  updated?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  async function loadDepartments() {
    try {
      const response = await fetch("/api/departments", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; departments?: DepartmentOption[] };
      if (Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch {
      // Silently fail - departments are optional
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (created || updated || error) setOpen(true);
  }, [created, updated, error]);

  const title = mode === "create" ? "Add user" : "Edit user";
  const subtitle = mode === "create" ? "Create internal access for a team member." : "Update user profile and permissions.";
  const action = mode === "create" ? "/api/users" : `/api/users/${user?.id}`;
  const submitLabel = mode === "create" ? "Create user" : "Save user";

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {mode === "create" ? "Add member" : "Edit"}
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={title}>
        <div className="space-y-1 mb-4">
          <p className="text-sm text-[color:var(--app-muted)]">{subtitle}</p>
        </div>
        <form action={action} method="post" className="space-y-4">
          <FormInput
            name="name"
            label="Full name"
            defaultValue={user?.name || ""}
            placeholder="John Doe"
          />

          <FormInput
            name="email"
            label="Email"
            type="email"
            defaultValue={user?.email || ""}
            disabled={mode === "edit"}
            placeholder="user@company.com"
            required
          />

          <FormInput
            name="password"
            label="Password"
            type="password"
            defaultValue=""
            placeholder={mode === "create" ? "Min 8 characters" : "Leave blank to keep current"}
            minLength={8}
            required={mode === "create"}
          />

          <FormInput
            name="title"
            label="Job title"
            defaultValue={user?.title || ""}
            placeholder="Senior Recruiter"
          />

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-department">
              Department
            </label>
            <select
              id="user-department"
              name="departmentId"
              defaultValue={user?.departmentId || ""}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="">Select department</option>
              {departments.filter(d => d.isActive).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            name="phone"
            label="Phone"
            type="tel"
            defaultValue={user?.phone || ""}
            placeholder="+1 (555) 123-4567"
          />

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-access-level">
              Access level
            </label>
            <select
              id="user-access-level"
              name="accessLevel"
              defaultValue={user?.accessLevel || "recruiter"}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="recruiter">Recruiter</option>
              <option value="hiring_manager">Hiring Manager</option>
              <option value="interviewer">Interviewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="user-interviewer"
              name="isInterviewer"
              type="checkbox"
              defaultChecked={user?.isInterviewer || false}
              className="h-4 w-4 rounded border-[color:var(--app-border)] accent-brand"
            />
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-interviewer">
              Available for interview assignments
            </label>
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <input
                id="user-active"
                name="isActive"
                type="checkbox"
                defaultChecked={user?.isActive || true}
                className="h-4 w-4 rounded border-[color:var(--app-border)] accent-brand"
              />
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-active">
                Account is active
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

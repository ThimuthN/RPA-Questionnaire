"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/primitives/Button";
import { FormInput } from "@/components/primitives/FormInput";
import { Modal } from "@/components/primitives/Modal";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import type { AppUserRow } from "@/lib/auth/app-auth";

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export function AddUserModal({
  mode = "create",
  user
}: {
  mode?: "create" | "edit";
  user?: AppUserRow;
}) {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function loadDepartments() {
    try {
      const response = await fetch("/api/departments", { cache: "no-store" });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDepartments(data);
      } else if (Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch {
      // Silently fail - departments are optional
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch(action, {
        method: "post",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        setSubmitError(error || "Failed to save user");
        return;
      }

      setOpen(false);
      formRef.current.reset();
      window.location.reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            name="name"
            label="Full name"
            defaultValue={user?.name || ""}
            placeholder="John Doe"
            disabled={isSubmitting}
          />

          <FormInput
            name="email"
            label="Email"
            type="email"
            defaultValue={user?.email || ""}
            disabled={mode === "edit" || isSubmitting}
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
            disabled={isSubmitting}
          />

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-department">
              Department
            </label>
            <select
              id="user-department"
              name="departmentId"
              defaultValue={user?.departmentId || ""}
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            >
              <option value="">Select department</option>
              {departments.filter(d => d.isActive).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              name="roleId"
              defaultValue={user?.roleId || ""}
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            >
              <option value="">Select a role</option>
              {/* Note: Roles will be loaded in Phase 4 */}
            </select>
            <p className="text-xs text-[color:var(--app-muted)]">
              Role assignment will be completed in Phase 4 with department manager roles.
            </p>
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <input
                id="user-active"
                name="isActive"
                type="checkbox"
                defaultChecked={user?.isActive || true}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-[color:var(--app-border)] accent-brand disabled:opacity-50"
              />
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-active">
                Account is active
              </label>
            </div>
          )}

          {submitError && (
            <NotificationBanner tone="error">{submitError}</NotificationBanner>
          )}

          <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

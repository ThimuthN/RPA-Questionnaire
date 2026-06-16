"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type User = { id: string; name: string | null; email: string };
type AssignmentRole =
  | "owner"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "reviewer"
  | "final_approver"
  | "coordinator"
  | "approver";

type AssignmentInput = { role: AssignmentRole; userId?: string; isPrimary?: boolean };

type Props = {
  isOpen: boolean;
  title: string;
  description?: string;
  users: User[];
  availableRoles: AssignmentRole[];
  roleLabels: Record<AssignmentRole, string>;
  currentAssignments?: Array<{ user: { id: string; name: string | null; email: string }; assignmentRole: string; isPrimary: boolean }>;
  onClose: () => void;
  onSubmit: (assignments: AssignmentInput[]) => Promise<void>;
};

function buildInitialAssignments(
  currentAssignments: Props["currentAssignments"],
  availableRoles: AssignmentRole[]
) {
  if (currentAssignments && currentAssignments.length > 0) {
    return currentAssignments.map((assignment) => ({
      role: assignment.assignmentRole as AssignmentRole,
      userId: assignment.user.id,
      isPrimary: assignment.isPrimary
    }));
  }

  return [{ role: availableRoles[0] ?? "recruiter", isPrimary: true }];
}

export function AssignmentModal({
  isOpen,
  title,
  description,
  users,
  availableRoles,
  roleLabels,
  currentAssignments,
  onClose,
  onSubmit
}: Props) {
  const [assignments, setAssignments] = useState<AssignmentInput[]>(
    buildInitialAssignments(currentAssignments, availableRoles)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAssignments(buildInitialAssignments(currentAssignments, availableRoles));
    setError(null);
  }, [availableRoles, currentAssignments, isOpen]);

  if (!isOpen) return null;

  const fallbackRole = availableRoles.find((role) => role !== "owner") ?? availableRoles[0] ?? "recruiter";

  const handleAddRole = () => setAssignments([...assignments, { role: fallbackRole }]);
  const handleRemoveRole = (i: number) => setAssignments(assignments.filter((_, idx) => idx !== i));
  const handleRoleChange = (i: number, role: AssignmentRole) => {
    const a = [...assignments];
    a[i].role = role;
    setAssignments(a);
  };
  const handleUserChange = (i: number, userId: string | undefined) => {
    const a = [...assignments];
    a[i].userId = userId;
    setAssignments(a);
  };
  const handlePrimaryChange = (i: number, isPrimary: boolean) => {
    const a = [...assignments];
    a[i].isPrimary = isPrimary;
    setAssignments(a);
  };

  const handleSubmit = async () => {
    setError(null);
    const valid = assignments.filter((a) => a.userId);
    if (valid.length === 0) {
      setError("Select at least one user");
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(valid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">{title}</h2>
            {description && <p className="mt-1 text-sm text-[color:var(--app-muted)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[color:var(--app-surface-soft)] rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-[color:var(--app-muted)]" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[color:var(--app-heading)]">Assignments</label>
              <Button
                variant="ghost"
                onClick={handleAddRole}
                disabled={isLoading}
                className="px-3 py-2 text-xs"
              >
                Add role
              </Button>
            </div>

            <div className="space-y-3">
              {assignments.map((a, i) => (
                <div key={i} className="flex gap-3 rounded-[16px] bg-[color:var(--app-surface-soft)] p-4">
                  <div className="flex-1 space-y-2">
                    <select
                      value={a.role}
                      onChange={(e) => handleRoleChange(i, e.target.value as AssignmentRole)}
                      className="w-full rounded-[8px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm"
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{roleLabels[role]}</option>
                      ))}
                    </select>

                    <select
                      value={a.userId || ""}
                      onChange={(e) => handleUserChange(i, e.target.value || undefined)}
                      className="w-full rounded-[8px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm"
                    >
                      <option value="">Select user...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name || u.email}</option>
                      ))}
                    </select>

                    {(a.role === "recruiter" || a.role === "owner") && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.isPrimary ?? false}
                          onChange={(e) => handlePrimaryChange(i, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-xs text-[color:var(--app-muted)]">Primary owner</span>
                      </label>
                    )}
                  </div>

                  {assignments.length > 1 && (
                    <button
                      onClick={() => handleRemoveRole(i)}
                      className="p-2 hover:bg-[color:var(--app-surface)] rounded-lg transition"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4 text-[color:var(--app-muted)]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-[16px] border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

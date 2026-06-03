"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { filterRolesByApplicability } from "@/lib/auth/access-role-scope";

interface Department {
  id: string;
  name: string;
  slug: string;
}

interface Role {
  id: string;
  label: string;
  slug: string;
  permissions?: string[];
}

export function GrantAccessModal({
  userId,
  userName,
  departments,
  systemRoles
}: {
  userId: string;
  userName: string;
  departments: Department[];
  systemRoles: Role[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [grantType, setGrantType] = useState<"system" | "department">("system");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // Filter roles by applicability
  const systemApplicableRoles = filterRolesByApplicability(systemRoles, "system");
  const departmentApplicableRoles = filterRolesByApplicability(systemRoles, "department");

  async function handleGrant() {
    setError("");

    if (grantType === "system") {
      if (!systemApplicableRoles.length) {
        setError("No system roles available. Please configure system roles first.");
        return;
      }
      if (!selectedRole) {
        setError("Please select a role");
        return;
      }
      const role = systemApplicableRoles.find(r => r.id === selectedRole);
      if (!role) {
        setError("Invalid role selected");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/access-grants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            grantType: "system",
            roleSlug: role.slug
          })
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to grant access");
          return;
        }

        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedDepartment || !selectedRole) {
        setError("Please select both department and role");
        return;
      }

      const role = departmentApplicableRoles.find(r => r.id === selectedRole);
      if (!role) {
        setError("Invalid role selected");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/access-grants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            grantType: "department",
            departmentId: selectedDepartment,
            roleId: selectedRole
          })
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to grant access");
          return;
        }

        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Grant access
      </Button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setError("");
          setGrantType("system");
          setSelectedDepartment("");
          setSelectedRole("");
        }}
        title={`Grant access to ${userName}`}
      >
        <div className="space-y-4">
          <div className="border-b border-[color:var(--app-border)] pb-4">
            <label className="text-sm font-medium text-[color:var(--app-text)]">
              Grant type
            </label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="system"
                  checked={grantType === "system"}
                  onChange={(e) => setGrantType(e.target.value as "system" | "department")}
                  className="h-4 w-4"
                />
                <span className="text-sm text-[color:var(--app-text)]">System access</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="department"
                  checked={grantType === "department"}
                  onChange={(e) => setGrantType(e.target.value as "system" | "department")}
                  className="h-4 w-4"
                />
                <span className="text-sm text-[color:var(--app-text)]">Department access</span>
              </label>
            </div>
          </div>

          {grantType === "system" ? (
            <div className="space-y-4">
              <p className="text-sm text-[color:var(--app-muted)]">
                System roles grant platform-wide permissions.
              </p>
              <div className="grid gap-1">
                <label className="text-sm font-medium text-[color:var(--app-text)]">Role</label>
                {systemApplicableRoles.length === 0 ? (
                  <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 text-xs text-[color:var(--app-muted)]">
                    No system roles configured. Please set up system roles first.
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isSubmitting}
                    className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] disabled:opacity-50"
                  >
                    <option value="">Select a system role...</option>
                    {systemApplicableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[color:var(--app-muted)]">
                Grant this user access to a specific department workspace.
              </p>
              <div className="grid gap-1">
                <label className="text-sm font-medium text-[color:var(--app-text)]">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] disabled:opacity-50"
                >
                  <option value="">Select department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium text-[color:var(--app-text)]">
                  Access role
                </label>
                {departmentApplicableRoles.length === 0 ? (
                  <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 text-xs text-[color:var(--app-muted)]">
                    No department roles configured.
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isSubmitting || !selectedDepartment}
                    className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] disabled:opacity-50"
                  >
                    <option value="">Select role...</option>
                    {departmentApplicableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {error && <NotificationBanner tone="error">{error}</NotificationBanner>}

          <div className="flex justify-end gap-3 border-t border-[color:var(--app-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleGrant} disabled={isSubmitting}>
              {isSubmitting ? "Granting..." : "Grant access"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

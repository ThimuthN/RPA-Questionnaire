"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormError } from "@/components/primitives/FormError";
import { APP_ACTIONS, APP_ACTION_LABELS, type AppAction } from "@/lib/auth/permissions";

type PermissionOverride = { permission: string; action: string };
type DepartmentRoleOption = { id: string; label: string; permissions: string[] };
type DepartmentUser = {
  id: string;
  name: string | null;
  email: string;
  roleId?: string | null;
  rolePermissions?: string[];
  permissionOverrides?: PermissionOverride[];
};

function resolveEffectivePermissions(rolePermissions: string[], overrides: PermissionOverride[]) {
  const effective = new Set(rolePermissions);
  overrides.forEach((override) => {
    if (override.action === "grant") {
      effective.add(override.permission);
    } else if (override.action === "revoke") {
      effective.delete(override.permission);
    }
  });
  return effective;
}

export function DepartmentUserActions({
  departmentId,
  user,
  roles
}: {
  departmentId: string;
  user: DepartmentUser;
  roles: DepartmentRoleOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(user.roleId ?? "");
  const [permissionValues, setPermissionValues] = useState<string[]>(
    Array.from(resolveEffectivePermissions(user.rolePermissions ?? [], user.permissionOverrides ?? []))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedRole = roles.find((role) => role.id === roleId);
  const selectedRolePermissions = selectedRole?.permissions ?? [];
  const selectedRolePermissionSet = new Set(selectedRolePermissions);
  const permissionValueSet = new Set(permissionValues);

  function updateRole(nextRoleId: string) {
    const nextRole = roles.find((role) => role.id === nextRoleId);
    setRoleId(nextRoleId);
    setPermissionValues(nextRole?.permissions ?? []);
  }

  function togglePermission(permission: AppAction) {
    setPermissionValues((current) =>
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission]
    );
  }

  function openEditor() {
    setRoleId(user.roleId ?? "");
    setPermissionValues(
      Array.from(resolveEffectivePermissions(user.rolePermissions ?? [], user.permissionOverrides ?? []))
    );
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, departmentId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Could not update user.");
      }

      const overrides = APP_ACTIONS.flatMap((permission) => {
        const enabled = permissionValueSet.has(permission);
        const roleDefault = selectedRolePermissionSet.has(permission);
        if (enabled && !roleDefault) return [{ permission, action: "grant" }];
        if (!enabled && roleDefault) return [{ permission, action: "revoke" }];
        return [];
      });

      const permissionResponse = await fetch(`/api/users/${user.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides })
      });
      const permissionData = await permissionResponse.json().catch(() => ({}));
      if (!permissionResponse.ok || permissionData.ok === false) {
        throw new Error(permissionData.message || "Could not update user permissions.");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${user.name || user.email} from this department?`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/departments/${departmentId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Could not remove user.");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={openEditor}>
        Edit
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit department user">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[color:var(--app-heading)]">{user.name || "Unnamed"}</p>
            <p className="text-xs text-[color:var(--app-muted)]">{user.email}</p>
          </div>

          {error ? <FormError message={error} /> : null}

          <label className="grid gap-1">
            <span className="text-sm text-[color:var(--app-text)]">Department role</span>
            <select
              value={roleId}
              onChange={(event) => updateRole(event.target.value)}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="">No role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
            <div>
              <p className="text-sm font-medium text-[color:var(--app-heading)]">User permissions</p>
              <p className="text-xs text-[color:var(--app-muted)]">
                Checked permissions are this user&apos;s effective permissions. An asterisk means it overrides the selected role.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {APP_ACTIONS.map((permission) => {
                const checked = permissionValueSet.has(permission);
                const roleDefault = selectedRolePermissionSet.has(permission);
                const isOverride = checked !== roleDefault;
                return (
                  <label key={permission} className="flex items-center gap-2 text-sm text-[color:var(--app-text)]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission)}
                      className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
                    />
                    <span>
                      {APP_ACTION_LABELS[permission]}
                      {isOverride ? " *" : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <Button type="button" variant="danger" onClick={remove} disabled={saving}>
              Remove
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={save} disabled={saving || !roleId}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

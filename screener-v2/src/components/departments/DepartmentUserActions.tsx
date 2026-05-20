"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormError } from "@/components/primitives/FormError";

export function DepartmentUserActions({
  departmentId,
  user,
  roles
}: {
  departmentId: string;
  user: { id: string; name: string | null; email: string; roleId?: string | null };
  roles: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState(user.roleId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={() => setOpen(true)}>
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
              onChange={(event) => setRoleId(event.target.value)}
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

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormError } from "@/components/primitives/FormError";

export function AssignUserToDeptModal({
  departmentId,
  departmentName
}: {
  departmentId: string;
  departmentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string; departmentId: string | null; dept?: { name: string } | null }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/roles?departmentId=${departmentId}`)
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const usersList = Array.isArray(usersData) ? usersData : usersData.users || [];
          setUsers(usersList.filter((u: any) => u.departmentId !== departmentId));
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setRoles(rolesData.roles || []);
        }
      } catch (err) {
        console.error("Failed to load users or roles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, departmentId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const userId = formData.get("userId") as string;
      const roleId = formData.get("roleId") as string;

      if (!userId || !roleId) {
        setError("Please fill in all fields");
        return;
      }

      const response = await fetch(`/api/departments/${departmentId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign user to department");
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Trigger page refresh to show updated users list
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" className="px-3 py-2 text-xs">
        Add User
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Assign user to department">
        <div className="space-y-1 mb-6">
          <p className="text-sm text-[color:var(--app-muted)]">
            Add an existing user to {departmentName} and assign them a department role.
          </p>
        </div>

        {success && (
          <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 mb-4">
            User assigned successfully!
          </div>
        )}

        {error && <FormError message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="user-select">
              User
            </label>
            <select
              id="user-select"
              name="userId"
              disabled={saving || loading || users.length === 0}
              required
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            >
              <option value="">
                {loading ? "Loading users..." : users.length === 0 ? "No available users" : "Select a user..."}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                  {user.departmentId ? ` - currently in ${user.dept?.name || "another department"}` : " - unassigned"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-[color:var(--app-text)]" htmlFor="role-select">
              Role
            </label>
            <select
              id="role-select"
              name="roleId"
              disabled={saving || loading || roles.length === 0}
              required
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            >
              <option value="">
                {loading ? "Loading roles..." : roles.length === 0 ? "No available roles" : "Select a role..."}
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-4 py-2"
            >
              {saving ? "Assigning..." : "Assign User"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

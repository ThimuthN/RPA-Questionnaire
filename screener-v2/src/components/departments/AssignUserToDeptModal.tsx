"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormError } from "@/components/primitives/FormError";
import { filterRolesByApplicability } from "@/lib/auth/access-role-scope";

type Tab = "add" | "create";

interface User {
  id: string;
  name: string | null;
  email: string;
  departmentId: string | null;
  dept?: { name: string } | null;
}

interface Role {
  id: string;
  label: string;
  slug: string;
  permissions?: string[];
}

export function AssignUserToDeptModal({
  departmentId,
  departmentName
}: {
  departmentId: string;
  departmentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("add");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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
          setUsers(usersList.filter((user: User) => user.departmentId !== departmentId));
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

  async function handleAddExistingUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const userId = formData.get("userId") as string;
      const roleId = formData.get("roleId") as string;

      if (!userId || !roleId) {
        setError("Please fill in all fields");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/access-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          grantType: "department",
          departmentId,
          roleId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add user to team");
      }

      setOpen(false);
      setError("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const roleId = formData.get("roleId") as string;

      if (!email || !password || !roleId) {
        setError("Please fill in all required fields");
        setSaving(false);
        return;
      }

      const createUserForm = new FormData();
      createUserForm.append("name", name || "");
      createUserForm.append("email", email);
      createUserForm.append("password", password);

      const userRes = await fetch("/api/users", {
        method: "POST",
        body: createUserForm
      });

      if (!userRes.ok) {
        const errorText = await userRes.text();
        throw new Error(errorText || "Failed to create user");
      }

      const userData = await userRes.json();
      const newUserId = userData.id;

      const grantRes = await fetch("/api/access-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newUserId,
          grantType: "department",
          departmentId,
          roleId
        })
      });

      if (!grantRes.ok) {
        const data = await grantRes.json();
        throw new Error(data.message || "Failed to grant access");
      }

      setOpen(false);
      setError("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const getAccessRoles = () => {
    // Filter: only access roles with permissions, department-applicable only
    return roles.filter(r =>
      r.permissions &&
      r.permissions.length > 0 &&
      filterRolesByApplicability([r], "department").length > 0
    );
  };

  const accessRoles = getAccessRoles();
  const hasRoles = accessRoles.length > 0;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add team member</Button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setError("");
          setTab("add");
        }}
        title="Add team member"
      >
        <div className="space-y-1 mb-4">
          <p className="text-sm text-[color:var(--app-muted)]">
            Add a team member to the {departmentName} workspace.
          </p>
        </div>

        <div className="border-b border-[color:var(--app-border)] mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTab("add");
                setError("");
              }}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "add"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
              }`}
            >
              Add existing user
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("create");
                setError("");
              }}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "create"
                  ? "border-b-2 border-brand-500 text-brand-500"
                  : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
              }`}
            >
              Create user
            </button>
          </div>
        </div>

        {error && <FormError message={error} />}

        {tab === "add" ? (
          <form onSubmit={handleAddExistingUser} className="space-y-4">
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
                  {loading ? "Loading users..." : users.length === 0 ? "No users available" : "Select a user..."}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="role-select-add">
                Access role
              </label>
              {!hasRoles ? (
                <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 text-xs text-[color:var(--app-muted)]">
                  No access roles configured. Visit the Access page to create roles first.
                </div>
              ) : (
                <select
                  id="role-select-add"
                  name="roleId"
                  disabled={saving || loading || !hasRoles}
                  required
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                >
                  <option value="">Select a role...</option>
                  {accessRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-[color:var(--app-border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !hasRoles}>
                {saving ? "Adding..." : "Add user"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]">Full name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                disabled={saving}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]">Email</label>
              <input
                type="email"
                name="email"
                placeholder="user@company.com"
                required
                disabled={saving}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min 8 characters"
                minLength={8}
                required
                disabled={saving}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-sm text-[color:var(--app-text)]" htmlFor="role-select-create">
                Access role
              </label>
              {!hasRoles ? (
                <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 text-xs text-[color:var(--app-muted)]">
                  No access roles configured. Visit the Access page to create roles first.
                </div>
              ) : (
                <select
                  id="role-select-create"
                  name="roleId"
                  disabled={saving || !hasRoles}
                  required
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                >
                  <option value="">Select a role...</option>
                  {accessRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-[color:var(--app-border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !hasRoles}>
                {saving ? "Creating..." : "Create and add"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

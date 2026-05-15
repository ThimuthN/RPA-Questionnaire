"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormInput } from "@/components/primitives/FormInput";
import { FormError } from "@/components/primitives/FormError";
import { DataTable } from "@/components/primitives/DataTable";
import { DEFAULT_DEPARTMENTS, getDepartmentOptions } from "@/lib/roles/departments";
import type { RolePickerOption } from "@/components/roles/RolePicker";

interface EditorState {
  id?: string;
  label: string;
  department: string;
  isActive: boolean;
  openJobCount?: number;
  pipelineCandidateCount?: number;
}

const emptyEditor: EditorState = {
  label: "",
  department: "",
  isActive: true
};

export function RoleCatalogSection({ initialRoles = [] }: { initialRoles?: RolePickerOption[] }) {
  const [roles, setRoles] = useState<RolePickerOption[]>(initialRoles);
  const [loading, setLoading] = useState(initialRoles.length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRoles.length === 0) {
      loadRoles();
    }
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const response = await fetch("/api/roles", { cache: "no-store" });
      const data = (await response.json()) as { ok: boolean; roles?: RolePickerOption[] };
      if (data.ok && Array.isArray(data.roles)) {
        setRoles(data.roles);
      }
    } catch {
      setError("Could not load roles.");
    } finally {
      setLoading(false);
    }
  }

  function beginCreate() {
    setEditor(emptyEditor);
    setError("");
    setModalOpen(true);
  }

  function beginEdit(role: RolePickerOption) {
    setEditor({
      id: role.id,
      label: role.label,
      department: role.department ?? "",
      isActive: role.isActive ?? true,
      openJobCount: role.openJobCount,
      pipelineCandidateCount: role.pipelineCandidateCount
    });
    setError("");
    setModalOpen(true);
  }

  async function saveRole() {
    if (!editor.label.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editor.id ? `/api/roles/${editor.id}` : "/api/roles", {
        method: editor.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editor.label.trim(),
          department: editor.department.trim() || undefined,
          isActive: editor.isActive
        })
      });

      const data = (await response.json()) as { ok: boolean; role?: RolePickerOption; message?: string };

      if (!data.ok || !data.role) {
        setError(data.message || "Could not save role.");
        return;
      }

      await loadRoles();
      setModalOpen(false);
      setEditor(emptyEditor);
      setError("");
    } catch {
      setError("Could not save role. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole() {
    if (!editor.id) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/roles/${editor.id}`, {
        method: "DELETE"
      });

      const data = (await response.json()) as { ok: boolean; message?: string };

      if (!data.ok) {
        setError(data.message || "Could not delete role.");
        return;
      }

      await loadRoles();
      setModalOpen(false);
      setEditor(emptyEditor);
      setError("");
    } catch {
      setError("Could not delete role. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  }

  const deptOptions = getDepartmentOptions(roles.map((r) => r.department));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-[color:var(--app-heading)]">Roles</h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Create roles to organize candidates by position and department.
          </p>
        </div>
        <Button onClick={beginCreate}>New role</Button>
      </div>

      {error && <p className="text-sm text-[color:var(--app-danger)]">{error}</p>}

      {loading ? (
        <p className="text-sm text-[color:var(--app-muted)]">Loading roles...</p>
      ) : (
        <DataTable
          columns={[
            {
              header: "Role",
              width: "w-[30%]",
              render: (role) => <p className="text-sm font-medium text-[color:var(--app-heading)]">{role.label}</p>
            },
            {
              header: "Department",
              width: "w-[30%]",
              render: (role) => <p className="text-sm text-[color:var(--app-text)]">{role.department || "—"}</p>
            },
            {
              header: "In use",
              width: "w-[20%]",
              render: (role) =>
                (role.openJobCount ?? 0) > 0 || (role.pipelineCandidateCount ?? 0) > 0
                  ? `${role.openJobCount ?? 0} job(s) · ${role.pipelineCandidateCount ?? 0} candidate(s)`
                  : "—"
            },
            {
              header: "Actions",
              width: "w-[20%]",
              render: (role) => (
                <div className="text-right">
                  <Button variant="secondary" onClick={() => beginEdit(role)}>
                    Edit
                  </Button>
                </div>
              )
            }
          ]}
          data={roles}
          emptyMessage="No roles yet. Create your first role to get started."
        />
      )}

      <Modal
        isOpen={modalOpen}
        title={editor.id ? "Edit role" : "Create role"}
        onClose={() => {
          setModalOpen(false);
          setEditor(emptyEditor);
          setError("");
        }}
        footer={
          <>
            {editor.id && (
              <Button
                type="button"
                variant="danger"
                onClick={deleteRole}
                disabled={deleting || saving || (editor.openJobCount ?? 0) > 0 || (editor.pipelineCandidateCount ?? 0) > 0}
              >
                {deleting ? "Deleting..." : "Delete role"}
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditor(emptyEditor);
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={saveRole} disabled={saving}>
                {saving ? "Saving..." : editor.id ? "Save changes" : "Create role"}
              </Button>
            </div>
          </>
        }
      >
        <FormInput
          label="Role name"
          value={editor.label}
          onChange={(e) => setEditor((current) => ({ ...current, label: e.target.value }))}
          placeholder="e.g. Senior Backend Engineer"
        />

        <div className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Department</span>
          <input
            list="role-depts"
            value={editor.department}
            onChange={(e) => setEditor((current) => ({ ...current, department: e.target.value }))}
            placeholder="e.g. Engineering"
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)]"
          />
          <datalist id="role-depts">
            {deptOptions.map((dept) => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
        </div>

        {editor.id && (
          <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
            <input
              type="checkbox"
              checked={editor.isActive}
              onChange={(e) => setEditor((current) => ({ ...current, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            Active
          </label>
        )}

        <FormError message={error} />
      </Modal>
    </div>
  );
}

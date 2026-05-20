"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Modal } from "@/components/primitives/Modal";
import { FormInput } from "@/components/primitives/FormInput";
import { FormError } from "@/components/primitives/FormError";
import { DataTable } from "@/components/primitives/DataTable";
import type { RolePickerOption } from "@/components/roles/RolePicker";

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface EditorState {
  id?: string;
  label: string;
  departmentId: string;
  description: string;
  experienceLevel: string;
  requirements: string;
  isActive: boolean;
  openJobCount?: number;
  pipelineCandidateCount?: number;
}

const emptyEditor: EditorState = {
  label: "",
  departmentId: "",
  description: "",
  experienceLevel: "",
  requirements: "",
  isActive: true
};

export function RoleCatalogSection({
  initialRoles = [],
  departmentId
}: {
  initialRoles?: RolePickerOption[];
  departmentId?: string;
}) {
  const [roles, setRoles] = useState<RolePickerOption[]>(initialRoles);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(initialRoles.length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
    if (initialRoles.length === 0) {
      loadRoles();
    }
    loadDepartments();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const params = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : "";
      const response = await fetch(`/api/roles${params}`, { cache: "no-store" });
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
    setEditor({ ...emptyEditor, departmentId: departmentId ?? "" });
    setError("");
    setModalOpen(true);
  }

  function beginEdit(role: RolePickerOption) {
    setEditor({
      id: role.id,
      label: role.label,
      departmentId: role.departmentId ?? "",
      description: role.description ?? "",
      experienceLevel: role.experienceLevel ?? "",
      requirements: role.requirements ?? "",
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
          departmentId: editor.departmentId || undefined,
          description: editor.description.trim(),
          experienceLevel: editor.experienceLevel || undefined,
          requirements: editor.requirements.trim(),
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
              render: (role) => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{role.label}</p>
                  {role.experienceLevel ? (
                    <p className="text-xs capitalize text-[color:var(--app-muted)]">{role.experienceLevel}</p>
                  ) : null}
                </div>
              )
            },
            {
              header: "Department",
              width: "w-[30%]",
              render: (role) => <p className="text-sm text-[color:var(--app-text)]">{role.departmentName || role.department || "—"}</p>
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
          <select
            value={editor.departmentId}
            onChange={(e) => setEditor((current) => ({ ...current, departmentId: e.target.value }))}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)]"
          >
            <option value="">Select department</option>
            {departments.filter(d => d.isActive).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Description</span>
          <textarea
            value={editor.description}
            onChange={(e) => setEditor((current) => ({ ...current, description: e.target.value }))}
            placeholder="What this role does in the organization."
            rows={3}
            className="min-h-[92px] rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)]"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Experience level</span>
          <select
            value={editor.experienceLevel}
            onChange={(e) => setEditor((current) => ({ ...current, experienceLevel: e.target.value }))}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)]"
          >
            <option value="">Not specified</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Requirements</span>
          <textarea
            value={editor.requirements}
            onChange={(e) => setEditor((current) => ({ ...current, requirements: e.target.value }))}
            placeholder="Skills, qualifications, and expectations."
            rows={4}
            className="min-h-[110px] rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)]"
          />
        </label>

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

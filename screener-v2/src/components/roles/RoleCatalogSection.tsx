"use client";

import { useEffect, useState } from "react";
import type { RoleId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { DEFAULT_DEPARTMENTS, getDepartmentOptions } from "@/lib/roles/departments";
import type { RolePickerOption } from "@/components/roles/RolePicker";

const LEVEL_LABELS: Record<RoleId, string> = {
  "Intern": "Intern",
  "Associate": "Associate",
  "SE": "Senior",
  "SeniorSE": "Senior+",
  "TechLead": "Lead"
};

interface EditorState {
  id?: string;
  label: string;
  department: string;
  coreBasisRoleId: RoleId;
  isActive: boolean;
}

const emptyEditor: EditorState = {
  label: "",
  department: "",
  coreBasisRoleId: "Associate",
  isActive: true
};

export function RoleCatalogSection({ initialRoles = [] }: { initialRoles?: RolePickerOption[] }) {
  const [roles, setRoles] = useState<RolePickerOption[]>(initialRoles);
  const [loading, setLoading] = useState(initialRoles.length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
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
      coreBasisRoleId: role.coreBasisRoleId,
      isActive: role.isActive ?? true
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
          coreBasisRoleId: editor.coreBasisRoleId,
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

  const deptOptions = getDepartmentOptions(roles.map((r) => r.department));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-[color:var(--app-heading)]">Roles</h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Create roles that link jobs to assessment difficulty levels.
          </p>
        </div>
        <Button onClick={beginCreate}>New role</Button>
      </div>

      {error && <p className="text-sm text-[color:var(--app-danger)]">{error}</p>}

      {loading ? (
        <p className="text-sm text-[color:var(--app-muted)]">Loading roles...</p>
      ) : roles.length === 0 ? (
        <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 text-sm text-[color:var(--app-muted)]">
          No roles yet. Create your first role to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full">
              <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                <tr>
                  <th className="w-[35%] px-4 py-3 text-left font-medium">Role</th>
                  <th className="w-[25%] px-4 py-3 text-left font-medium">Department</th>
                  <th className="w-[20%] px-4 py-3 text-left font-medium">Level</th>
                  <th className="w-[20%] px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-table-row-hover)]">
                    <td className="px-4 py-3 text-[color:var(--app-heading)]">{role.label}</td>
                    <td className="px-4 py-3 text-[color:var(--app-text)]">{role.department || "—"}</td>
                    <td className="px-4 py-3 text-[color:var(--app-text)]">
                      {LEVEL_LABELS[role.coreBasisRoleId] || role.coreBasisRoleId}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" size="sm" onClick={() => beginEdit(role)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "var(--app-modal-overlay)" }}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]" style={{ background: "var(--app-modal-surface)" }}>
            <div className="border-b border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-header)" }}>
              <h3 className="text-xl text-[color:var(--app-heading)]">{editor.id ? "Edit role" : "Create role"}</h3>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6" style={{ background: "var(--app-modal-body)" }}>
              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Role name</span>
                <input
                  value={editor.label}
                  onChange={(e) => setEditor((current) => ({ ...current, label: e.target.value }))}
                  placeholder="e.g. Senior Backend Engineer"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Department</span>
                <input
                  list="role-depts"
                  value={editor.department}
                  onChange={(e) => setEditor((current) => ({ ...current, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
                <datalist id="role-depts">
                  {deptOptions.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-[color:var(--app-text)]">Assessment level</span>
                <select
                  value={editor.coreBasisRoleId}
                  onChange={(e) => setEditor((current) => ({ ...current, coreBasisRoleId: e.target.value as RoleId }))}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                >
                  <option value="Intern">Intern</option>
                  <option value="Associate">Associate (Standard)</option>
                  <option value="SE">Senior Engineer</option>
                  <option value="SeniorSE">Senior Engineer+ (Advanced)</option>
                  <option value="TechLead">Tech Lead (Expert)</option>
                </select>
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

              {error && <p className="text-sm text-[color:var(--app-danger)]">{error}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-footer)" }}>
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
          </div>
        </div>
      )}
    </div>
  );
}

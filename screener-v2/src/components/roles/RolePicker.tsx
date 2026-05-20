"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";

export interface RolePickerOption {
  id: string;
  label: string;
  departmentId?: string;
  departmentName?: string;
  department?: string; // Backward compatibility
  description?: string;
  experienceLevel?: string;
  requirements?: string;
  permissions?: string[];
  isActive?: boolean;
  openJobCount?: number;
  pipelineCandidateCount?: number;
}

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

type EditorState = {
  id?: string;
  label: string;
  departmentId: string;
  description: string;
  experienceLevel: string;
  requirements: string;
  isActive: boolean;
};

const emptyEditor: EditorState = {
  label: "",
  departmentId: "",
  description: "",
  experienceLevel: "",
  requirements: "",
  isActive: true
};

export function RolePicker({
  name,
  label,
  value,
  defaultValue,
  initialOptions,
  placeholder = "Select role",
  helperText,
  onChange,
  departmentId,
  className,
  layout = "inline"
}: {
  name?: string;
  label?: string;
  value?: RolePickerOption | null;
  defaultValue?: RolePickerOption | null;
  initialOptions?: RolePickerOption[];
  placeholder?: string;
  helperText?: string;
  onChange?: (next: RolePickerOption | null) => void;
  departmentId?: string | null;
  className?: string;
  layout?: "inline" | "stacked";
}) {
  const hasInitialOptions = (initialOptions?.length ?? 0) > 0;
  const [options, setOptions] = useState<RolePickerOption[]>(initialOptions ?? []);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(!hasInitialOptions);
  const [mounted, setMounted] = useState(false);
  const [internalValue, setInternalValue] = useState<RolePickerOption | null>(defaultValue ?? null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
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

  async function loadRoles({ keepCurrentOptions = false }: { keepCurrentOptions?: boolean } = {}) {
    if (!keepCurrentOptions) {
      setLoading(true);
    }
    try {
      const params = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : "";
      const response = await fetch(`/api/roles${params}`, { cache: "no-store" });
      const data = (await response.json()) as { ok: boolean; roles?: RolePickerOption[]; message?: string };
      if (data.ok && Array.isArray(data.roles)) {
        setOptions(data.roles);
        setError("");
      } else {
        setError(data.message || "Could not load roles.");
      }
    } catch {
      setError("Could not load roles. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoles({ keepCurrentOptions: hasInitialOptions });
    void loadDepartments();
  }, [hasInitialOptions, departmentId]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!managerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [managerOpen]);

  const selectedRole = value !== undefined ? value : internalValue;
  const selectableOptions = options.filter(
    (option) =>
      (option.isActive !== false || option.id === selectedRole?.id) &&
      (!departmentId || option.departmentId === departmentId || option.id === selectedRole?.id)
  );

  const selectedValue = useMemo(() => {
    if (!selectedRole?.id) return "";
    return options.find((option) => option.id === selectedRole.id)?.id ?? selectedRole.id;
  }, [options, selectedRole]);

  function commit(next: RolePickerOption | null) {
    if (value === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function beginCreate() {
    setEditor(emptyEditor);
    setError("");
  }

  function beginEdit(role: RolePickerOption) {
    setEditor({
      id: role.id,
      label: role.label,
      departmentId: role.departmentId ?? "",
      description: role.description ?? "",
      experienceLevel: role.experienceLevel ?? "",
      requirements: role.requirements ?? "",
      isActive: role.isActive ?? true
    });
    setError("");
  }

  async function saveRole() {
    const payload = {
      label: editor.label.trim(),
      departmentId: editor.departmentId,
      description: editor.description.trim(),
      experienceLevel: editor.experienceLevel,
      requirements: editor.requirements.trim(),
      isActive: editor.isActive
    };

    if (!payload.label) {
      setError("Enter a role name.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editor.id ? `/api/roles/${editor.id}` : "/api/roles", {
        method: editor.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as {
        ok: boolean;
        role?: RolePickerOption;
        message?: string;
      };

      if (!data.ok || !data.role) {
        setError(data.message || "Could not save role.");
        return;
      }

      await loadRoles();
      commit(data.role);
      beginEdit(data.role);
    } catch {
      setError("Could not save role. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const managerModal =
    mounted && managerOpen
      ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "var(--app-modal-overlay)" }}>
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]" style={{ background: "var(--app-modal-surface)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4 md:px-6" style={{ background: "var(--app-modal-header)" }}>
                <div>
                  <h3 className="text-xl text-[color:var(--app-heading)]">Manage roles</h3>
                  <p className="text-sm text-[color:var(--app-muted)]">
                    Add the role names and departments you want to use when registering candidates.
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setManagerOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="grid min-h-0 flex-1 gap-5 overflow-hidden p-5 md:p-6 lg:grid-cols-[0.95fr_1.05fr]" style={{ background: "var(--app-modal-body)" }}>
                <div className="flex min-h-0 flex-col space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[color:var(--app-text)]">Role catalog</p>
                    <Button type="button" variant="secondary" onClick={beginCreate}>
                      New role
                    </Button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {options.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => beginEdit(role)}
                        className={`w-full rounded-[18px] border p-4 text-left transition ${
                          editor.id === role.id
                            ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)]"
                            : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <p className="text-sm text-[color:var(--app-heading)]">{role.label}</p>
                              <p className="text-xs text-[color:var(--app-muted)]">
                                {role.departmentName || role.department || "No department"}
                              </p>
                            </div>
                          <span className="text-xs text-[color:var(--app-muted)]">{role.isActive === false ? "Inactive" : "Active"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 overflow-y-auto rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                        {editor.id ? "Edit role" : "Create role"}
                      </p>
                      <h4 className="text-lg text-[color:var(--app-heading)]">
                        {editor.id ? "Update role details" : "Add a role to the catalog"}
                      </h4>
                    </div>

                    <label className="grid gap-1">
                      <span className="text-sm text-[color:var(--app-text)]">Role name</span>
                      <input
                        value={editor.label}
                        onChange={(event) => setEditor((current) => ({ ...current, label: event.target.value }))}
                        placeholder="Senior Backend Engineer"
                        className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-[color:var(--app-text)]">Department</span>
                      <select
                        value={editor.departmentId}
                        onChange={(event) => setEditor((current) => ({ ...current, departmentId: event.target.value }))}
                        className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      >
                        <option value="">Select department</option>
                        {departments.filter(d => d.isActive).map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-[color:var(--app-text)]">Description</span>
                      <textarea
                        value={editor.description}
                        onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
                        placeholder="What this role does in the organization."
                        rows={3}
                        className="min-h-[92px] rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-[color:var(--app-text)]">Experience level</span>
                      <select
                        value={editor.experienceLevel}
                        onChange={(event) => setEditor((current) => ({ ...current, experienceLevel: event.target.value }))}
                        className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
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
                        onChange={(event) => setEditor((current) => ({ ...current, requirements: event.target.value }))}
                        placeholder="Skills, qualifications, and expectations."
                        rows={4}
                        className="min-h-[110px] rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
                      <input
                        type="checkbox"
                        checked={editor.isActive}
                        onChange={(event) => setEditor((current) => ({ ...current, isActive: event.target.checked }))}
                        className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
                      />
                      Active in the catalog
                    </label>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={beginCreate}>
                        Reset
                      </Button>
                      <Button type="button" onClick={saveRole} disabled={saving}>
                        {saving ? "Saving..." : editor.id ? "Save changes" : "Create role"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={className}>
      {label ? <span className="text-sm text-[color:var(--app-text)]">{label}</span> : null}
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}

      <div className="mt-1 space-y-3">
        <div className={layout === "stacked" ? "space-y-3" : "flex flex-col gap-3 md:flex-row md:items-start"}>
          <select
            value={selectedValue}
            onChange={(event) => {
              const next = options.find((option) => option.id === event.target.value) ?? null;
              commit(next);
            }}
            className={`min-w-0 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
              layout === "stacked" ? "w-full" : "flex-1"
            }`}
            disabled={loading}
          >
            <option value="">{loading ? "Loading roles..." : placeholder}</option>
            {selectableOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.departmentName ? `${option.label} - ${option.departmentName}` : option.department ? `${option.label} - ${option.department}` : option.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="secondary"
            className={layout === "stacked" ? "w-full justify-center" : "md:shrink-0"}
            onClick={() => {
              setManagerOpen(true);
              beginCreate();
            }}
          >
            Manage roles
          </Button>
        </div>

        {selectedRole ? (
          <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-xs text-[color:var(--app-muted)]">
            {selectedRole.departmentName ? `${selectedRole.label} - ${selectedRole.departmentName}` : selectedRole.department ? `${selectedRole.label} - ${selectedRole.department}` : selectedRole.label}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {helperText ? <p className="text-xs text-[color:var(--app-muted)]">{helperText}</p> : null}
        </div>

        {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}
      </div>

      {managerModal}
    </div>
  );
}

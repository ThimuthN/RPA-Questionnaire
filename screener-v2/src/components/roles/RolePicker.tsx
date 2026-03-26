"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import type { RoleId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";

const basisLabels: Record<RoleId, string> = {
  Intern: "Intern",
  Associate: "Associate",
  SE: "Software Engineer",
  SeniorSE: "Senior Software Engineer",
  TechLead: "Tech Lead"
};

export interface RolePickerOption {
  id: string;
  label: string;
  department?: string;
  isActive?: boolean;
  coreBasisRoleId: RoleId;
}

type EditorState = {
  id?: string;
  label: string;
  department: string;
  coreBasisRoleId: RoleId;
  isActive: boolean;
};

const emptyEditor: EditorState = {
  label: "",
  department: "",
  coreBasisRoleId: "Associate",
  isActive: true
};

export function RolePicker({
  name,
  label,
  value,
  defaultValue,
  placeholder = "Select role",
  helperText,
  onChange,
  className
}: {
  name?: string;
  label?: string;
  value?: RolePickerOption | null;
  defaultValue?: RolePickerOption | null;
  placeholder?: string;
  helperText?: string;
  onChange?: (next: RolePickerOption | null) => void;
  className?: string;
}) {
  const [options, setOptions] = useState<RolePickerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [internalValue, setInternalValue] = useState<RolePickerOption | null>(defaultValue ?? null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadRoles() {
    setLoading(true);
    const response = await fetch("/api/roles", { cache: "no-store" });
    const data = (await response.json()) as { ok: boolean; roles?: RolePickerOption[]; message?: string };
    if (data.ok && Array.isArray(data.roles)) {
      setOptions(data.roles);
      setError("");
    } else {
      setError(data.message || "Could not load roles.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadRoles();
  }, []);

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
  const selectableOptions = options.filter((option) => option.isActive !== false || option.id === selectedRole?.id);

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
      department: role.department ?? "",
      coreBasisRoleId: role.coreBasisRoleId,
      isActive: role.isActive ?? true
    });
    setError("");
  }

  async function saveRole() {
    const payload = {
      label: editor.label.trim(),
      department: editor.department.trim(),
      coreBasisRoleId: editor.coreBasisRoleId,
      isActive: editor.isActive
    };

    if (!payload.label) {
      setError("Enter a role name.");
      return;
    }

    setSaving(true);
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
    setSaving(false);

    if (!data.ok || !data.role) {
      setError(data.message || "Could not save role.");
      return;
    }

    await loadRoles();
    commit(data.role);
    beginEdit(data.role);
  }

  const managerModal =
    mounted && managerOpen
      ? createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-950/78 p-4 backdrop-blur-md">
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,27,40,0.985),rgba(14,19,30,0.99))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
                <div>
                  <h3 className="text-xl text-white">Manage roles</h3>
                  <p className="text-sm text-slate-300">
                    Create titles, group them by department, and choose the assessment basis behind each one.
                  </p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setManagerOpen(false)}>
                  Close
                </Button>
              </div>

              <div className="grid min-h-0 flex-1 gap-5 overflow-hidden p-5 md:p-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex min-h-0 flex-col space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-200">Role catalog</p>
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
                            ? "border-brand-300/45 bg-brand-500/10"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm text-white">{role.label}</p>
                            <p className="text-xs text-slate-400">
                              {role.department || "No department"} - {basisLabels[role.coreBasisRoleId]}
                            </p>
                          </div>
                          <span className="text-xs text-slate-400">{role.isActive === false ? "Inactive" : "Active"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 overflow-y-auto rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {editor.id ? "Edit role" : "Create role"}
                      </p>
                      <h4 className="text-lg text-white">
                        {editor.id ? "Update role details" : "Add a role to the catalog"}
                      </h4>
                    </div>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Role name</span>
                      <input
                        value={editor.label}
                        onChange={(event) => setEditor((current) => ({ ...current, label: event.target.value }))}
                        placeholder="Senior Backend Engineer"
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Department</span>
                      <input
                        value={editor.department}
                        onChange={(event) => setEditor((current) => ({ ...current, department: event.target.value }))}
                        placeholder="Engineering"
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      />
                    </label>

                    <label className="grid gap-1">
                      <span className="text-sm text-slate-200">Assessment basis</span>
                      <select
                        value={editor.coreBasisRoleId}
                        onChange={(event) =>
                          setEditor((current) => ({ ...current, coreBasisRoleId: event.target.value as RoleId }))
                        }
                        className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                      >
                        {Object.entries(basisLabels).map(([basisValue, basisLabel]) => (
                          <option key={basisValue} value={basisValue}>
                            {basisLabel}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={editor.isActive}
                        onChange={(event) => setEditor((current) => ({ ...current, isActive: event.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-ink-950 text-brand-400"
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
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}

      <div className="mt-1 space-y-3">
        <select
          value={selectedValue}
          onChange={(event) => {
            const next = options.find((option) => option.id === event.target.value) ?? null;
            commit(next);
          }}
          className="w-full rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
          disabled={loading}
        >
          <option value="">{loading ? "Loading roles..." : placeholder}</option>
          {selectableOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.department ? `${option.label} - ${option.department}` : option.label}
            </option>
          ))}
        </select>

        {selectedRole ? (
          <div className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
            {selectedRole.department ? `${selectedRole.department} - ` : ""}
            Assessment basis: {basisLabels[selectedRole.coreBasisRoleId]}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setManagerOpen(true);
              beginCreate();
            }}
          >
            Manage roles
          </Button>
        </div>

        {error ? <p className="text-sm text-red-200">{error}</p> : null}
      </div>

      {managerModal}
    </div>
  );
}

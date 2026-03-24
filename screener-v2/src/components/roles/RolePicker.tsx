"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoleId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";

export interface RolePickerOption {
  id: string;
  label: string;
  coreBasisRoleId: RoleId;
}

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
  const [internalValue, setInternalValue] = useState<RolePickerOption | null>(defaultValue ?? null);
  const [openCreate, setOpenCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCoreBasisRoleId, setNewCoreBasisRoleId] = useState<RoleId>("Associate");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const response = await fetch("/api/roles", { cache: "no-store" });
      const data = (await response.json()) as { ok: boolean; roles?: RolePickerOption[]; message?: string };
      if (!active) return;
      if (data.ok && Array.isArray(data.roles)) {
        setOptions(data.roles);
        setError("");
      } else {
        setError(data.message || "Could not load roles.");
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedRole = value !== undefined ? value : internalValue;

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

  async function createRole() {
    const label = newLabel.trim();
    if (!label) {
      setError("Enter a role label.");
      return;
    }

    const response = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        coreBasisRoleId: newCoreBasisRoleId
      })
    });
    const data = (await response.json()) as {
      ok: boolean;
      role?: RolePickerOption;
      message?: string;
    };

    if (!data.ok || !data.role) {
      setError(data.message || "Could not create role.");
      return;
    }
    const createdRole = data.role;

    setOptions((current) => {
      const next = current.filter((item) => item.id !== createdRole.id);
      next.push(createdRole);
      return next.sort((left, right) => left.label.localeCompare(right.label));
    });
    commit(createdRole);
    setNewLabel("");
    setNewCoreBasisRoleId(createdRole.coreBasisRoleId);
    setOpenCreate(false);
    setError("");
  }

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
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpenCreate((current) => !current)}>
            {openCreate ? "Cancel new role" : "Add role"}
          </Button>
          {selectedRole?.coreBasisRoleId ? (
            <p className="self-center text-xs text-slate-400">Core basis: {selectedRole.coreBasisRoleId}</p>
          ) : null}
        </div>

        {openCreate ? (
          <div className="rounded-[18px] border border-white/12 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="Role label"
                className="rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
              />
              <select
                value={newCoreBasisRoleId}
                onChange={(event) => setNewCoreBasisRoleId(event.target.value as RoleId)}
                className="rounded-[16px] border border-white/12 bg-ink-950 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
              >
                <option value="Intern">Intern</option>
                <option value="Associate">Associate</option>
                <option value="SE">SE</option>
                <option value="SeniorSE">SeniorSE</option>
                <option value="TechLead">TechLead</option>
              </select>
              <Button type="button" onClick={createRole}>
                Save role
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-200">{error}</p> : null}
      </div>
    </div>
  );
}

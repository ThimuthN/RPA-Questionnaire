"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker } from "@/components/roles/RolePicker";
import { resumeSourceOptions } from "@/lib/candidates/types";

export function NewCandidateForm({
  departments,
  error
}: {
  departments: Array<{ id: string; name: string }>;
  error?: string;
}) {
  const [departmentId, setDepartmentId] = useState("");

  return (
    <form action="/api/candidates" method="post" className="space-y-4">
      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Full name</span>
        <input
          name="fullName"
          required
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Department</span>
        <select
          name="departmentId"
          required
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="">Select department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <RolePicker
        name="roleId"
        label="Job designation"
        departmentId={departmentId || null}
        defaultValue={null}
        placeholder={departmentId ? "Select job designation" : "Select a department first"}
        helperText="Choose the job designation this candidate is being considered for."
      />

      <div className="grid gap-2">
        <span className="text-sm text-[color:var(--app-text)]">Source</span>
        <ChoicePills
          name="resumeSource"
          idPrefix="new-candidate-source"
          defaultValue=""
          options={[
            { value: "", label: "Skip" },
            ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
          ]}
        />
      </div>

      <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <label className="block text-sm font-medium text-[color:var(--app-text)] mb-2">
          Responsible team owner (required)
        </label>
        <p className="text-xs text-[color:var(--app-muted)] mb-3">
          Select a team member from your department to own this candidate.
        </p>
        <input
          type="hidden"
          name="teamUserIds"
          value="[]"
          id="teamUserIds"
        />
        <div className="text-xs text-[color:var(--app-text)]">
          <p>Team selection will appear here after department selection.</p>
          <p className="text-[color:var(--app-muted)] mt-2">This feature requires your department to have team members with access roles configured.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

      <p className="text-sm text-[color:var(--app-muted)]">You can upload the resume and send a screening assessment after this.</p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Save candidate</Button>
        <Link href={"/people/candidates" as Route}>
          <Button type="button" variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

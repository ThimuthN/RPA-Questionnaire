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
        label="Role"
        departmentId={departmentId || null}
        defaultValue={null}
        placeholder={departmentId ? "Select role" : "Select a department first"}
        helperText="Choose the organization role this candidate is being considered for."
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

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Owner</span>
        <input
          name="hrOwner"
          placeholder="Optional"
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

      <p className="text-sm text-[color:var(--app-muted)]">You can upload the resume and send the screener after this.</p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Save candidate</Button>
        <Link href={"/candidates" as Route}>
          <Button type="button" variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

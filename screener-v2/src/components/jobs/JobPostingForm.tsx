"use client";

import Link from "next/link";
import type { Route } from "next";
import type { RoleId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { RichTextField } from "@/components/jobs/RichTextField";
import type { RolePickerOption } from "@/components/roles/RolePicker";
import type { JobPostingListItem } from "@/lib/jobs/types";

export function JobPostingForm({
  action,
  submitLabel,
  cancelHref,
  job,
  roleOptions = []
}: {
  action: string;
  submitLabel: string;
  cancelHref: Route;
  job?: JobPostingListItem | null;
  roleOptions?: RolePickerOption[];
}) {
  return (
    <form action={action} method="post" className="space-y-4">
      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Job title</span>
        <input
          name="title"
          required
          defaultValue={job?.title ?? ""}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Role</span>
        <select
          name="roleId"
          required
          defaultValue={job?.roleId ?? ""}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="">Select a role</option>
          {roleOptions
            .filter((role) => role.isActive !== false)
            .map((role) => (
              <option key={role.id} value={role.id}>
                {role.department ? `${role.label} — ${role.department}` : role.label}
              </option>
            ))}
        </select>
        <p className="text-xs text-[color:var(--app-muted)]">
          Select the role this job is for to determine assessment difficulty level.
        </p>
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Summary</span>
        <input
          name="summary"
          required
          defaultValue={job?.summary ?? ""}
          placeholder="A short line shown in the public jobs list."
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <RichTextField
        name="description"
        label="Description"
        initialValue={job?.description ?? ""}
        placeholder="Describe the work, expectations, and what the applicant should know."
        helperText="Paste formatted text here. Bold, italic, headings, quotes, and lists are supported."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={job?.isPublished ?? false}
            className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
          />
          Published on the public jobs page
        </label>
        <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-text)]">
          <input
            type="checkbox"
            name="isOpen"
            defaultChecked={job?.isOpen ?? true}
            className="h-4 w-4 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
          />
          Accepting applications
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Link href={cancelHref}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

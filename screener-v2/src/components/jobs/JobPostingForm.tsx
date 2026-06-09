"use client";

import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { RichTextField } from "@/components/jobs/RichTextField";
import type { RolePickerOption } from "@/components/roles/RolePicker";
import type { JobPostingListItem } from "@/lib/jobs/types";

const inputCls =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 w-full";
const hintCls = "text-xs text-[color:var(--app-muted)]";

function FormSection({
  title,
  hint,
  children
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 space-y-4">
      <div className="border-b border-[color:var(--app-border)] pb-3">
        <p className="text-sm font-semibold text-[color:var(--app-heading)]">{title}</p>
        <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{hint}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function JobPostingForm({
  action,
  submitLabel,
  cancelHref,
  job,
  roleOptions = [],
  presetOptions = [],
  returnTo,
  departmentId
}: {
  action: string;
  submitLabel: string;
  cancelHref: Route;
  job?: JobPostingListItem | null;
  roleOptions?: RolePickerOption[];
  presetOptions?: { id: string; label: string }[];
  returnTo?: string;
  departmentId?: string;
}) {
  const roleFieldLabel = departmentId ? "Job designation" : "Role";

  return (
    <form action={action} method="post" className="space-y-4">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {departmentId ? <input type="hidden" name="departmentId" value={departmentId} /> : null}

      {/* 1 ── Role basics */}
      <FormSection
        title="Role basics"
        hint="Required fields that identify this opening."
      >
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            Job title <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="title"
            required
            defaultValue={job?.title ?? ""}
            className={inputCls}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            {roleFieldLabel} <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <select
            name="roleId"
            required
            defaultValue={job?.roleId ?? ""}
            className={inputCls}
          >
            <option value="">Select a {roleFieldLabel.toLowerCase()}</option>
            {roleOptions
              .filter((role) => role.isActive !== false)
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {departmentId
                    ? role.label
                    : `${role.label} - ${role.department || "Archived department"}`}
                </option>
              ))}
          </select>
          <p className={hintCls}>
            Required. Every job posting must be linked to a {roleFieldLabel.toLowerCase()}.
          </p>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Work mode (optional)</span>
          <select name="remotePolicy" defaultValue={job?.remotePolicy ?? ""} className={inputCls}>
            <option value="">Not specified</option>
            <option value="Remote">Remote</option>
            <option value="Remote (Flexible)">Remote (Flexible)</option>
            <option value="Remote (Flexible, US only)">Remote (Flexible, US only)</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </label>
      </FormSection>

      {/* 2 ── Public listing */}
      <FormSection
        title="Public listing"
        hint="What candidates read before applying. Both fields are required."
      >
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            Summary <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="summary"
            required
            defaultValue={job?.summary ?? ""}
            placeholder="A short line shown in the public jobs list."
            className={inputCls}
          />
          <p className={hintCls}>Shown below the job title on the careers page.</p>
        </label>

        <RichTextField
          name="description"
          label="Description"
          initialValue={job?.description ?? ""}
          placeholder="Describe the work, expectations, and what the applicant should know."
          helperText="Bold, italic, headings, quotes, and lists are supported."
        />
      </FormSection>

      {/* 3 ── Compensation */}
      <FormSection
        title="Compensation"
        hint="Annual salary range in dollars. Both fields are optional."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-[color:var(--app-text)]">Salary min</span>
            <input
              name="salaryMin"
              type="number"
              defaultValue={job?.salaryMin ?? ""}
              placeholder="e.g., 120000"
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-[color:var(--app-text)]">Salary max</span>
            <input
              name="salaryMax"
              type="number"
              defaultValue={job?.salaryMax ?? ""}
              placeholder="e.g., 150000"
              className={inputCls}
            />
          </label>
        </div>
      </FormSection>

      {/* 4 ── Publishing */}
      <FormSection
        title="Publishing"
        hint="Control when this job is visible and open for applications."
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={job?.isPublished ?? false}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">Published</p>
              <p className={hintCls}>
                Visible on the public careers page. Unpublished jobs are draft-only.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isOpen"
              defaultChecked={job?.isOpen ?? true}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">
                Accepting applications
              </p>
              <p className={hintCls}>
                Candidates can submit an application. Disable to pause intake without
                unpublishing.
              </p>
            </div>
          </label>
        </div>
      </FormSection>

      {/* 5 ── Optional details */}
      <FormSection
        title="Optional details"
        hint="Additional context shown on the public job page."
      >
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Tech stack</span>
          <input
            name="techStack"
            defaultValue={job?.techStack ?? ""}
            placeholder="e.g., Go, React, PostgreSQL"
            className={inputCls}
          />
          <p className={hintCls}>Comma-separated list of technologies.</p>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Team size</span>
          <input
            name="teamSize"
            type="number"
            defaultValue={job?.teamSize ?? ""}
            placeholder="e.g., 5"
            className={inputCls}
          />
          <p className={hintCls}>Number of people on the team (1–500).</p>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Screening assessment</span>
          <select
            name="screenerPresetId"
            defaultValue={job?.screenerPresetId ?? ""}
            className={inputCls}
          >
            <option value="">None — applicants apply without a test</option>
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className={hintCls}>Attach a preset to auto-score submissions at intake.</p>
        </label>
      </FormSection>

      <div className="flex flex-wrap gap-3 pt-1">
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

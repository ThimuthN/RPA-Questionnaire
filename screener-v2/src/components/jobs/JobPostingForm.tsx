"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { RichTextField } from "@/components/jobs/RichTextField";
import type { RolePickerOption } from "@/components/roles/RolePicker";
import type { JobPostingListItem } from "@/lib/jobs/types";

const inputCls =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 w-full";
const hintCls = "text-xs text-[color:var(--app-muted)]";

const STEPS = ["Basics", "Public listing", "Compensation", "Screening", "Publish", "Review"] as const;

// ── Stepper ──────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Job creation steps">
      {/* Mobile: text progress */}
      <p className="sm:hidden text-sm text-[color:var(--app-muted)]">
        Step {current + 1} of {STEPS.length} —{" "}
        <span className="font-semibold text-[color:var(--app-text)]">{STEPS[current]}</span>
      </p>
      {/* Desktop: visual stepper */}
      <ol className="hidden sm:flex items-start">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const circleClass = active
            ? "bg-brand-400 text-white"
            : done
              ? "bg-brand-100 text-brand-500 ring-1 ring-brand-400"
              : "bg-[color:var(--app-surface)] text-[color:var(--app-muted)] ring-1 ring-[color:var(--app-border)]";
          const labelClass = active
            ? "font-semibold text-[color:var(--app-heading)]"
            : done
              ? "text-brand-500"
              : "text-[color:var(--app-muted)]";
          return (
            <li key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-px w-5 flex-shrink-0 -mt-3.5 ${
                    done ? "bg-brand-300" : "bg-[color:var(--app-border)]"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${circleClass}`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[11px] whitespace-nowrap px-0.5 ${labelClass}`}>
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[color:var(--app-border)] last:border-0">
      <span className="w-40 shrink-0 text-xs text-[color:var(--app-muted)]">{label}</span>
      <span className="text-sm text-[color:var(--app-text)] break-words min-w-0">{value}</span>
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

type Vals = {
  title: string;
  roleId: string;
  remotePolicy: string;
  summary: string;
  techStack: string;
  salaryMin: string;
  salaryMax: string;
  screenerPresetId: string;
  isPublished: boolean;
  isOpen: boolean;
};

export function JobPostingForm({
  action,
  submitLabel,
  cancelHref,
  job,
  roleOptions = [],
  presetOptions = [],
  returnTo,
  departmentId,
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

  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Vals>({
    title: job?.title ?? "",
    roleId: job?.roleId ?? "",
    remotePolicy: job?.remotePolicy ?? "",
    summary: job?.summary ?? "",
    techStack: job?.techStack ?? "",
    salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
    salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
    screenerPresetId: job?.screenerPresetId ?? "",
    isPublished: job?.isPublished ?? false,
    isOpen: job?.isOpen ?? true,
  });

  const set =
    (k: keyof Vals) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const el = e.currentTarget as HTMLInputElement;
      setVals((v) => ({ ...v, [k]: el.type === "checkbox" ? el.checked : el.value }));
    };

  const canNext = step !== 0 || (vals.title.trim().length >= 2 && vals.roleId !== "");
  const isReview = step === STEPS.length - 1;

  const roleLabel = roleOptions.find((r) => r.id === vals.roleId)?.label ?? vals.roleId;
  const presetLabel = presetOptions.find((p) => p.id === vals.screenerPresetId)?.label ?? "";

  return (
    <form action={action} method="post" className="space-y-6">
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {departmentId && <input type="hidden" name="departmentId" value={departmentId} />}
      {/* Preserve teamSize for edit compatibility — not exposed in wizard UI */}
      {job?.teamSize != null && (
        <input type="hidden" name="teamSize" value={String(job.teamSize)} />
      )}

      <StepIndicator current={step} />

      {/* ── Step 0: Basics ─────────────────────────────────────────────────── */}
      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            Job title <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input name="title" value={vals.title} onChange={set("title")} className={inputCls} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            {roleFieldLabel} <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <select name="roleId" value={vals.roleId} onChange={set("roleId")} className={inputCls}>
            <option value="">Select a {roleFieldLabel.toLowerCase()}</option>
            {roleOptions
              .filter((r) => r.isActive !== false)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {departmentId
                    ? r.label
                    : `${r.label} - ${r.department || "Archived department"}`}
                </option>
              ))}
          </select>
          <p className={hintCls}>
            Required. Every job posting must be linked to a {roleFieldLabel.toLowerCase()}.
          </p>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Work mode (optional)</span>
          <select
            name="remotePolicy"
            value={vals.remotePolicy}
            onChange={set("remotePolicy")}
            className={inputCls}
          >
            <option value="">Not specified</option>
            <option value="Remote">Remote</option>
            <option value="Remote (Flexible)">Remote (Flexible)</option>
            <option value="Remote (Flexible, US only)">Remote (Flexible, US only)</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </label>
      </div>

      {/* ── Step 1: Public listing ─────────────────────────────────────────── */}
      {/* Always in DOM so RichTextField retains its value and submits */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            Summary <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="summary"
            value={vals.summary}
            onChange={set("summary")}
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
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">Tech stack (optional)</span>
          <input
            name="techStack"
            value={vals.techStack}
            onChange={set("techStack")}
            placeholder="e.g., Go, React, PostgreSQL"
            className={inputCls}
          />
          <p className={hintCls}>Comma-separated list of technologies.</p>
        </label>
      </div>

      {/* ── Step 2: Compensation ───────────────────────────────────────────── */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <p className={hintCls}>Annual salary range in dollars. Both fields are optional.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-[color:var(--app-text)]">Salary min</span>
            <input
              name="salaryMin"
              type="number"
              value={vals.salaryMin}
              onChange={set("salaryMin")}
              placeholder="e.g., 120000"
              className={inputCls}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-[color:var(--app-text)]">Salary max</span>
            <input
              name="salaryMax"
              type="number"
              value={vals.salaryMax}
              onChange={set("salaryMax")}
              placeholder="e.g., 150000"
              className={inputCls}
            />
          </label>
        </div>
      </div>

      {/* ── Step 3: Screening ──────────────────────────────────────────────── */}
      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1">
          <span className="text-sm text-[color:var(--app-text)]">
            Screening assessment (optional)
          </span>
          <select
            name="screenerPresetId"
            value={vals.screenerPresetId}
            onChange={set("screenerPresetId")}
            className={inputCls}
          >
            <option value="">None — applicants apply without a test</option>
            {presetOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className={hintCls}>Attach a preset to auto-score submissions at intake.</p>
        </label>
        <p className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm text-[color:var(--app-muted)]">
          Screening configuration will be expanded in a future release with pass/fail thresholds,
          question editing, and auto-reject rules.
        </p>
      </div>

      {/* ── Step 4: Publish ────────────────────────────────────────────────── */}
      <div className={step === 4 ? "space-y-4" : "hidden"}>
        <p className={hintCls}>Control when this job is visible and open for applications.</p>
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isPublished"
              checked={vals.isPublished}
              onChange={set("isPublished")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">Published</p>
              <p className={hintCls}>
                Visible on the public careers page. Unpublished jobs are draft-only — candidates
                cannot see or apply.
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isOpen"
              checked={vals.isOpen}
              onChange={set("isOpen")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">
                Accepting applications
              </p>
              <p className={hintCls}>
                Candidates can submit an application. Disable to pause intake without unpublishing
                — useful during review periods.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* ── Step 5: Review ─────────────────────────────────────────────────── */}
      {isReview && (
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
          <p className="text-sm font-semibold text-[color:var(--app-heading)] pb-3 mb-1 border-b border-[color:var(--app-border)]">
            Review your job posting
          </p>
          {vals.title && <ReviewRow label="Job title" value={vals.title} />}
          {roleLabel && <ReviewRow label={roleFieldLabel} value={roleLabel} />}
          {vals.remotePolicy && <ReviewRow label="Work mode" value={vals.remotePolicy} />}
          {vals.summary && <ReviewRow label="Summary" value={vals.summary} />}
          <ReviewRow label="Description" value="Rich text — see Public listing to edit" />
          {vals.techStack && <ReviewRow label="Tech stack" value={vals.techStack} />}
          {vals.salaryMin && (
            <ReviewRow
              label="Salary min"
              value={`$${Number(vals.salaryMin).toLocaleString()}`}
            />
          )}
          {vals.salaryMax && (
            <ReviewRow
              label="Salary max"
              value={`$${Number(vals.salaryMax).toLocaleString()}`}
            />
          )}
          {vals.screenerPresetId && presetLabel && (
            <ReviewRow label="Screening" value={presetLabel} />
          )}
          <ReviewRow
            label="Published"
            value={vals.isPublished ? "Yes — visible on careers page" : "No — draft only"}
          />
          <ReviewRow
            label="Accepting applications"
            value={vals.isOpen ? "Yes" : "No — intake paused"}
          />
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-1">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {!isReview && (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
          >
            Next
          </Button>
        )}
        {isReview && <Button type="submit">{submitLabel}</Button>}
        <Link href={cancelHref}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

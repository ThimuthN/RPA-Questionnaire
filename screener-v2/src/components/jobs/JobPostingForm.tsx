"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { RichTextField } from "@/components/jobs/RichTextField";
import type { RolePickerOption } from "@/components/roles/RolePicker";
import {
  JOB_POSTING_STEPS,
  firstInvalidJobPostingStep,
  normalizeStoredJobPostingDraft,
  validateJobPostingForm,
  validateJobPostingStep,
  type JobPostingFormErrors,
  type JobPostingFormValues
} from "@/components/jobs/job-posting-form-state";
import { jobDescriptionTextContent } from "@/lib/jobs/rich-text";
import type { JobPostingListItem } from "@/lib/jobs/types";
import { SALARY_CURRENCY_OPTIONS, currencySymbol, normalizeSalaryCurrency } from "@/lib/jobs/currency";
import { cn } from "@/lib/utils";

const baseInputClassName =
  "w-full rounded-[18px] border bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";
const inputDefaultClassName = "border-[color:var(--app-border)]";
const inputErrorClassName =
  "border-[color:var(--app-danger)]/60 bg-[color:var(--app-danger)]/5 text-[color:var(--app-heading)]";
const hintClassName = "text-xs text-[color:var(--app-muted)]";
const errorClassName = "text-xs text-[color:var(--app-danger)]";

type MutationResponse = {
  ok?: boolean;
  message?: string;
  next?: string;
};

function fieldClassName(hasError: boolean) {
  return cn(
    baseInputClassName,
    hasError ? inputErrorClassName : inputDefaultClassName
  );
}

function StepIndicator({
  current,
  onSelect
}: {
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Job creation steps" className="space-y-3">
      <p className="text-sm text-[color:var(--app-muted)] sm:hidden">
        Step {current + 1} of {JOB_POSTING_STEPS.length}:{" "}
        <span className="font-semibold text-[color:var(--app-text)]">
          {JOB_POSTING_STEPS[current].label}
        </span>
      </p>

      <ol className="hidden gap-2 sm:grid sm:grid-cols-6">
        {JOB_POSTING_STEPS.map((step, index) => {
          const isActive = index === current;
          const isComplete = index < current;

          return (
            <li key={step.key}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={index > current}
                className={cn(
                  "flex w-full flex-col gap-2 rounded-[18px] border px-3 py-3 text-left transition",
                  isActive
                    ? "border-brand-300/50 bg-[color:var(--app-brand-soft)] shadow-[var(--app-shadow-soft)]"
                    : isComplete
                      ? "border-[color:var(--app-border-strong)] bg-[color:var(--app-surface)] hover:border-brand-300/40"
                      : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:border-[color:var(--app-border-strong)]"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-[color:var(--app-brand)] text-white"
                        : isComplete
                          ? "bg-[color:var(--app-brand)]/12 text-[color:var(--app-brand)]"
                          : "bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)]"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] uppercase tracking-[0.18em]",
                      isActive || isComplete
                        ? "text-[color:var(--app-brand)]"
                        : "text-[color:var(--app-muted)]"
                    )}
                  >
                    {isComplete ? "Ready" : `Step ${index + 1}`}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-[color:var(--app-heading)]"
                      : "text-[color:var(--app-text)]"
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[color:var(--app-border)] py-2.5 last:border-0">
      <span className="w-40 shrink-0 text-xs text-[color:var(--app-muted)]">{label}</span>
      <span className="min-w-0 break-words text-sm text-[color:var(--app-text)]">{value}</span>
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className={errorClassName}>{message}</p>;
}

function fallbackMutationMessage(submitLabel: string) {
  return submitLabel === "Create job" ? "Could not create job." : "Could not update job.";
}

export function JobPostingForm({
  action,
  submitLabel,
  cancelHref,
  job,
  roleOptions = [],
  presetOptions = [],
  returnTo,
  departmentId,
  initialError
}: {
  action: string;
  submitLabel: string;
  cancelHref: Route;
  job?: JobPostingListItem | null;
  roleOptions?: RolePickerOption[];
  presetOptions?: { id: string; label: string }[];
  returnTo?: string;
  departmentId?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const isCreateMode = !job;
  const roleFieldLabel = departmentId ? "Job designation" : "Role";
  const initialValues = useMemo<JobPostingFormValues>(
    () => ({
      title: job?.title ?? "",
      roleId: job?.roleId ?? "",
      remotePolicy: job?.remotePolicy ?? "",
      summary: job?.summary ?? "",
      description: job?.description ?? "",
      techStack: job?.techStack ?? "",
      salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
      salaryCurrency: normalizeSalaryCurrency(job?.salaryCurrency),
      screenerPresetId: job?.screenerPresetId ?? "",
      isPublished: job?.isPublished ?? false,
      isOpen: job?.isOpen ?? true
    }),
    [job]
  );
  const draftStorageKey = isCreateMode
    ? `job-posting-draft:${departmentId ?? "global"}`
    : undefined;

  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<JobPostingFormValues>(initialValues);
  const [errors, setErrors] = useState<JobPostingFormErrors>({});
  const [formError, setFormError] = useState(initialError ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftReady, setDraftReady] = useState(!draftStorageKey);

  useEffect(() => {
    setFormError(initialError ?? "");
  }, [initialError]);

  useEffect(() => {
    if (!draftStorageKey) {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(draftStorageKey);
      if (!raw) {
        setDraftReady(true);
        return;
      }

      const parsed = normalizeStoredJobPostingDraft(JSON.parse(raw), initialValues, {
        maxStep: JOB_POSTING_STEPS.length - 2
      });
      if (parsed?.values) {
        setVals((current) => ({ ...current, ...parsed.values }));
      }
      if (typeof parsed?.step === "number") {
        setStep(parsed.step);
      }
    } catch {
      // Ignore malformed draft state and continue with server data.
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey, initialValues]);

  useEffect(() => {
    if (!draftStorageKey || !draftReady) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          step,
          values: vals
        })
      );
    } catch {
      // Ignore storage write failures. The form still functions normally.
    }
  }, [draftReady, draftStorageKey, step, vals]);

  function clearDraft() {
    if (!draftStorageKey) {
      return;
    }

    try {
      window.sessionStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore storage failures.
    }
  }

  function updateField<K extends keyof JobPostingFormValues>(
    key: K,
    value: JobPostingFormValues[K]
  ) {
    setVals((current) => ({ ...current, [key]: value }));
    setFormError("");
    setErrors((current) => {
      if (!current[key] && key !== "salaryMin" && key !== "salaryMax") {
        return current;
      }

      const next = { ...current };
      delete next.form;
      delete next[key];
      if (key === "salaryMin" || key === "salaryMax") {
        delete next.salaryMin;
        delete next.salaryMax;
      }
      return next;
    });
  }

  function setFromInput<K extends keyof JobPostingFormValues>(key: K) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const input = event.currentTarget as HTMLInputElement;
      const nextValue = (
        input.type === "checkbox" ? input.checked : input.value
      ) as JobPostingFormValues[K];
      updateField(key, nextValue);
    };
  }

  function handleStepSelect(nextStep: number) {
    if (nextStep <= step) {
      setFormError("");
      setStep(nextStep);
      return;
    }

    const stepErrors = validateJobPostingStep(vals, step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((current) => ({ ...current, ...stepErrors }));
      setFormError("Complete the current step before moving forward.");
      return;
    }

    setFormError("");
    setStep(nextStep);
  }

  function handleNext() {
    const stepErrors = validateJobPostingStep(vals, step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((current) => ({ ...current, ...stepErrors }));
      setFormError("Complete the current step before moving forward.");
      return;
    }

    setFormError("");
    setStep((current) => Math.min(current + 1, JOB_POSTING_STEPS.length - 1));
  }

  async function submitForm() {
    setFormError("");

    if (!isReview) {
      setFormError("Complete the remaining steps before creating the job.");
      return;
    }

    const validationErrors = validateJobPostingForm(vals);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStep(firstInvalidJobPostingStep(validationErrors));
      setFormError("Fix the highlighted fields before saving the job.");
      return;
    }

    setIsSubmitting(true);

    try {
      const form = formRef.current;
      if (!form) {
        throw new Error(fallbackMutationMessage(submitLabel));
      }

      const response = await fetch(action, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json"
        },
        body: new FormData(form)
      });

      const payload = (await response.json().catch(() => null)) as MutationResponse | null;
      if (!response.ok || !payload?.ok) {
        setFormError(payload?.message || fallbackMutationMessage(submitLabel));
        return;
      }

      clearDraft();
      startTransition(() => {
        router.replace((payload.next || cancelHref) as never);
        router.refresh();
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : fallbackMutationMessage(submitLabel)
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitForm();
  }

  const isReview = step === JOB_POSTING_STEPS.length - 1;
  const currentStep = JOB_POSTING_STEPS[step];
  const roleLabel = roleOptions.find((role) => role.id === vals.roleId)?.label ?? vals.roleId;
  const presetLabel =
    presetOptions.find((preset) => preset.id === vals.screenerPresetId)?.label ?? "";
  const descriptionLength = jobDescriptionTextContent(vals.description).length;

  return (
    <form
      ref={formRef}
      action={action}
      method="post"
      className="space-y-6"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {departmentId ? <input type="hidden" name="departmentId" value={departmentId} /> : null}
      {job?.teamSize != null ? (
        <input type="hidden" name="teamSize" value={String(job.teamSize)} />
      ) : null}

      <StepIndicator current={step} onSelect={handleStepSelect} />

      <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-brand)]">
              {currentStep.label}
            </p>
            <h3 className="text-xl text-[color:var(--app-heading)]">{currentStep.title}</h3>
            <p className="max-w-2xl text-sm text-[color:var(--app-muted)]">
              {currentStep.description}
            </p>
          </div>
          <StatusPill label={`${step + 1} of ${JOB_POSTING_STEPS.length}`} tone="blue" />
        </div>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-[18px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger)]/10 px-4 py-3 text-sm text-[color:var(--app-danger)]"
        >
          {formError}
        </div>
      ) : null}

      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            Job title <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="title"
            value={vals.title}
            onChange={setFromInput("title")}
            className={fieldClassName(Boolean(errors.title))}
            aria-invalid={errors.title ? "true" : undefined}
          />
          <InlineError message={errors.title} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            {roleFieldLabel} <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <select
            name="roleId"
            value={vals.roleId}
            onChange={setFromInput("roleId")}
            className={fieldClassName(Boolean(errors.roleId))}
            aria-invalid={errors.roleId ? "true" : undefined}
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
          <p className={hintClassName}>
            Required. Every job posting must be linked to a {roleFieldLabel.toLowerCase()}.
          </p>
          <InlineError message={errors.roleId} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Work mode</span>
          <select
            name="remotePolicy"
            value={vals.remotePolicy}
            onChange={setFromInput("remotePolicy")}
            className={fieldClassName(false)}
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

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[color:var(--app-text)]">
              Summary <span className="text-[color:var(--app-danger)]">*</span>
            </span>
            <span className={hintClassName}>{vals.summary.trim().length}/8+</span>
          </div>
          <input
            name="summary"
            value={vals.summary}
            onChange={setFromInput("summary")}
            placeholder="A short line shown in the public jobs list."
            className={fieldClassName(Boolean(errors.summary))}
            aria-invalid={errors.summary ? "true" : undefined}
          />
          <p className={hintClassName}>Shown below the job title on the careers page.</p>
          <InlineError message={errors.summary} />
        </label>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <p className={hintClassName}>At least 20 characters of real content.</p>
            <span className={hintClassName}>{descriptionLength}/20+</span>
          </div>
          <RichTextField
            name="description"
            label="Description *"
            value={vals.description}
            onChange={(value) => updateField("description", value)}
            placeholder="Describe the work, expectations, and what the applicant should know."
            helperText="Bold, italic, headings, quotes, and lists are supported."
            error={errors.description}
          />
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Tech stack</span>
          <input
            name="techStack"
            value={vals.techStack}
            onChange={setFromInput("techStack")}
            placeholder="e.g., Go, React, PostgreSQL"
            className={fieldClassName(false)}
          />
          <p className={hintClassName}>Comma-separated list of technologies.</p>
        </label>
      </div>

      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <p className={hintClassName}>Annual salary range. Both fields are optional.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-sm text-[color:var(--app-text)]">Currency</span>
            <select
              name="salaryCurrency"
              value={vals.salaryCurrency}
              onChange={setFromInput("salaryCurrency")}
              className={fieldClassName(false)}
            >
              {SALARY_CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm text-[color:var(--app-text)]">Salary min</span>
            <input
              name="salaryMin"
              type="number"
              value={vals.salaryMin}
              onChange={setFromInput("salaryMin")}
              placeholder="e.g., 120000"
              className={fieldClassName(Boolean(errors.salaryMin))}
              aria-invalid={errors.salaryMin ? "true" : undefined}
            />
            <InlineError message={errors.salaryMin} />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm text-[color:var(--app-text)]">Salary max</span>
            <input
              name="salaryMax"
              type="number"
              value={vals.salaryMax}
              onChange={setFromInput("salaryMax")}
              placeholder="e.g., 150000"
              className={fieldClassName(Boolean(errors.salaryMax))}
              aria-invalid={errors.salaryMax ? "true" : undefined}
            />
            <InlineError message={errors.salaryMax} />
          </label>
        </div>
      </div>

      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Application screening package</span>
          <select
            name="screenerPresetId"
            value={vals.screenerPresetId}
            onChange={setFromInput("screenerPresetId")}
            className={fieldClassName(false)}
          >
            <option value="">No screening package</option>
            {presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className={hintClassName}>
            Applicants complete this during application when supported.
          </p>
        </label>
      </div>

      <div className={step === 4 ? "space-y-4" : "hidden"}>
        <p className={hintClassName}>
          Control when this job is visible and whether applicants can submit.
        </p>
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isPublished"
              checked={vals.isPublished}
              onChange={setFromInput("isPublished")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">Published</p>
              <p className={hintClassName}>
                Visible on the public careers page. Unpublished jobs stay internal only.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
            <input
              type="checkbox"
              name="isOpen"
              checked={vals.isOpen}
              onChange={setFromInput("isOpen")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] text-brand-400"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">
                Accepting applications
              </p>
              <p className={hintClassName}>
                Keep intake open without changing whether the role is publicly visible.
              </p>
            </div>
          </label>
        </div>
      </div>

      {isReview ? (
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
          <p className="mb-1 border-b border-[color:var(--app-border)] pb-3 text-sm font-semibold text-[color:var(--app-heading)]">
            Review your job posting
          </p>
          {vals.title ? <ReviewRow label="Job title" value={vals.title} /> : null}
          {roleLabel ? <ReviewRow label={roleFieldLabel} value={roleLabel} /> : null}
          {vals.remotePolicy ? <ReviewRow label="Work mode" value={vals.remotePolicy} /> : null}
          {vals.summary ? <ReviewRow label="Summary" value={vals.summary} /> : null}
          <ReviewRow
            label="Description"
            value={descriptionLength >= 20 ? "Ready to publish" : "Needs more detail"}
          />
          {vals.techStack ? <ReviewRow label="Tech stack" value={vals.techStack} /> : null}
          {vals.salaryMin ? (
            <ReviewRow
              label="Salary min"
              value={`${currencySymbol(vals.salaryCurrency)}${Number(vals.salaryMin).toLocaleString()}`}
            />
          ) : null}
          {vals.salaryMax ? (
            <ReviewRow
              label="Salary max"
              value={`${currencySymbol(vals.salaryCurrency)}${Number(vals.salaryMax).toLocaleString()}`}
            />
          ) : null}
          {vals.screenerPresetId && presetLabel ? (
            <ReviewRow label="Application screening package" value={presetLabel} />
          ) : null}
          <ReviewRow
            label="Published"
            value={vals.isPublished ? "Yes" : "No"}
          />
          <ReviewRow
            label="Accepting applications"
            value={vals.isOpen ? "Yes" : "No"}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        {step > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((current) => current - 1)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : null}

        {!isReview ? (
          <Button type="button" onClick={handleNext} disabled={isSubmitting || !draftReady}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={() => void submitForm()} disabled={isSubmitting || !draftReady}>
            {isSubmitting ? `${submitLabel}...` : submitLabel}
          </Button>
        )}

        <Link
          href={cancelHref}
          onClick={(event) => {
            if (isSubmitting) {
              event.preventDefault();
              return;
            }
            clearDraft();
          }}
        >
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

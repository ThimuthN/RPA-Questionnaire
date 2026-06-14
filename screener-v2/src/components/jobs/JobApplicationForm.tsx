"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import {
  clearApplicationDraft,
  draftKey,
  loadApplicationDraft,
  saveApplicationDraft
} from "@/lib/jobs/public-application-draft";
import { CANDIDATE_PRIVACY_POLICY_VERSION } from "@/lib/legal/site-policy";
import {
  COVER_NOTE_MAX,
  EMAIL_MAX,
  FULL_NAME_MAX,
  PHONE_MAX,
  validateProfileStep,
  validateResumeFile
} from "@/lib/jobs/public-application-validation";
import type { ApplicationScreeningPackage } from "@/lib/jobs/types";

const inputClassName =
  "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";
const hintClassName = "text-xs text-[color:var(--app-muted)]";
const steps = ["Your information", "Resume", "Additional questions", "Review"] as const;

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  coverNote: string;
  source: string;
  referredBy: string;
};

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "How did you hear about us? (optional)" },
  { value: "direct", label: "Company website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "job_board", label: "Job board" },
  { value: "referral", label: "Referred by someone" },
  { value: "agency", label: "Recruitment agency" },
  { value: "other", label: "Other" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Application steps">
      <p className="text-sm text-[color:var(--app-muted)] sm:hidden">
        Step {current + 1} of {steps.length}:{" "}
        <span className="font-semibold text-[color:var(--app-heading)]">{steps[current]}</span>
      </p>
      <ol className="hidden items-start sm:flex">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
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
            <li key={label} className="flex items-center">
              {index > 0 ? (
                <div
                  className={`-mt-3.5 h-px w-8 flex-shrink-0 ${
                    done ? "bg-brand-300" : "bg-[color:var(--app-border)]"
                  }`}
                />
              ) : null}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${circleClass}`}
                >
                  {done ? "OK" : index + 1}
                </div>
                <span className={`px-0.5 text-[11px] whitespace-nowrap ${labelClass}`}>{label}</span>
              </div>
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
      <span className="w-36 shrink-0 text-xs text-[color:var(--app-muted)]">{label}</span>
      <span className="min-w-0 break-words text-sm text-[color:var(--app-text)]">{value}</span>
    </div>
  );
}

function screeningSummary(screeningPackage: ApplicationScreeningPackage | null) {
  const addons = screeningPackage?.addons ?? [];
  const totalMinutes = addons.reduce((total, addon) => total + addon.durationMinutes, 0);
  const requiredCount = addons.filter((addon) => addon.isMandatory).length;

  return {
    addons,
    addonCount: addons.length,
    totalMinutes,
    requiredCount
  };
}

export function JobApplicationForm({
  jobSlug,
  screeningPackage
}: {
  jobSlug: string;
  screeningPackage: ApplicationScreeningPackage | null;
}) {
  const key = draftKey(jobSlug);
  const screening = screeningSummary(screeningPackage);
  const hasScreening = screening.addonCount > 0;

  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    phone: "",
    coverNote: "",
    source: "",
    referredBy: "",
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = loadApplicationDraft(key);
    if (draft) {
      setValues({
        fullName: draft.fullName,
        email: draft.email,
        phone: draft.phone,
        coverNote: draft.coverNote,
        source: draft.source ?? "",
        referredBy: draft.referredBy ?? "",
      });
      setStep(draft.step);
      setDraftSaved(true);
    }
    setInitialized(true);
  }, [key]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!values.fullName && !values.email && !values.phone && !values.coverNote) {
      return;
    }

    saveApplicationDraft(key, {
      ...values,
      screeningAnswers: {},
      step
    });
    setDraftSaved(true);
  }, [initialized, key, step, values]);

  function updateValue(field: keyof FormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }));
    };
  }

  function clearDraft() {
    clearApplicationDraft(key);
    setValues({
      fullName: "",
      email: "",
      phone: "",
      coverNote: "",
      source: "",
      referredBy: "",
    });
    setStep(0);
    setStepError(null);
    setDraftSaved(false);
    setResumeFileName(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function advance() {
    if (step === 0) {
      const error = validateProfileStep(values);
      if (error) {
        setStepError(error);
        return;
      }
    }

    if (step === 1) {
      const file = fileRef.current?.files?.[0];
      if (file) {
        const error = validateResumeFile(file);
        if (error) {
          setStepError(error);
          return;
        }
      }
    }

    setStepError(null);
    setStep((current) => current + 1);
  }

  function retreat() {
    setStepError(null);
    setStep((current) => current - 1);
  }

  const isReview = step === steps.length - 1;

  return (
    <form
      action={`/api/jobs/${jobSlug}/apply`}
      method="post"
      encType="multipart/form-data"
      className="space-y-6"
      onSubmit={(e) => {
      if (!consentGiven) {
        e.preventDefault();
        setStepError("You must agree to data processing before submitting your application.");
        return;
      }
      setIsSubmitting(true);
    }}
    >
      <div className="space-y-3">
        <StepIndicator current={step} />
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_12%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))] px-4 py-4 sm:px-5">
          <p className="text-sm leading-6 text-[color:var(--app-text)]">
            {hasScreening
              ? "This role includes an automatic screening session. After you submit the application, you will continue into the assessment experience and the results will be attached to this application."
              : "Complete the application details below. If the role does not require screening, your submission goes straight to the hiring team."}
          </p>
        </div>
      </div>

      {stepError ? (
        <p
          role="alert"
          className="rounded-[14px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {stepError}
        </p>
      ) : null}

      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            Full name <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="fullName"
            value={values.fullName}
            onChange={updateValue("fullName")}
            maxLength={FULL_NAME_MAX}
            placeholder="Jane Doe"
            autoComplete="name"
            className={inputClassName}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            Email <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue("email")}
            maxLength={EMAIL_MAX}
            placeholder="jane@example.com"
            autoComplete="email"
            className={inputClassName}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Phone (optional)</span>
          <input
            name="phone"
            value={values.phone}
            onChange={updateValue("phone")}
            maxLength={PHONE_MAX}
            placeholder="+94 77 123 4567"
            autoComplete="tel"
            className={inputClassName}
          />
        </label>
        <div className="grid gap-1.5">
          <label htmlFor="source-select" className="text-sm text-[color:var(--app-text)]">
            How did you hear about us? (optional)
          </label>
          <select
            id="source-select"
            name="source"
            value={values.source}
            onChange={(e) => setValues((v) => ({ ...v, source: e.target.value, referredBy: e.target.value !== "referral" ? "" : v.referredBy }))}
            className={inputClassName}
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {values.source === "referral" ? (
            <input
              name="referredBy"
              value={values.referredBy}
              onChange={updateValue("referredBy")}
              placeholder="Who referred you? (optional)"
              maxLength={120}
              className={inputClassName}
            />
          ) : null}
        </div>
      </div>

      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Resume (optional)</span>
          <input
            ref={fileRef}
            name="resume"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => setResumeFileName(event.target.files?.[0]?.name ?? null)}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]"
          />
          <p className={hintClassName}>
            PDF only, max 5 MB. Resume files are uploaded when you submit the application.
          </p>
        </label>
      </div>

      <div className={step === 2 ? "space-y-5" : "hidden"}>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Additional questions</p>
          <p className={hintClassName}>
            {hasScreening
              ? "A structured screening session follows submission. Review the modules below before moving to final review."
              : "No additional questions are required for this role."}
          </p>
        </div>

        {hasScreening ? (
          <div className="space-y-4">
            <section className="rounded-[24px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
                    {screeningPackage?.presetLabel}
                  </h3>
                  <p className="max-w-2xl text-sm leading-6 text-[color:var(--app-muted)]">
                    The screening runs in the platform&apos;s full assessment view with autosave enabled. Closing the session without answering still leaves this application saved with unanswered screening evidence.
                  </p>
                </div>
                <div className="grid min-w-[220px] gap-2 text-right text-sm text-[color:var(--app-heading)]">
                  <p>{screening.addonCount} modules</p>
                  <p>{screening.totalMinutes} minutes total</p>
                  <p>{screening.requiredCount} required modules</p>
                </div>
              </div>
            </section>

            <div className="space-y-3">
              {screening.addons.map((addon) => (
                <section
                  key={addon.key}
                  className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
                        {addon.addonLabel}
                      </h3>
                      <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                        {addon.configSummary}
                      </p>
                    </div>
                    <div className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1 text-xs font-medium text-[color:var(--app-muted)]">
                      Pass {addon.requiredPercent}%{addon.weight > 0 ? ` | Weight ${addon.weight}` : ""}{addon.isMandatory ? " | Required" : ""}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Cover note (optional)</span>
          <textarea
            name="coverNote"
            rows={5}
            value={values.coverNote}
            onChange={updateValue("coverNote")}
            maxLength={COVER_NOTE_MAX}
            placeholder="Share a short introduction, relevant experience, or anything else that helps your application."
            className={`${inputClassName} resize-none`}
          />
          <p className={hintClassName}>
            {values.coverNote.length}/{COVER_NOTE_MAX} characters
          </p>
        </label>
      </div>

      {isReview ? (
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
          <p className="mb-1 border-b border-[color:var(--app-border)] pb-3 text-sm font-semibold text-[color:var(--app-heading)]">
            Review your application
          </p>
          <ReviewRow label="Full name" value={values.fullName} />
          <ReviewRow label="Email" value={values.email} />
          {values.phone ? <ReviewRow label="Phone" value={values.phone} /> : null}
          <ReviewRow label="Resume" value={resumeFileName ?? "No resume attached"} />
          {values.source ? (
            <ReviewRow
              label="Heard about us via"
              value={SOURCE_OPTIONS.find((o) => o.value === values.source)?.label ?? values.source}
            />
          ) : null}
          {values.source === "referral" && values.referredBy ? (
            <ReviewRow label="Referred by" value={values.referredBy} />
          ) : null}
          {values.coverNote ? <ReviewRow label="Cover note" value={values.coverNote} /> : null}
          <ReviewRow
            label="Application screening"
            value={
              hasScreening
                ? `${screening.addonCount} modules start immediately after submission`
                : "No additional questions required"
            }
          />
          <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-[color:var(--app-border)] pt-4">
            <input
              type="checkbox"
              name="consentGiven"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-400"
              required
            />
            <span className="text-sm leading-5 text-[color:var(--app-text)]">
              I agree to my personal data being processed for recruitment purposes in accordance with the{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline hover:text-[color:var(--app-heading)]"
              >
                Privacy Policy
              </a>
              <span className="ml-1 text-[color:var(--app-muted)]">
                (version {CANDIDATE_PRIVACY_POLICY_VERSION})
              </span>
              .{" "}
              <span className="text-[color:var(--app-danger)]">*</span>
            </span>
          </label>
        </div>
      ) : null}

      {draftSaved && !isReview ? (
        <div className="flex items-center justify-between gap-3">
          <p className={hintClassName}>Saved in this browser.</p>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs text-[color:var(--app-muted)] underline hover:text-[color:var(--app-text)]"
          >
            Clear draft
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={retreat}>
            Back
          </Button>
        ) : null}
        {!isReview ? (
          <Button type="button" onClick={advance}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting} className="disabled:opacity-70">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : hasScreening ? (
              "Submit and continue to screening"
            ) : (
              "Submit application"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

export function ApplicationDraftCleaner({ slug }: { slug: string }) {
  useEffect(() => {
    clearApplicationDraft(draftKey(slug));
  }, [slug]);

  return null;
}

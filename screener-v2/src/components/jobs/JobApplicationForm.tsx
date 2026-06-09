"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { QuestionRuntimeCard } from "@/components/runtime/QuestionRuntimeCard";
import { Loader2 } from "lucide-react";
import {
  clearApplicationDraft,
  draftKey,
  loadApplicationDraft,
  saveApplicationDraft,
} from "@/lib/jobs/public-application-draft";
import { validateApplicationScreeningAnswerMap } from "@/lib/jobs/application-screening";
import {
  COVER_NOTE_MAX,
  EMAIL_MAX,
  FULL_NAME_MAX,
  PHONE_MAX,
  validateProfileStep,
  validateResumeFile,
} from "@/lib/jobs/public-application-validation";
import type { ApplicationScreeningAddon, ApplicationScreeningPackage } from "@/lib/jobs/types";
import { questionRegistry } from "@/lib/question-types";

// ── Constants ─────────────────────────────────────────────────────────────────

const inputCls =
  "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 w-full";
const hintCls = "text-xs text-[color:var(--app-muted)]";

const STEPS = ["Your information", "Resume", "Additional questions", "Review"] as const;

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Application steps">
      <p className="sm:hidden text-sm text-[color:var(--app-muted)]">
        Step {current + 1} of {STEPS.length} —{" "}
        <span className="font-semibold text-[color:var(--app-text)]">{STEPS[current]}</span>
      </p>
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
                  className={`h-px w-6 flex-shrink-0 -mt-3.5 ${
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

// ── Review row ────────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[color:var(--app-border)] last:border-0">
      <span className="w-32 shrink-0 text-xs text-[color:var(--app-muted)]">{label}</span>
      <span className="text-sm text-[color:var(--app-text)] break-words min-w-0">{value}</span>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

type Vals = { fullName: string; email: string; phone: string; coverNote: string };

type ScreeningAnswers = Record<string, Record<string, unknown>>;

function getAddonBadgeText(addon: ApplicationScreeningAddon) {
  const parts = [`Pass ${addon.requiredPercent}%`];

  if (addon.weight > 0) {
    parts.push(`Weight ${addon.weight}`);
  }

  if (addon.isMandatory) {
    parts.push("Required");
  }

  return parts.join(" | ");
}

export function JobApplicationForm({
  jobSlug,
  screeningPackage,
}: {
  jobSlug: string;
  screeningPackage: ApplicationScreeningPackage | null;
}) {
  const key = draftKey(jobSlug);
  const inlineAddons = screeningPackage?.addons.filter((addon) => addon.inlineSupported) ?? [];
  const hasInlineScreening = inlineAddons.length > 0;

  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Vals>({ fullName: "", email: "", phone: "", coverNote: "" });
  const [screeningAnswers, setScreeningAnswers] = useState<ScreeningAnswers>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadApplicationDraft(key);
    if (draft) {
      setVals({
        fullName: draft.fullName,
        email: draft.email,
        phone: draft.phone,
        coverNote: draft.coverNote,
      });
      setScreeningAnswers(draft.screeningAnswers ?? {});
      setStep(draft.step);
      setDraftSaved(true);
    }
    setInitialized(true);
  }, [key]);

  // Auto-save whenever text values or step change (once initialized)
  useEffect(() => {
    if (!initialized) return;
    const hasScreeningDraft = Object.keys(screeningAnswers).length > 0;
    if (!vals.fullName && !vals.email && !vals.phone && !vals.coverNote && !hasScreeningDraft) return;
    saveApplicationDraft(key, { ...vals, screeningAnswers, step });
    setDraftSaved(true);
  }, [vals, screeningAnswers, step, key, initialized]);

  const set =
    (k: keyof Vals) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVals((v) => ({ ...v, [k]: e.target.value }));

  function updateScreeningAnswer(addonKey: string, questionId: string, value: unknown) {
    setScreeningAnswers((current) => ({
      ...current,
      [addonKey]: {
        ...(current[addonKey] ?? {}),
        [questionId]: value,
      },
    }));
  }

  function clearDraft() {
    clearApplicationDraft(key);
    setVals({ fullName: "", email: "", phone: "", coverNote: "" });
    setScreeningAnswers({});
    setStep(0);
    setStepError(null);
    setDraftSaved(false);
    if (fileRef.current) fileRef.current.value = "";
    setResumeFileName(null);
  }

  function advance() {
    if (step === 0) {
      const err = validateProfileStep(vals);
      if (err) { setStepError(err); return; }
    }
    if (step === 1) {
      const file = fileRef.current?.files?.[0];
      if (file) {
        const err = validateResumeFile(file);
        if (err) { setStepError(err); return; }
      }
    }
    if (step === 2) {
      const screeningValidation = validateApplicationScreeningAnswerMap(
        screeningPackage,
        screeningAnswers
      );
      if (!screeningValidation.ok) {
        setStepError(screeningValidation.reason);
        return;
      }
    }
    setStepError(null);
    setStep((s) => s + 1);
  }

  function retreat() {
    setStepError(null);
    setStep((s) => s - 1);
  }

  function isScreeningQuestionComplete(
    addon: ApplicationScreeningAddon,
    question: ApplicationScreeningAddon["questions"][number]
  ) {
    const definition = questionRegistry[question.format];
    if (!definition) {
      return false;
    }

    return definition.validateAnswer(
      question as never,
      screeningAnswers[addon.key]?.[question.id] as never
    ).ok;
  }

  const screeningQuestionCount = inlineAddons.reduce(
    (total, addon) => total + addon.questions.length,
    0
  );
  const completedScreeningQuestionCount = inlineAddons.reduce(
    (total, addon) =>
      total +
      addon.questions.filter((question) => isScreeningQuestionComplete(addon, question)).length,
    0
  );
  const isReview = step === STEPS.length - 1;

  return (
    <form
      action={`/api/jobs/${jobSlug}/apply`}
      method="post"
      encType="multipart/form-data"
      className="space-y-5"
      onSubmit={() => setIsSubmitting(true)}
    >
      <StepIndicator current={step} />
      <input
        type="hidden"
        name="screeningAnswers"
        value={JSON.stringify(screeningAnswers)}
      />

      {stepError && (
        <p
          role="alert"
          className="rounded-[14px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {stepError}
        </p>
      )}

      {/* ── Step 0: Profile ── */}
      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            Full name <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="fullName"
            value={vals.fullName}
            onChange={set("fullName")}
            maxLength={FULL_NAME_MAX}
            placeholder="Jane Doe"
            autoComplete="name"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">
            Email <span className="text-[color:var(--app-danger)]">*</span>
          </span>
          <input
            name="email"
            type="email"
            value={vals.email}
            onChange={set("email")}
            maxLength={EMAIL_MAX}
            placeholder="jane@example.com"
            autoComplete="email"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Phone (optional)</span>
          <input
            name="phone"
            value={vals.phone}
            onChange={set("phone")}
            maxLength={PHONE_MAX}
            placeholder="+94 77 123 4567"
            autoComplete="tel"
            className={inputCls}
          />
        </label>
      </div>

      {/* ── Step 1: Resume — kept in DOM so file persists across steps and submits ── */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Resume (optional)</span>
          <input
            ref={fileRef}
            name="resume"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setResumeFileName(e.target.files?.[0]?.name ?? null)}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]"
          />
          <p className={hintCls}>
            PDF only, max 5 MB. Resume files are not saved in browser drafts. Reattach your resume
            before submitting.
          </p>
        </label>
      </div>

      {/* ── Step 2: Questions ── */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Additional questions</p>
          <p className={hintCls}>
            {hasInlineScreening
              ? "Complete the required screening items before reviewing your application."
              : "No additional questions are required for this role."}
          </p>
        </div>
        {hasInlineScreening ? (
          <div className="space-y-4">
            {inlineAddons.map((addon) => (
              <section
                key={addon.key}
                className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
                      {addon.addonLabel}
                    </h3>
                    <p className="text-sm text-[color:var(--app-muted)]">{addon.configSummary}</p>
                  </div>
                  <div className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1 text-xs font-medium text-[color:var(--app-muted)]">
                    {getAddonBadgeText(addon)}
                  </div>
                </div>

                <div className="space-y-4">
                  {addon.questions.map((question, index) => (
                    <QuestionRuntimeCard
                      key={`${addon.key}:${question.id}`}
                      question={question}
                      answer={screeningAnswers[addon.key]?.[question.id]}
                      onChange={(value) => updateScreeningAnswer(addon.key, question.id, value)}
                      questionIndex={index}
                      questionCount={addon.questions.length}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Cover note (optional)</span>
          <textarea
            name="coverNote"
            rows={5}
            value={vals.coverNote}
            onChange={set("coverNote")}
            maxLength={COVER_NOTE_MAX}
            placeholder="Share a short introduction, relevant experience, or anything else that helps your application."
            className={`${inputCls} resize-none`}
          />
          <p className={hintCls}>{vals.coverNote.length}/{COVER_NOTE_MAX} characters.</p>
        </label>
      </div>

      {/* ── Step 3: Review ── */}
      {isReview && (
        <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
          <p className="text-sm font-semibold text-[color:var(--app-heading)] pb-3 mb-1 border-b border-[color:var(--app-border)]">
            Review your application
          </p>
          <ReviewRow label="Full name" value={vals.fullName} />
          <ReviewRow label="Email" value={vals.email} />
          {vals.phone && <ReviewRow label="Phone" value={vals.phone} />}
          <ReviewRow label="Resume" value={resumeFileName ?? "No resume attached"} />
          {vals.coverNote && (
            <ReviewRow
              label="Cover note"
              value={
                vals.coverNote.length > 120
                  ? `${vals.coverNote.slice(0, 120)}…`
                  : vals.coverNote
              }
            />
          )}
          <ReviewRow
            label="Application screening"
            value={
              screeningQuestionCount > 0
                ? `${completedScreeningQuestionCount} of ${screeningQuestionCount} questions completed`
                : "No additional questions required"
            }
          />
          {hasInlineScreening ? (
            <div className="space-y-3 pt-3">
              {inlineAddons.map((addon) => (
                <div
                  key={`review:${addon.key}`}
                  className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">
                        {addon.addonLabel}
                      </p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {getAddonBadgeText(addon)}
                      </p>
                    </div>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      {
                        addon.questions.filter((question) =>
                          isScreeningQuestionComplete(addon, question)
                        ).length
                      }{" "}
                      of {addon.questions.length} answered
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <p className="pt-3 text-xs text-[color:var(--app-muted)]">
            By submitting, you are sharing this information with the hiring team for review on this
            role.
          </p>
        </div>
      )}

      {/* ── Draft saved hint ── */}
      {draftSaved && !isReview && (
        <div className="flex items-center justify-between gap-3">
          <p className={hintCls}>Saved in this browser.</p>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs text-[color:var(--app-muted)] underline hover:text-[color:var(--app-text)]"
          >
            Clear draft
          </button>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex flex-wrap gap-3 pt-1">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={retreat}>
            Back
          </Button>
        )}
        {!isReview && (
          <Button type="button" onClick={advance}>
            Continue
          </Button>
        )}
        {isReview && (
          <Button type="submit" disabled={isSubmitting} className="disabled:opacity-70">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

// ── Draft cleaner — rendered in the success state to clear the saved draft ────

export function ApplicationDraftCleaner({ slug }: { slug: string }) {
  useEffect(() => {
    clearApplicationDraft(draftKey(slug));
  }, [slug]);
  return null;
}

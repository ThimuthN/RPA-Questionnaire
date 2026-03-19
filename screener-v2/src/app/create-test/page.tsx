"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type {
  ExamBlueprintDraftItem,
  ExamConfigFieldDefinition,
  ExamDefinitionId
} from "@/lib/assessment-engine/types";
import {
  InviteCredentialsPanel,
  type InviteCredentials
} from "@/components/access/InviteCredentialsPanel";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StepRail } from "@/components/primitives/StepRail";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  defaultDraftForDefinition,
  deriveExamSelectionMetadata,
  examCatalog,
  orderedExamCatalog
} from "@/lib/exams/catalog";

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
}

type WizardStep = "select" | "configure" | "calibrate" | "share";

interface PreviewExam extends ExamBlueprintDraftItem {
  label: string;
  configSummary: string;
  durationMinutes: number;
  requiredPercent: number;
  validity: { valid: boolean; messages: string[] };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function fieldValid(field: ExamConfigFieldDefinition, value: unknown) {
  if (!field.required) return true;
  if (field.type === "single_select") return typeof value === "string" && value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}

function validateExam(definitionId: ExamDefinitionId, config: Record<string, unknown>) {
  const entry = examCatalog[definitionId];
  const messages = entry.configFields
    .filter((field) => !fieldValid(field, config[field.key]))
    .map((field) =>
      field.type === "multi_select"
        ? `${entry.label} needs at least one ${field.label.toLowerCase()} selected.`
        : `${entry.label} needs ${field.label.toLowerCase()}.`
    );
  return { valid: messages.length === 0, messages };
}

function ConfigField({
  field,
  value,
  onChange
}: {
  field: ExamConfigFieldDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const selectedValues = Array.isArray(value) ? value.map(String) : [];
  const singleValue = typeof value === "string" ? value : "";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-slate-100">{field.label}</p>
        {field.description ? <p className="text-xs text-slate-400">{field.description}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const active =
            field.type === "multi_select"
              ? selectedValues.includes(option.value)
              : singleValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (field.type === "multi_select") {
                  onChange(
                    active
                      ? selectedValues.filter((item) => item !== option.value)
                      : [...selectedValues, option.value]
                  );
                  return;
                }
                onChange(option.value);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                active
                  ? "border-brand-300 bg-brand-500/18 text-white shadow-[0_14px_32px_rgba(31,111,255,0.18)]"
                  : "border-white/16 bg-white/[0.05] text-slate-200 hover:border-brand-300/50 hover:bg-white/[0.08]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScoreMixBar({ exams, total }: { exams: PreviewExam[]; total: number }) {
  const remaining = Math.max(0, 100 - total);

  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
        <div className="flex h-full">
          {exams.map((exam) => (
            <div
              key={exam.definitionId}
              className={
                exam.definitionId === "core_exam"
                  ? "bg-[linear-gradient(90deg,rgba(47,134,255,0.95),rgba(93,167,255,0.92))]"
                  : exam.definitionId === "practical_exam"
                    ? "bg-[linear-gradient(90deg,rgba(18,179,168,0.95),rgba(93,223,205,0.9))]"
                    : exam.definitionId === "applied_logic_exam"
                      ? "bg-[linear-gradient(90deg,rgba(148,93,255,0.95),rgba(188,148,255,0.88))]"
                      : "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]"
              }
              style={{ width: `${Math.max(0, exam.weight ?? 0)}%` }}
            />
          ))}
          {remaining > 0 ? (
            <div className="h-full bg-white/[0.08]" style={{ width: `${remaining}%` }} />
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {exams.map((exam) => (
          <StatusPill
            key={exam.definitionId}
            label={`${exam.label} ${exam.weight}/100`}
            tone={examCatalog[exam.definitionId].accentTone}
            className="normal-case tracking-normal"
          />
        ))}
      </div>
    </div>
  );
}

export default function CreateTestPage() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedExams, setSelectedExams] = useState<ExamBlueprintDraftItem[]>([]);
  const [expandedExamIds, setExpandedExamIds] = useState<ExamDefinitionId[]>([]);
  const [passTarget, setPassTarget] = useState(60);
  const [invite, setInvite] = useState<(InviteCredentials & { slug: string; inviteId: string }) | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const previewExams = useMemo<PreviewExam[]>(
    () =>
      selectedExams.map((exam) => {
        const meta = deriveExamSelectionMetadata(exam.definitionId, exam.config ?? {}, passTarget);
        return {
          ...exam,
          label: meta.label,
          configSummary: meta.configSummary,
          durationMinutes: meta.durationMinutes,
          requiredPercent:
            typeof exam.requiredPercent === "number" ? exam.requiredPercent : meta.requiredPercent,
          validity: validateExam(exam.definitionId, exam.config ?? {})
        };
      }),
    [passTarget, selectedExams]
  );

  const totalContribution = previewExams.reduce((sum, exam) => sum + Number(exam.weight || 0), 0);
  const totalTimeMinutes = previewExams.reduce((sum, exam) => sum + exam.durationMinutes, 0);
  const validExamMessages = previewExams.flatMap((exam) => exam.validity.messages);
  const contributionMessage =
    totalContribution < 100
      ? `You still need ${100 - totalContribution} marks allocated.`
      : totalContribution > 100
        ? `Reduce score contribution by ${totalContribution - 100} marks.`
        : "Score contribution is balanced at 100/100.";
  const contributionTone: "emerald" | "amber" | "red" =
    totalContribution === 100 ? "emerald" : totalContribution > 100 ? "red" : "amber";
  const canGenerate =
    previewExams.length > 0 && totalContribution === 100 && validExamMessages.length === 0;
  const testId = invite?.slug ? invite.slug.toUpperCase() : "--";
  const transition = reduceMotion ? undefined : { duration: 0.18 };

  function toggleExam(definitionId: ExamDefinitionId) {
    setSelectedExams((prev) => {
      if (prev.some((exam) => exam.definitionId === definitionId)) {
        const next = prev.filter((exam) => exam.definitionId !== definitionId);
        setExpandedExamIds((current) => current.filter((id) => id !== definitionId));
        setStep(next.length > 0 ? "configure" : "select");
        return next;
      }

      const next = [...prev, defaultDraftForDefinition(definitionId)];
      setExpandedExamIds((current) => [...new Set([...current, definitionId])]);
      setStep("configure");
      setError("");
      return next;
    });
  }

  function removeExam(definitionId: ExamDefinitionId) {
    setSelectedExams((prev) => prev.filter((exam) => exam.definitionId !== definitionId));
    setExpandedExamIds((current) => current.filter((id) => id !== definitionId));
    setError("");
  }

  function updateExam(
    definitionId: ExamDefinitionId,
    updater: (current: ExamBlueprintDraftItem) => ExamBlueprintDraftItem
  ) {
    setSelectedExams((prev) =>
      prev.map((exam) => (exam.definitionId === definitionId ? updater(exam) : exam))
    );
  }

  function toggleAccordion(definitionId: ExamDefinitionId) {
    setExpandedExamIds((prev) =>
      prev.includes(definitionId) ? prev.filter((id) => id !== definitionId) : [...prev, definitionId]
    );
  }

  async function onGenerateAccess() {
    if (!canGenerate) {
      setError("Complete the required settings and make sure score contribution totals 100.");
      setStep("calibrate");
      return;
    }

    setLoading(true);
    setError("");
    setInvite(null);

    const response = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentVersionId: "v1-default",
        mode: "candidate",
        roleLocked: true,
        stackLocked: true,
        passTarget,
        blueprint: {
          exams: previewExams.map((exam) => ({
            definitionId: exam.definitionId,
            config: exam.config,
            weight: exam.weight,
            requiredPercent: exam.requiredPercent
          }))
        },
        withPasscode: true,
        maxAttempts: 1
      })
    });

    const data = (await response.json()) as CreateInviteSuccess | CreateInviteError;
    if (data.ok) {
      setInvite({
        entryUrl: data.entryUrl,
        token: data.token,
        passcode: data.passcode,
        slug: data.slug,
        inviteId: data.inviteId
      });
      setStep("share");
    } else {
      setError(data.message || "Could not generate access.");
    }

    setLoading(false);
  }

  function onStartNow() {
    if (!invite) return;
    const separator = invite.entryUrl.includes("?") ? "&" : "?";
    const pass = invite.passcode ? `&passcode=${encodeURIComponent(invite.passcode)}` : "";
    window.location.assign(`${invite.entryUrl}${separator}startNow=1${pass}`);
  }

  const summaryContent = (
    <StagePanel className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Live summary</p>
          <h2 className="text-2xl text-white">Assessment blueprint</h2>
        </div>
        <StatusPill label={`${previewExams.length} exams`} tone="blue" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Test ID</p>
          <p className="mt-2 font-mono text-lg text-white">{testId}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Summary</p>
          <p className="mt-2 text-lg text-white">
            {previewExams.length} exams / {totalTimeMinutes} min
          </p>
          <p className="mt-1 text-sm text-slate-300">This assessment is worth 100 marks in total.</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Overall pass</p>
          <p className="mt-2 text-lg text-white">{passTarget}%</p>
          <p className="mt-1 text-sm text-slate-300">Final weighted score needed across all exams.</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total time</p>
          <p className="mt-2 text-lg text-white">{totalTimeMinutes} min</p>
          <p className="mt-1 text-sm text-slate-300">Time grows automatically as exams are added.</p>
        </div>
      </div>

      <div className="space-y-3 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-100">Score mix</p>
          <StatusPill label={`${totalContribution}/100`} tone={contributionTone} />
        </div>
        <ScoreMixBar exams={previewExams} total={totalContribution} />
        <p
          className={`text-sm ${
            contributionTone === "emerald"
              ? "text-emerald-200"
              : contributionTone === "red"
                ? "text-red-200"
                : "text-amber-200"
          }`}
        >
          {contributionMessage}
        </p>
      </div>

      <div className="space-y-2 rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-slate-100">How scoring works</p>
        <p className="text-sm leading-6 text-slate-300">
          Each exam is scored out of 100, then converted into its allocated marks. If an exam is worth
          30 marks and the candidate scores 80%, it contributes 24 marks to the final score.
        </p>
      </div>
      {previewExams.length > 0 ? (
        <div className="space-y-3">
          {previewExams.map((exam, index) => (
            <div key={exam.definitionId} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={`#${index + 1}`} tone="neutral" />
                <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
              </div>
              <p className="mt-3 text-sm text-slate-100">{exam.configSummary}</p>
              <p className="mt-2 text-xs text-slate-400">
                {exam.durationMinutes}m | {exam.weight}/100 marks | Minimum pass {exam.requiredPercent}%
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {invite ? <InviteCredentialsPanel invite={invite} testId={testId} openLabel="Open test now" /> : null}
    </StagePanel>
  );

  return (
    <SceneShell
      variant="create"
      eyebrow="Create assessment"
      title="Build a 100-mark assessment"
      subtitle="Choose the exams, configure each one, then split 100 total marks across them in a way that feels clear and fair."
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${previewExams.length} exams`} tone="blue" />
          <StatusPill label={`${totalTimeMinutes}m total`} tone="neutral" />
          <StatusPill label={`${totalContribution}/100 marks`} tone={contributionTone} />
        </div>
      }
    >
      <div className="space-y-4">
        <StepRail
          activeId={step}
          className="md:grid-cols-4"
          steps={[
            { id: "select", label: "Select" },
            { id: "configure", label: "Configure" },
            { id: "calibrate", label: "Calibrate" },
            { id: "share", label: "Share" }
          ]}
        />

        <div className="xl:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-[20px] border border-white/12 bg-white/[0.05] px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Summary</p>
              <p className="text-sm text-slate-200">
                {previewExams.length} exams, {totalContribution}/100 marks, {totalTimeMinutes} min
              </p>
            </div>
            <StatusPill label={summaryOpen ? "Hide" : "Show"} tone="neutral" />
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen ? (
              <motion.div
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                transition={transition}
                className="overflow-hidden pt-4"
              >
                {summaryContent}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 1</p>
                  <h2 className="text-2xl text-white">Select exams</h2>
                  <p className="text-sm text-slate-300">Click a card to add it. Click again to remove it.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setStep("configure")}
                  disabled={previewExams.length === 0}
                >
                  Configure selected
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {orderedExamCatalog.map((exam) => {
                  const active = previewExams.some((item) => item.definitionId === exam.id);
                  return (
                    <motion.button
                      key={exam.id}
                      type="button"
                      onClick={() => toggleExam(exam.id)}
                      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                      layout={!reduceMotion}
                      transition={transition}
                      className={`group rounded-[24px] border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                        active
                          ? "border-brand-300 bg-[linear-gradient(180deg,rgba(47,134,255,0.18),rgba(255,255,255,0.04))] shadow-[0_24px_48px_rgba(31,111,255,0.16)]"
                          : "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:border-brand-300/40 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <StatusPill label={exam.label} tone={exam.accentTone} />
                          {active ? <StatusPill label="Selected" tone="emerald" /> : null}
                        </div>
                        <p className="text-sm leading-6 text-slate-200">{exam.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label={`${exam.defaultWeight} suggested marks`} tone="neutral" />
                          <StatusPill label={`${exam.buildDurationMinutes(exam.defaultConfig)}m`} tone="neutral" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-100">Selected exams</p>
                  <StatusPill label={`${previewExams.length} selected`} tone="neutral" />
                </div>
                {previewExams.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    <AnimatePresence initial={false}>
                      {previewExams.map((exam, index) => (
                        <motion.div
                          key={exam.definitionId}
                          layout={!reduceMotion}
                          transition={transition}
                          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                          exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                          className="min-w-[220px] flex-1 rounded-[20px] border border-white/12 bg-black/20 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill label={`#${index + 1}`} tone="neutral" />
                            <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                          </div>
                          <p className="mt-3 text-sm text-slate-100">{exam.configSummary}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {exam.durationMinutes}m | {exam.weight}/100 marks
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedExams((prev) => moveItem(prev, index, -1))}
                              disabled={index === 0}
                            >
                              Up
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedExams((prev) => moveItem(prev, index, 1))}
                              disabled={index === previewExams.length - 1}
                            >
                              Down
                            </Button>
                            <Button variant="ghost" onClick={() => removeExam(exam.definitionId)}>
                              Remove
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-300">No exams selected yet.</p>
                  </div>
                )}
              </div>
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 2</p>
                  <h2 className="text-2xl text-white">Exam settings</h2>
                  <p className="text-sm text-slate-300">Expand a card to adjust only that exam.</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setStep("calibrate")}
                  disabled={previewExams.length === 0}
                >
                  Calibrate scoring
                </Button>
              </div>
              {previewExams.length > 0 ? (
                <div className="space-y-3">
                  {previewExams.map((exam, index) => {
                    const expanded = expandedExamIds.includes(exam.definitionId);

                    return (
                      <motion.div
                        key={exam.definitionId}
                        layout={!reduceMotion}
                        transition={transition}
                        className="overflow-hidden rounded-[24px] border border-white/12 bg-black/15"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(exam.definitionId)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={`#${index + 1}`} tone="neutral" />
                              <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                              <StatusPill
                                label={exam.validity.valid ? "Ready" : "Needs settings"}
                                tone={exam.validity.valid ? "emerald" : "amber"}
                              />
                            </div>
                            <p className="text-sm text-slate-100">{exam.configSummary}</p>
                            <p className="text-xs text-slate-400">
                              {exam.durationMinutes}m | Score contribution {exam.weight}/100 | Minimum
                              pass {exam.requiredPercent}%
                            </p>
                          </div>
                          <StatusPill label={expanded ? "Collapse" : "Expand"} tone="neutral" />
                        </button>

                        <AnimatePresence initial={false}>
                          {expanded ? (
                            <motion.div
                              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                              animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                              transition={transition}
                              className="border-t border-white/10"
                            >
                              <div className="space-y-5 p-5">
                                {exam.validity.messages.length > 0 ? (
                                  exam.validity.messages.map((message) => (
                                    <p
                                      key={`${exam.definitionId}-${message}`}
                                      className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                                    >
                                      {message}
                                    </p>
                                  ))
                                ) : (
                                  <p className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                                    This exam is fully configured.
                                  </p>
                                )}

                                {examCatalog[exam.definitionId].configFields.length > 0 ? (
                                  examCatalog[exam.definitionId].configFields.map((field) => (
                                    <ConfigField
                                      key={field.key}
                                      field={field}
                                      value={(exam.config ?? {})[field.key]}
                                      onChange={(next) =>
                                        updateExam(exam.definitionId, (current) => ({
                                          ...current,
                                          config: { ...(current.config ?? {}), [field.key]: next }
                                        }))
                                      }
                                    />
                                  ))
                                ) : (
                                  <p className="text-sm text-slate-300">
                                    This exam does not need additional settings.
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <Button variant="ghost" onClick={() => removeExam(exam.definitionId)}>
                                    Remove exam
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-300">Select an exam to begin configuring it.</p>
                </div>
              )}
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 3</p>
                  <h2 className="text-2xl text-white">Score contribution</h2>
                  <p className="text-sm text-slate-300">
                    Allocate 100 total marks across the exams, then set each exam&apos;s minimum pass.
                  </p>
                </div>
                <StatusPill label={`${totalContribution}/100 total`} tone={contributionTone} />
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm leading-6 text-slate-300">
                  Each exam is marked out of 100 internally, then converted into its score contribution.
                  Example: 80% on a 30-mark exam becomes 24 marks toward the final score.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-3">
                  {previewExams.length > 0 ? (
                    previewExams.map((exam, index) => (
                      <motion.div
                        key={exam.definitionId}
                        layout={!reduceMotion}
                        transition={transition}
                        className="rounded-[22px] border border-white/12 bg-black/15 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={`#${index + 1}`} tone="neutral" />
                              <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                            </div>
                            <p className="text-sm text-slate-100">{exam.configSummary}</p>
                            <p className="text-xs text-slate-400">{exam.durationMinutes} minutes</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedExams((prev) => moveItem(prev, index, -1))}
                              disabled={index === 0}
                            >
                              Up
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedExams((prev) => moveItem(prev, index, 1))}
                              disabled={index === previewExams.length - 1}
                            >
                              Down
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Score contribution
                            </span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={exam.weight ?? 0}
                              onChange={(event) =>
                                updateExam(exam.definitionId, (current) => ({
                                  ...current,
                                  weight: Math.max(1, Math.round(Number(event.target.value) || 0))
                                }))
                              }
                              className="w-full rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Minimum pass for this exam
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={exam.requiredPercent}
                              onChange={(event) =>
                                updateExam(exam.definitionId, (current) => ({
                                  ...current,
                                  requiredPercent: Math.min(
                                    100,
                                    Math.max(0, Math.round(Number(event.target.value) || 0))
                                  )
                                }))
                              }
                              className="w-full rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                            />
                          </label>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Select at least one exam before allocating marks.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-[22px] border border-white/12 bg-black/15 p-4">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Overall pass</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={passTarget}
                      onChange={(event) =>
                        setPassTarget(
                          Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0)))
                        )
                      }
                      className="w-full rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                    />
                  </label>
                  <p className="text-sm leading-6 text-slate-300">
                    Candidates need this final weighted score plus any exam-level minimum passes to pass overall.
                  </p>
                  <div
                    className={`rounded-[16px] border px-4 py-3 text-sm ${
                      contributionTone === "emerald"
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                        : contributionTone === "red"
                          ? "border-red-400/30 bg-red-500/10 text-red-100"
                          : "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    }`}
                  >
                    {contributionMessage}
                  </div>
                </div>
              </div>
              {validExamMessages.length > 0 ? (
                <div className="space-y-2">
                  {validExamMessages.map((message) => (
                    <p
                      key={message}
                      className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                    >
                      {message}
                    </p>
                  ))}
                </div>
              ) : null}
              {error ? (
                <p className="rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={onGenerateAccess} disabled={loading || !canGenerate}>
                  {loading ? "Generating..." : "Generate access"}
                </Button>
                <Button variant="secondary" onClick={() => setStep("share")} disabled={!invite}>
                  Review share step
                </Button>
              </div>
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 4</p>
                <h2 className="text-2xl text-white">Share</h2>
                <p className="text-sm text-slate-300">
                  Generate an access link, copy the details, or jump straight into the test flow.
                </p>
              </div>

              {invite ? (
                <div className="space-y-4">
                  <InviteCredentialsPanel invite={invite} testId={testId} openLabel="Open test now" />
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={onStartNow}>Launch test</Button>
                    <Button variant="secondary" onClick={() => setStep("select")}>
                      Build another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-300">
                    Access details will appear here after the assessment has a full 100-mark allocation and
                    all required settings are complete.
                  </p>
                </div>
              )}
            </StagePanel>
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-24">{summaryContent}</div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

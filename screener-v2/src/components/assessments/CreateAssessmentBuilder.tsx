"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import type { AddonCatalogEntry, AssessmentPresetEntry } from "@/lib/addons/catalog";
import { buildDraftFromAddon, buildDraftsFromPreset } from "@/lib/addons/catalog";
import type {
  ExamBlueprintDraftItem,
  ExamConfigFieldDefinition,
  IntegrityPresetId
} from "@/lib/assessment-engine/types";
import {
  InviteCredentialsPanel,
  type InviteCredentials
} from "@/components/access/InviteCredentialsPanel";
import { IntegrityPresetPicker } from "@/components/access/IntegrityPresetPicker";
import { ConfigFieldEditor } from "@/components/addons/ConfigFieldEditor";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StepRail } from "@/components/primitives/StepRail";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  deriveExamSelectionMetadata,
  examCatalog,
  examPanelClass,
  examScoreBarClass
} from "@/lib/exams/catalog";
import { integrityPresetMeta } from "@/lib/integrity/policy";
import { cn } from "@/lib/utils";

interface CreateInviteSuccess extends InviteCredentials {
  ok: true;
  inviteId: string;
  slug: string;
}

interface CreateInviteError {
  ok: false;
  message?: string;
}

type WizardStep = "select" | "customize" | "calibrate" | "share";
type SelectionSource = "presets" | "library";

interface PreviewExam extends ExamBlueprintDraftItem {
  key: string;
  label: string;
  configSummary: string;
  durationMinutes: number;
  requiredPercent: number;
  validity: { valid: boolean; messages: string[] };
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampDuration(value: number) {
  return Math.max(1, Math.round(value));
}

function compactAddonDescription(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 72) return trimmed;
  return `${trimmed.slice(0, 69).trimEnd()}...`;
}

function examKey(exam: ExamBlueprintDraftItem, index: number) {
  return exam.sourceAddonId ?? `${exam.definitionId}-${index}`;
}

function fieldValid(field: ExamConfigFieldDefinition, value: unknown) {
  if (!field.required) return true;
  if (field.type === "single_select") {
    return typeof value === "string" && value.trim().length > 0;
  }
  return Array.isArray(value) && value.length > 0;
}

function validateExam(definitionId: PreviewExam["definitionId"], config: Record<string, unknown>) {
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

function derivePreviewExam(exam: ExamBlueprintDraftItem, index: number): PreviewExam {
  const meta = deriveExamSelectionMetadata(exam.definitionId, exam.config ?? {}, exam.requiredPercent ?? 60);
  return {
    ...exam,
    key: examKey(exam, index),
    label: exam.label?.trim() || meta.label,
    configSummary: meta.configSummary,
    durationMinutes:
      typeof exam.durationMinutes === "number" && Number.isFinite(exam.durationMinutes)
        ? clampDuration(exam.durationMinutes)
        : meta.durationMinutes,
    requiredPercent:
      typeof exam.requiredPercent === "number" ? clampPercent(exam.requiredPercent) : meta.requiredPercent,
    validity: validateExam(exam.definitionId, exam.config ?? {})
  };
}

function rebalanceWeights(exams: PreviewExam[]) {
  const manualWeightTotal = exams.reduce(
    (sum, exam) => sum + (exam.weightMode === "manual" ? Math.max(0, Number(exam.weight ?? 0)) : 0),
    0
  );
  const autoExams = exams.filter((exam) => exam.weightMode !== "manual");
  if (autoExams.length === 0) {
    return exams.map((exam) => ({
      ...exam,
      weight: Math.max(0, Math.round(Number(exam.weight ?? 0)))
    }));
  }

  const remaining = Math.max(0, 100 - manualWeightTotal);
  const totalAutoMinutes = autoExams.reduce((sum, exam) => sum + exam.durationMinutes, 0) || autoExams.length;
  let assigned = 0;

  return exams.map((exam) => {
    if (exam.weightMode === "manual") {
      return {
        ...exam,
        weight: Math.max(0, Math.round(Number(exam.weight ?? 0)))
      };
    }

    const autoIndex = autoExams.findIndex((item) => item.key === exam.key);
    const nextWeight =
      autoIndex === autoExams.length - 1
        ? remaining - assigned
        : Math.max(0, Math.round((remaining * exam.durationMinutes) / totalAutoMinutes));
    assigned += nextWeight;

    return {
      ...exam,
      weight: Math.max(0, nextWeight)
    };
  });
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

function ScoreMixBar({ exams, total }: { exams: PreviewExam[]; total: number }) {
  const remaining = Math.max(0, 100 - total);

  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)]">
        <div className="flex h-full">
          {exams.map((exam) => (
            <div
              key={exam.key}
              className={examScoreBarClass(exam.definitionId)}
              style={{ width: `${Math.max(0, exam.weight ?? 0)}%` }}
            />
          ))}
          {remaining > 0 ? (
            <div className="h-full bg-[color:var(--app-border)]" style={{ width: `${remaining}%` }} />
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {exams.map((exam) => (
          <StatusPill
            key={exam.key}
            label={`${exam.label} ${exam.weight}/100`}
            tone={examCatalog[exam.definitionId].accentTone}
            className="normal-case tracking-normal"
          />
        ))}
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  description,
  action
}: {
  step: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] pb-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-300">{step}</p>
        <h2 className="text-2xl text-[color:var(--app-heading)]">{title}</h2>
        <p className="max-w-2xl text-sm text-[color:var(--app-muted)]">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

function SelectionMetric({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "blue" | "purple" | "teal";
}) {
  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 shadow-[var(--app-shadow-soft)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-lg text-[color:var(--app-heading)]">{value}</p>
        <StatusPill label={label} tone={tone} className="normal-case tracking-normal" />
      </div>
    </div>
  );
}

function BuilderMetaBand({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-3 shadow-[var(--app-shadow-soft)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function BuilderStage({
  children,
  className,
  emphasis = "secondary"
}: {
  children: ReactNode;
  className?: string;
  emphasis?: "primary" | "secondary";
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] ${
        emphasis === "primary"
          ? "border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] px-5 py-5 shadow-[var(--app-shadow)]"
          : "border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-5 py-5 shadow-[var(--app-shadow-soft)]"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

export function CreateAssessmentBuilder({
  initialAddons,
  initialPresets,
  linkedCandidateId,
  linkedCandidateMilestoneId
}: {
  initialAddons: AddonCatalogEntry[];
  initialPresets: AssessmentPresetEntry[];
  linkedCandidateId?: string;
  linkedCandidateMilestoneId?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedExams, setSelectedExams] = useState<ExamBlueprintDraftItem[]>([]);
  const [passTarget, setPassTarget] = useState(60);
  const [integrityPreset, setIntegrityPreset] = useState<IntegrityPresetId>("standard");
  const [configuringAddonId, setConfiguringAddonId] = useState<string | null>(null);
  const [configuringExam, setConfiguringExam] = useState<ExamBlueprintDraftItem | null>(null);
  const [invite, setInvite] = useState<(InviteCredentials & { slug: string; inviteId: string }) | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectionSource, setSelectionSource] = useState<SelectionSource>(
    initialPresets.some((preset) => preset.isActive) ? "presets" : "library"
  );
  const transition = reduceMotion ? undefined : { duration: 0.18 };

  const activeAddons = useMemo(
    () =>
      initialAddons
        .filter((addon) => addon.isActive)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [initialAddons]
  );
  const activePresets = useMemo(
    () =>
      initialPresets
        .filter((preset) => preset.isActive)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [initialPresets]
  );
  const addonLookup = useMemo(
    () => new Map(initialAddons.map((addon) => [addon.id, addon])),
    [initialAddons]
  );

  const previewExams = useMemo(
    () => rebalanceWeights(selectedExams.map((exam, index) => derivePreviewExam(exam, index))),
    [selectedExams]
  );

  const totalContribution = previewExams.reduce((sum, exam) => sum + Number(exam.weight || 0), 0);
  const totalTimeMinutes = previewExams.reduce((sum, exam) => sum + exam.durationMinutes, 0);
  const hasZeroContributionExams = previewExams.some((exam) => Number(exam.weight ?? 0) <= 0);
  const validExamMessages = previewExams.flatMap((exam) =>
    exam.validity.messages.map((message) => `${exam.label}: ${message}`)
  );
  const contributionMessage =
    totalContribution < 100
      ? `You still need ${100 - totalContribution} marks allocated.`
      : totalContribution > 100
        ? `Reduce score contribution by ${totalContribution - 100} marks.`
        : "Score contribution is balanced at 100/100.";
  const contributionTone: "emerald" | "amber" | "red" =
    totalContribution === 100 ? "emerald" : totalContribution > 100 ? "red" : "amber";
  const canGenerate =
    previewExams.length > 0 &&
    totalContribution === 100 &&
    validExamMessages.length === 0 &&
    !hasZeroContributionExams;
  const testId = invite?.slug ? invite.slug.toUpperCase() : "--";
  const examsNeedingSetup = previewExams.filter((exam) => {
    const configFields = examCatalog[exam.definitionId].configFields;
    return configFields.length > 0 || !exam.validity.valid;
  }).length;
  const examsReadyAsIs = Math.max(0, previewExams.length - examsNeedingSetup);
  const showSelectDetail = step === "select";
  const showCustomizeDetail = step === "customize";
  const showCalibrateDetail = step === "calibrate";
  const showShareDetail = step === "share";
  const stepIds: WizardStep[] = ["select", "customize", "calibrate", "share"];
  const visibleStepIds = stepIds.slice(0, Math.max(1, stepIds.indexOf(step) + 1));

  function beginAddonConfig(addon: AddonCatalogEntry) {
    const existing = selectedExams.find((exam) => exam.sourceAddonId === addon.id);
    setSelectedPresetId(null);
    setConfiguringAddonId(addon.id);
    setConfiguringExam(existing ? structuredClone(existing) : buildDraftFromAddon(addon));
    setError("");
  }

  function removeSelectedAddon(addonId: string) {
    setSelectedPresetId(null);
    setSelectedExams((current) => current.filter((exam) => exam.sourceAddonId !== addonId));
    if (configuringAddonId === addonId) {
      setConfiguringAddonId(null);
      setConfiguringExam(null);
    }
  }

  function applyConfiguredAddon() {
    if (!configuringAddonId || !configuringExam) return;

    setSelectedPresetId(null);
    setSelectedExams((current) => {
      const exists = current.some((exam) => exam.sourceAddonId === configuringAddonId);
      if (exists) {
        return current.map((exam) =>
          exam.sourceAddonId === configuringAddonId ? structuredClone(configuringExam) : exam
        );
      }
      return [...current, structuredClone(configuringExam)];
    });
    setConfiguringAddonId(null);
    setConfiguringExam(null);
  }

  function applyPreset(preset: AssessmentPresetEntry) {
    const drafts = buildDraftsFromPreset(preset);
    setSelectedPresetId(preset.id);
    setSelectedExams(drafts);
    setConfiguringAddonId(null);
    setConfiguringExam(null);
    setInvite(null);
    setError("");
  }

  function updateExam(
    key: string,
    updater: (current: ExamBlueprintDraftItem) => ExamBlueprintDraftItem
  ) {
    setSelectedExams((current) =>
      current.map((exam, index) => (examKey(exam, index) === key ? updater(exam) : exam))
    );
    setSelectedPresetId(null);
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
        contextType: linkedCandidateId ? "hiring" : "general",
        candidateId: linkedCandidateId,
        candidateMilestoneId: linkedCandidateMilestoneId,
        integrityPreset,
        roleLocked: true,
        stackLocked: true,
        passTarget,
        blueprint: {
          exams: previewExams.map((exam) => ({
            definitionId: exam.definitionId,
            sourceAddonId: exam.sourceAddonId,
            sourcePresetId: exam.sourcePresetId,
            label: exam.label,
            description: exam.description,
            config: exam.config,
            durationMinutes: exam.durationMinutes,
            weight: exam.weight,
            weightMode: exam.weightMode,
            requiredPercent: exam.requiredPercent,
            requiredPercentMode: exam.requiredPercentMode
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
      setLoading(false);
      return;
    }

    setError(data.message || "Could not generate access.");
    setLoading(false);
  }

  const summaryContent = (
    <div className="space-y-5 rounded-[28px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5 shadow-[var(--app-shadow)]">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Live build</p>
          <h2 className="text-2xl text-[color:var(--app-heading)]">Assessment summary</h2>
        </div>
        <StatusPill label={`${previewExams.length} add-ons`} tone="blue" />
      </div>

      {selectedPresetId ? (
        <div className="rounded-[18px] bg-purple-500/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-purple-200">Preset source</p>
          <p className="mt-2 text-sm text-[color:var(--app-heading)]">
            {activePresets.find((preset) => preset.id === selectedPresetId)?.label ?? "Preset applied"}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Test ID</p>
          <p className="mt-2 font-mono text-lg text-[color:var(--app-heading)]">{testId}</p>
        </div>
        <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Summary</p>
          <p className="mt-2 text-lg text-[color:var(--app-heading)]">
            {previewExams.length} add-ons / {totalTimeMinutes} min
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">Score contribution should total 100 marks.</p>
        </div>
        <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Overall pass</p>
          <p className="mt-2 text-lg text-[color:var(--app-heading)]">{passTarget}%</p>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">Final weighted score needed across the full assessment.</p>
        </div>
        <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Integrity</p>
          <p className="mt-2 text-lg text-[color:var(--app-heading)]">{integrityPresetMeta[integrityPreset].shortLabel}</p>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">{integrityPresetMeta[integrityPreset].description}</p>
        </div>
      </div>

      <div className="space-y-3 rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[color:var(--app-heading)]">Score mix</p>
          <StatusPill label={`${totalContribution}/100`} tone={contributionTone} />
        </div>
        <ScoreMixBar exams={previewExams} total={totalContribution} />
        <p
          className={`text-sm ${
            contributionTone === "emerald"
              ? "text-[color:var(--app-success)]"
              : contributionTone === "red"
                ? "text-[color:var(--app-danger)]"
                : "text-[color:var(--app-warning)]"
          }`}
        >
          {contributionMessage}
        </p>
      </div>

      {previewExams.length > 0 ? (
        <div className="space-y-3">
          {previewExams.map((exam) => (
            <div key={exam.key} className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 shadow-[var(--app-shadow-soft)]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                <StatusPill label={`${exam.weight}/100`} tone="neutral" />
              </div>
              <p className="mt-3 text-sm text-[color:var(--app-text)]">{exam.configSummary}</p>
              <p className="mt-2 text-xs text-[color:var(--app-muted)]">
                {exam.durationMinutes}m | Min pass {exam.requiredPercent}%
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {invite ? (
        <InviteCredentialsPanel
          invite={invite}
          testId={testId}
          openLabel="Launch test"
          startNow
          variant="compact"
          showCopyAll={false}
        />
      ) : null}
    </div>
  );

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Assessments"
      title="Assemble an assessment"
      subtitle="Choose the mix, set the details, then share it."
    >
      <div className="space-y-4">
        <StepRail
          activeId={step}
          className={`md:grid-cols-${visibleStepIds.length}`}
          steps={visibleStepIds.map((id) => ({
            id,
            label: id === "select" ? "Select" : id === "customize" ? "Customize" : id === "calibrate" ? "Score" : "Share"
          }))}
        />

        <BuilderMetaBand>
          {linkedCandidateId ? <StatusPill label="Candidate-linked" tone="teal" /> : null}
          {selectedPresetId ? <StatusPill label="Preset applied" tone="purple" /> : null}
          <StatusPill label={`${previewExams.length} add-ons`} tone="blue" />
          <StatusPill label={`${totalTimeMinutes}m total`} tone="neutral" />
          <StatusPill label={`${totalContribution}/100 marks`} tone={contributionTone} />
        </BuilderMetaBand>

        {step !== "select" ? (
          <div className="xl:hidden">
            <button
              type="button"
              onClick={() => setSummaryOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Assessment summary</p>
                <p className="text-sm text-[color:var(--app-heading)]">
                  {previewExams.length} add-ons / {totalContribution}/100 marks
                </p>
              </div>
              <StatusPill label={summaryOpen ? "Hide" : "Show"} tone="neutral" />
            </button>
            {summaryOpen ? <div className="mt-4">{summaryContent}</div> : null}
          </div>
        ) : null}

        <div className={step === "select" ? "grid gap-4" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"}>
          <div className="space-y-4">
            {showSelectDetail ? (
            <BuilderStage className="space-y-6" emphasis="primary">
              <StepHeader
                step="Step 1"
                title="Choose the assessment mix"
                description="Choose a preset or add-ons."
                action={
                  selectedExams.length > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedPresetId(null);
                        setSelectedExams([]);
                        setConfiguringAddonId(null);
                        setConfiguringExam(null);
                        setInvite(null);
                        setError("");
                        setStep("select");
                      }}
                    >
                      Reset selection
                    </Button>
                  ) : null
                }
              />

              <div className="flex flex-wrap gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-1 shadow-[var(--app-shadow-soft)]">
                {activePresets.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectionSource("presets")}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      selectionSource === "presets"
                    ? "bg-brand-500 text-white shadow-[0_0_20px_rgba(52,124,255,0.28)]"
                    : "text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)]"
                    }`}
                  >
                    Presets
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectionSource("library")}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selectionSource === "library"
                      ? "bg-brand-500 text-white shadow-[0_0_20px_rgba(52,124,255,0.28)]"
                      : "text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)]"
                  }`}
                >
                  Add-on library
                </button>
              </div>

              {selectionSource === "presets" && activePresets.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">Start from a preset</p>
                      <p className="text-xs text-[color:var(--app-muted)]">Best for repeatable setups.</p>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedPresetId(null)} disabled={!selectedPresetId}>
                      Clear preset
                    </Button>
                  </div>
                  <div className="flex snap-x gap-3 overflow-x-auto pb-1">
                    {activePresets.map((preset) => {
                      const active = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`min-w-[280px] snap-start rounded-[22px] border p-4 text-left transition ${
                            active
                              ? "border-brand-300/60 bg-[linear-gradient(135deg,rgba(31,111,255,0.18),rgba(14,23,40,0.92))] shadow-[0_18px_40px_rgba(31,111,255,0.16)]"
                              : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:border-brand-300/40 hover:bg-[color:var(--app-surface-muted)]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill label="Preset" tone="purple" />
                            <StatusPill label={`${preset.items.length} add-ons`} tone="neutral" />
                          </div>
                          <p
                            className={cn(
                              "mt-3 text-xl",
                              active ? "text-white" : "text-[color:var(--app-heading)]",
                            )}
                          >
                            {preset.label}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-sm",
                              active ? "text-slate-200" : "text-[color:var(--app-muted)]",
                            )}
                          >
                            {preset.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {preset.items.map((item) => (
                              <StatusPill
                                key={item.id}
                                label={item.addon.label}
                                tone={examCatalog[item.addon.engineType].accentTone}
                                className="normal-case tracking-normal"
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {selectionSource === "library" ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--app-heading)]">Build from the add-on library</p>
                    <p className="text-xs text-[color:var(--app-muted)]">Choose add-ons for a custom mix.</p>
                  </div>
                  <div className="overflow-x-auto border-t border-[color:var(--app-border)] pt-2">
                      <table className="min-w-full text-left">
                        <thead className="border-b border-[color:var(--app-border)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                          <tr>
                            <th className="px-4 py-3 font-medium">Add-on</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Time</th>
                            <th className="px-4 py-3 font-medium">Min pass</th>
                            <th className="px-4 py-3 font-medium">Score</th>
                            <th className="px-4 py-3 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeAddons.map((addon) => {
                            const active = selectedExams.some((exam) => exam.sourceAddonId === addon.id);
                            const selectedExam = selectedExams.find((exam) => exam.sourceAddonId === addon.id);
                            const configFields = examCatalog[addon.engineType].configFields;
                            const isConfiguring = configuringAddonId === addon.id && configuringExam !== null;
                            const draftExam = isConfiguring ? configuringExam : selectedExam ?? null;
                            return (
                              <>
                                <tr
                                  key={addon.id}
                                  className={`border-t border-[color:var(--app-border)] transition ${
                                    active ? "bg-brand-500/10" : "hover:bg-[color:var(--app-table-row-hover)]"
                                  }`}
                                >
                                  <td className="px-4 py-3 align-top">
                                    <div className="space-y-1">
                                      <p className="text-sm text-[color:var(--app-heading)]">{addon.label}</p>
                                      <p
                                        className="max-w-[260px] truncate text-xs text-[color:var(--app-muted)]"
                                        title={addon.description}
                                      >
                                        {compactAddonDescription(addon.description)}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <StatusPill
                                      label={examCatalog[addon.engineType].label}
                                      tone={examCatalog[addon.engineType].accentTone}
                                    />
                                  </td>
                                  <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultDurationMinutes} min</td>
                                  <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultRequiredPercent}%</td>
                                  <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultWeight}/100</td>
                                  <td className="px-4 py-3 text-right align-top">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant={active ? "secondary" : "ghost"}
                                        onClick={() => beginAddonConfig(addon)}
                                      >
                                        {active ? "Edit" : "Configure"}
                                      </Button>
                                      {active ? (
                                        <Button type="button" variant="ghost" onClick={() => removeSelectedAddon(addon.id)}>
                                          Remove
                                        </Button>
                                      ) : null}
                                    </div>
                                  </td>
                                </tr>
                                {isConfiguring ? (
                                  <tr className="border-t border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]">
                                    <td colSpan={6} className="px-4 py-4">
                                      {configFields.length > 0 && draftExam ? (
                                        <div className="space-y-4 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
                                          <div className="space-y-1">
                                            <p className="text-sm text-[color:var(--app-heading)]">Assessment settings</p>
                                            <p className="text-xs text-[color:var(--app-muted)]">
                                              These settings apply only to this assessment and do not change the add-on library defaults.
                                            </p>
                                          </div>
                                          <div className="grid gap-4 lg:grid-cols-2">
                                            {configFields.map((field) => (
                                              <ConfigFieldEditor
                                                key={`${addon.id}-${field.key}`}
                                                field={field}
                                                value={(draftExam.config ?? {})[field.key]}
                                                onChange={(next) =>
                                                  setConfiguringExam((current) =>
                                                    current
                                                      ? {
                                                          ...current,
                                                          config: { ...(current.config ?? {}), [field.key]: next }
                                                        }
                                                      : current
                                                  )
                                                }
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 text-sm text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)]">
                                          No extra configuration needed for this add-on.
                                        </div>
                                      )}
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        <Button type="button" onClick={applyConfiguredAddon}>
                                          {active ? "Save changes" : "Add to assessment"}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          onClick={() => {
                                            setConfiguringAddonId(null);
                                            setConfiguringExam(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : null}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setStep("customize")} disabled={selectedExams.length === 0}>
                  Continue to setup
                </Button>
              </div>
            </BuilderStage>
            ) : null}

            {showCustomizeDetail ? (
            <BuilderStage className="space-y-5">
              <StepHeader
                step="Step 2"
                title="Review selected add-ons"
                description="Check the selected mix before scoring."
                action={<StatusPill label={`${previewExams.length} selected`} tone="blue" />}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <SelectionMetric
                  label="Ready"
                  value={String(previewExams.filter((exam) => exam.validity.valid).length)}
                  tone="blue"
                />
                <SelectionMetric
                  label="Need input"
                  value={String(previewExams.filter((exam) => !exam.validity.valid).length)}
                  tone="purple"
                />
                <SelectionMetric
                  label="Ready as-is"
                  value={String(examsReadyAsIs)}
                  tone="teal"
                />
              </div>

              {previewExams.length > 0 ? (
                <div className="space-y-3">
                  {previewExams.map((exam, index) => {
                    const sourceAddon = exam.sourceAddonId ? addonLookup.get(exam.sourceAddonId) : null;

                    return (
                      <div
                        key={exam.key}
                        className={`rounded-[24px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${examPanelClass(exam.definitionId)}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={`#${index + 1}`} tone="neutral" />
                              <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                              <StatusPill
                                label={exam.validity.valid ? "Ready" : "Needs setup"}
                                tone={exam.validity.valid ? "emerald" : "amber"}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base text-white">{exam.configSummary}</p>
                              <p className="text-xs text-slate-200">
                                {sourceAddon ? `Source add-on: ${sourceAddon.label}` : "Custom selection"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill label={`${exam.durationMinutes}m`} tone="neutral" />
                            <StatusPill label={`${exam.weight}/100`} tone="neutral" />
                            <StatusPill label={`Min ${exam.requiredPercent}%`} tone="neutral" />
                          </div>
                        </div>

                        {exam.validity.messages.length > 0 ? (
                          <div className="mt-4 space-y-2">
                            {exam.validity.messages.map((message) => (
                              <p
                                key={`${exam.key}-${message}`}
                                className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-100"
                              >
                                {message}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
                  <p className="text-sm text-[color:var(--app-muted)]">Select add-ons or a preset to continue.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setStep("calibrate")} disabled={previewExams.length === 0}>
                  Continue to scoring
                </Button>
              </div>
            </BuilderStage>
            ) : null}

            {showCalibrateDetail ? (
            <BuilderStage className="space-y-5">
              <StepHeader
                step="Step 3"
                title="Set score contribution"
                description="Set add-on marks to 100 and choose integrity."
                action={<StatusPill label={`${totalContribution}/100 total`} tone={contributionTone} />}
              />

              <div
                className={`rounded-[18px] px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                  contributionTone === "emerald"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                    : contributionTone === "red"
                      ? "bg-red-500/10 text-red-700 dark:text-red-100"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-100"
                }`}
              >
                {contributionMessage}
              </div>

              {previewExams.length > 0 ? (
                <div className="space-y-3">
                  {previewExams.map((exam, index) => (
                    <motion.div
                      key={exam.key}
                      layout={!reduceMotion}
                      transition={transition}
                      className={`rounded-[22px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${examPanelClass(exam.definitionId)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill label={`#${index + 1}`} tone="neutral" />
                            <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                          </div>
                          <p className="text-xs text-slate-200">{exam.durationMinutes} min</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedExams((current) => moveItem(current, index, -1));
                              setSelectedPresetId(null);
                            }}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedExams((current) => moveItem(current, index, 1));
                              setSelectedPresetId(null);
                            }}
                            disabled={index === previewExams.length - 1}
                          >
                            Down
                          </Button>
                        </div>
                      </div>

                      <label className="mt-4 grid gap-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-200">Score contribution</span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={exam.weight ?? 0}
                          onChange={(event) =>
                            updateExam(exam.key, (current) => ({
                              ...current,
                              weight: Math.max(0, Math.round(Number(event.target.value) || 0)),
                              weightMode: "manual"
                            }))
                          }
                          className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                        />
                      </label>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
                  <p className="text-sm text-[color:var(--app-muted)]">Select at least one add-on before allocating marks.</p>
                </div>
              )}

              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
                <IntegrityPresetPicker
                  value={integrityPreset}
                  onChange={setIntegrityPreset}
                  description=""
                />
              </div>

              {validExamMessages.length > 0 ? (
                <div className="space-y-2">
                  {validExamMessages.map((message) => (
                    <p
                      key={message}
                      className="rounded-[16px] bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100"
                    >
                      {message}
                    </p>
                  ))}
                </div>
              ) : null}

              {hasZeroContributionExams ? (
                <p className="rounded-[16px] bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                  Every selected add-on needs at least 1 mark of score contribution.
                </p>
              ) : null}

              {error ? (
                <p className="rounded-[16px] bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={onGenerateAccess} disabled={loading || !canGenerate}>
                  {loading ? "Generating..." : "Generate access"}
                </Button>
              </div>
            </BuilderStage>
            ) : null}

            {showShareDetail ? (
            <BuilderStage className="space-y-5">
              <StepHeader
                step="Step 4"
                title="Share access"
                description="Copy the access details and launch the test if needed."
              />

              {invite ? (
                <div className="space-y-4">
                  <InviteCredentialsPanel invite={invite} testId={testId} openLabel="Launch test" startNow />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        setSelectedPresetId(null);
                        setSelectedExams([]);
                        setConfiguringAddonId(null);
                        setConfiguringExam(null);
                        setInvite(null);
                        setError("");
                        setStep("select");
                        setLoading(false);
                      }}
                    >
                      Build another
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] bg-[color:var(--app-surface-muted)] p-4 shadow-[var(--app-shadow-soft)]">
                  <p className="text-sm text-[color:var(--app-muted)]">
                    Access details will appear here after the assessment has a full 100-mark allocation
                    and all required settings are complete.
                  </p>
                </div>
              )}
            </BuilderStage>
            ) : null}
          </div>

          {step !== "select" ? (
          <div className="hidden xl:block">
            <div className="sticky top-24">{summaryContent}</div>
          </div>
          ) : null}
        </div>
      </div>
    </SceneShell>
  );
}

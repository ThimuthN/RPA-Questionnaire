"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
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
import { deriveExamSelectionMetadata, examCatalog } from "@/lib/exams/catalog";
import { integrityPresetMeta } from "@/lib/integrity/policy";

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
      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
        <div className="flex h-full">
          {exams.map((exam) => (
            <div
              key={exam.key}
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
  const [expandedExamKeys, setExpandedExamKeys] = useState<string[]>([]);
  const [passTarget, setPassTarget] = useState(60);
  const [integrityPreset, setIntegrityPreset] = useState<IntegrityPresetId>("standard");
  const [invite, setInvite] = useState<(InviteCredentials & { slug: string; inviteId: string }) | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
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

  function toggleAddon(addon: AddonCatalogEntry) {
    setSelectedPresetId(null);
    setSelectedExams((current) => {
      const exists = current.some((exam) => exam.sourceAddonId === addon.id);
      if (exists) {
        const next = current.filter((exam) => exam.sourceAddonId !== addon.id);
        setExpandedExamKeys((keys) => keys.filter((key) => key !== addon.id));
        setStep(next.length > 0 ? "customize" : "select");
        return next;
      }

      const next = [...current, buildDraftFromAddon(addon)];
      setExpandedExamKeys((keys) => [...new Set([...keys, addon.id])]);
      setStep("customize");
      setError("");
      return next;
    });
  }

  function applyPreset(preset: AssessmentPresetEntry) {
    const drafts = buildDraftsFromPreset(preset);
    setSelectedPresetId(preset.id);
    setSelectedExams(drafts);
    setExpandedExamKeys(drafts.map((exam, index) => examKey(exam, index)));
    setInvite(null);
    setError("");
    setStep("customize");
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

  function removeExam(key: string) {
    setSelectedExams((current) => current.filter((exam, index) => examKey(exam, index) !== key));
    setExpandedExamKeys((current) => current.filter((item) => item !== key));
    setSelectedPresetId(null);
    setError("");
  }

  function toggleAccordion(key: string) {
    setExpandedExamKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
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
    <StagePanel className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Assessment summary</p>
          <h2 className="text-2xl text-white">Blueprint</h2>
        </div>
        <StatusPill label={`${previewExams.length} add-ons`} tone="blue" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Test ID</p>
          <p className="mt-2 font-mono text-lg text-white">{testId}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Summary</p>
          <p className="mt-2 text-lg text-white">
            {previewExams.length} add-ons / {totalTimeMinutes} min
          </p>
          <p className="mt-1 text-sm text-slate-300">Score contribution should total 100 marks.</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Overall pass</p>
          <p className="mt-2 text-lg text-white">{passTarget}%</p>
          <p className="mt-1 text-sm text-slate-300">Final weighted score needed across the full assessment.</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Integrity</p>
          <p className="mt-2 text-lg text-white">{integrityPresetMeta[integrityPreset].shortLabel}</p>
          <p className="mt-1 text-sm text-slate-300">{integrityPresetMeta[integrityPreset].description}</p>
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

      {previewExams.length > 0 ? (
        <div className="space-y-3">
          {previewExams.map((exam) => (
            <div key={exam.key} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                <StatusPill label={`${exam.weight}/100`} tone="neutral" />
              </div>
              <p className="mt-3 text-sm text-slate-100">{exam.configSummary}</p>
              <p className="mt-2 text-xs text-slate-400">
                {exam.durationMinutes}m | Min pass {exam.requiredPercent}%
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {invite ? (
        <InviteCredentialsPanel invite={invite} testId={testId} openLabel="Launch test" startNow />
      ) : null}
    </StagePanel>
  );

  return (
    <SceneShell
      variant="create"
      eyebrow="Assessments"
      title="Assemble an assessment"
      subtitle="Select add-ons or a preset, adjust only assessment-specific config, then calibrate score contribution, integrity, and sharing."
      utility={
        <div className="flex flex-wrap gap-2">
          {linkedCandidateId ? <StatusPill label="Candidate-linked" tone="teal" /> : null}
          {selectedPresetId ? <StatusPill label="Preset applied" tone="purple" /> : null}
          <StatusPill label={`${previewExams.length} add-ons`} tone="blue" />
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
            { id: "customize", label: "Customize" },
            { id: "calibrate", label: "Score" },
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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Assessment summary</p>
              <p className="text-sm text-white">
                {previewExams.length} add-ons / {totalContribution}/100 marks
              </p>
            </div>
            <StatusPill label={summaryOpen ? "Hide" : "Show"} tone="neutral" />
          </button>
          {summaryOpen ? <div className="mt-4">{summaryContent}</div> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <StagePanel className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 1</p>
                <h2 className="text-2xl text-white">Select add-ons or a preset</h2>
                <p className="text-sm text-slate-300">
                  Pick individual add-ons for a custom mix, or apply a preset to preload a ready-made
                  bundle.
                </p>
              </div>
              {activePresets.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-100">Presets</p>
                    <Button variant="ghost" onClick={() => setSelectedPresetId(null)} disabled={!selectedPresetId}>
                      Clear preset
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {activePresets.map((preset) => {
                      const active = selectedPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`rounded-[22px] border p-4 text-left transition ${
                            active
                              ? "border-brand-300/60 bg-brand-500/12 shadow-[0_16px_36px_rgba(31,111,255,0.16)]"
                              : "border-white/12 bg-black/20 hover:border-brand-300/40"
                          }`}
                        >
                          <div className="flex flex-wrap gap-2">
                            <StatusPill label="Preset" tone="purple" />
                            <StatusPill label={`${preset.items.length} add-ons`} tone="neutral" />
                          </div>
                          <p className="mt-3 text-lg text-white">{preset.label}</p>
                          <p className="mt-2 text-sm text-slate-300">{preset.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
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

              <div className="space-y-3">
                <p className="text-sm text-slate-100">Add-on library</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {activeAddons.map((addon) => {
                    const active = selectedExams.some((exam) => exam.sourceAddonId === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`rounded-[22px] border p-4 text-left transition ${
                          active
                            ? "border-brand-300/60 bg-brand-500/12 shadow-[0_16px_36px_rgba(31,111,255,0.16)]"
                            : "border-white/12 bg-black/20 hover:border-brand-300/40"
                        }`}
                      >
                        <div className="flex flex-wrap gap-2">
                          <StatusPill
                            label={examCatalog[addon.engineType].label}
                            tone={examCatalog[addon.engineType].accentTone}
                          />
                          <StatusPill label={`${addon.defaultDurationMinutes} min`} tone="neutral" />
                        </div>
                        <p className="mt-3 text-lg text-white">{addon.label}</p>
                        <p className="mt-2 text-sm text-slate-300">{addon.description}</p>
                        <p className="mt-3 text-xs text-slate-400">
                          Min pass {addon.defaultRequiredPercent}% | Default score {addon.defaultWeight}/100
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setStep("customize")} disabled={selectedExams.length === 0}>
                  Continue
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPresetId(null);
                    setSelectedExams([]);
                    setExpandedExamKeys([]);
                    setInvite(null);
                    setError("");
                    setStep("select");
                  }}
                  disabled={selectedExams.length === 0}
                >
                  Reset selection
                </Button>
              </div>
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 2</p>
                <h2 className="text-2xl text-white">Assessment-specific add-on config</h2>
                <p className="text-sm text-slate-300">
                  Only edit add-on settings that belong to this assessment. Library-owned defaults like
                  time and minimum pass stay on the add-ons page.
                </p>
              </div>

              {previewExams.length > 0 ? (
                <div className="space-y-3">
                  {previewExams.map((exam, index) => {
                    const expanded = expandedExamKeys.includes(exam.key);
                    const configFields = examCatalog[exam.definitionId].configFields;
                    const sourceAddon = exam.sourceAddonId ? addonLookup.get(exam.sourceAddonId) : null;

                    return (
                      <motion.div
                        key={exam.key}
                        layout={!reduceMotion}
                        transition={transition}
                        className="overflow-hidden rounded-[24px] border border-white/12 bg-black/15"
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(exam.key)}
                          className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={`#${index + 1}`} tone="neutral" />
                              <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                              <StatusPill
                                label={exam.validity.valid ? "Ready" : "Needs library fix"}
                                tone={exam.validity.valid ? "emerald" : "amber"}
                              />
                            </div>
                            <p className="text-sm text-slate-100">{exam.configSummary}</p>
                            <p className="text-xs text-slate-400">
                              {exam.durationMinutes}m | Score contribution {exam.weight}/100 | Minimum pass{" "}
                              {exam.requiredPercent}%
                            </p>
                            {sourceAddon ? (
                              <p className="text-xs text-slate-500">Source add-on: {sourceAddon.label}</p>
                            ) : null}
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
                                <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                                  <p>Time: {exam.durationMinutes} minutes</p>
                                  <p>Minimum pass: {exam.requiredPercent}%</p>
                                  <p>These defaults are managed from the add-on library.</p>
                                </div>

                                {exam.validity.messages.length > 0 ? (
                                  exam.validity.messages.map((message) => (
                                    <p
                                      key={`${exam.key}-${message}`}
                                      className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                                    >
                                      {message}
                                    </p>
                                  ))
                                ) : null}

                                {configFields.length > 0 ? (
                                  configFields.map((field) => (
                                    <ConfigFieldEditor
                                      key={`${exam.key}-${field.key}`}
                                      field={field}
                                      value={(exam.config ?? {})[field.key]}
                                      onChange={(next) =>
                                        updateExam(exam.key, (current) => ({
                                          ...current,
                                          config: { ...(current.config ?? {}), [field.key]: next }
                                        }))
                                      }
                                    />
                                  ))
                                ) : (
                                  <p className="text-sm text-slate-300">
                                    This add-on does not expose extra assessment-level settings.
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <Button variant="ghost" onClick={() => removeExam(exam.key)}>
                                    Remove add-on
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
                  <p className="text-sm text-slate-300">Select add-ons or a preset to continue.</p>
                </div>
              )}
            </StagePanel>
            
            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 3</p>
                  <h2 className="text-2xl text-white">Calibrate scoring</h2>
                  <p className="text-sm text-slate-300">
                    Adjust score contribution here. Time and minimum pass stay with the add-on defaults.
                  </p>
                </div>
                <StatusPill label={`${totalContribution}/100 total`} tone={contributionTone} />
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm leading-6 text-slate-300">
                  Each add-on is scored out of 100 internally, then converted into its score contribution.
                  Example: 80% on a 30-mark add-on becomes 24 marks toward the final score.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-3">
                  {previewExams.length > 0 ? (
                    previewExams.map((exam, index) => (
                      <motion.div
                        key={exam.key}
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
                            <p className="text-xs text-slate-400">
                              {exam.durationMinutes} minutes | Min pass {exam.requiredPercent}%
                            </p>
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

                        <div className="mt-4 grid gap-3 md:grid-cols-1">
                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Score contribution {exam.weightMode === "manual" ? "(manual)" : "(auto)"}
                            </span>
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
                              className="w-full rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                            />
                          </label>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Select at least one add-on before allocating marks.</p>
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
                        setPassTarget(Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0))))
                      }
                      className="w-full rounded-[16px] border border-white/12 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                    />
                  </label>
                  <p className="text-sm leading-6 text-slate-300">
                    Candidates need this final weighted score plus any add-on-level minimum passes to pass overall.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setSelectedExams((current) =>
                        current.map((exam) => ({
                          ...exam,
                          weightMode: "auto"
                        }))
                      )
                    }
                  >
                    Rebalance by time
                  </Button>
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

              <div className="rounded-[22px] border border-white/12 bg-black/15 p-4">
                <IntegrityPresetPicker
                  value={integrityPreset}
                  onChange={setIntegrityPreset}
                  description="Choose how protective the runtime should feel before you generate access."
                />
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

              {hasZeroContributionExams ? (
                <p className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Every selected add-on needs at least 1 mark of score contribution.
                </p>
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
                  <InviteCredentialsPanel invite={invite} testId={testId} openLabel="Launch test" startNow />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedPresetId(null);
                        setSelectedExams([]);
                        setExpandedExamKeys([]);
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
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-300">
                    Access details will appear here after the assessment has a full 100-mark allocation
                    and all required settings are complete.
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

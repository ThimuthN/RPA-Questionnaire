"use client";

import { useMemo, useState } from "react";
import type { ExamBlueprintDraftItem, ExamConfigFieldDefinition } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { StepRail } from "@/components/primitives/StepRail";
import { StatusPill } from "@/components/primitives/StatusPill";
import { InviteCredentialsPanel, type InviteCredentials } from "@/components/access/InviteCredentialsPanel";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";
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
                  const next = active
                    ? selectedValues.filter((item) => item !== option.value)
                    : [...selectedValues, option.value];
                  onChange(next);
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

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}

export default function CreateTestPage() {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedExams, setSelectedExams] = useState<ExamBlueprintDraftItem[]>([]);
  const [focusedDefinitionId, setFocusedDefinitionId] = useState<string>("");
  const [passTarget, setPassTarget] = useState(60);
  const [invite, setInvite] = useState<(InviteCredentials & { slug: string; inviteId: string }) | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewExams = useMemo(
    () =>
      selectedExams.map((exam) => {
        const meta = deriveExamSelectionMetadata(exam.definitionId, exam.config ?? {}, passTarget);
        return {
          ...exam,
          label: meta.label,
          configSummary: meta.configSummary,
          durationMinutes: meta.durationMinutes,
          requiredPercent: typeof exam.requiredPercent === "number" ? exam.requiredPercent : meta.requiredPercent
        };
      }),
    [passTarget, selectedExams]
  );
  const totalTimeMinutes = previewExams.reduce((sum, exam) => sum + exam.durationMinutes, 0);
  const totalWeight = previewExams.reduce((sum, exam) => sum + Number(exam.weight || 0), 0);
  const canConfigure = selectedExams.length > 0;
  const canCalibrate = selectedExams.length > 0;
  const canGenerate = previewExams.length > 0;
  const focusedExam =
    previewExams.find((exam) => exam.definitionId === focusedDefinitionId) ?? previewExams[0] ?? null;

  function selectExam(definitionId: keyof typeof examCatalog) {
    setSelectedExams((prev) => {
      if (prev.some((exam) => exam.definitionId === definitionId)) return prev;
      const next = [...prev, defaultDraftForDefinition(definitionId)];
      setFocusedDefinitionId(definitionId);
      return next;
    });
    setStep("configure");
  }

  function removeExam(definitionId: string) {
    setSelectedExams((prev) => prev.filter((exam) => exam.definitionId !== definitionId));
    setFocusedDefinitionId((prev) => (prev === definitionId ? "" : prev));
  }

  function updateExam(definitionId: string, updater: (current: ExamBlueprintDraftItem) => ExamBlueprintDraftItem) {
    setSelectedExams((prev) => prev.map((exam) => (exam.definitionId === definitionId ? updater(exam) : exam)));
  }

  async function onGenerateAccess() {
    if (!canGenerate) {
      setError("Select at least one exam.");
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

  const testId = useMemo(() => (invite?.slug ? invite.slug.toUpperCase() : "--"), [invite?.slug]);

  return (
    <SceneShell
      variant="create"
      eyebrow={copy.create.eyebrow}
      title="Compose a modular exam experience"
      subtitle="Select exams, configure each one, calibrate the scoring gates, and generate a frozen assessment link."
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${previewExams.length} exams`} tone="blue" />
          <StatusPill label={`${totalTimeMinutes}m total`} tone="neutral" />
          <StatusPill label={`${totalWeight} weight`} tone="teal" />
        </div>
      }
    >
      <div className="space-y-4">
        <StepRail
          activeId={step}
          steps={[
            { id: "select", label: "Select" },
            { id: "configure", label: "Configure" },
            { id: "calibrate", label: "Calibrate" },
            { id: "share", label: "Share" }
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
          <div className="space-y-4">
            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 1</p>
                  <h2 className="text-2xl text-white">Select exams</h2>
                </div>
                <Button variant="secondary" onClick={() => setStep("configure")} disabled={!canConfigure}>
                  Configure selected
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {orderedExamCatalog.map((exam) => {
                  const active = selectedExams.some((item) => item.definitionId === exam.id);
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => selectExam(exam.id)}
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
                          <StatusPill label={`${exam.defaultWeight} weight`} tone="neutral" />
                          <StatusPill label={`${exam.buildDurationMinutes(exam.defaultConfig)}m base`} tone="neutral" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StagePanel>

            <StagePanel className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Step 2</p>
                  <h2 className="text-2xl text-white">Configure selected exams</h2>
                </div>
                <Button variant="secondary" onClick={() => setStep("calibrate")} disabled={!canCalibrate}>
                  Calibrate scoring
                </Button>
              </div>
              {focusedExam ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {previewExams.map((exam) => (
                      <button
                        key={exam.definitionId}
                        type="button"
                        onClick={() => setFocusedDefinitionId(exam.definitionId)}
                        className={`rounded-full border px-4 py-2 text-sm transition duration-200 ${
                          focusedExam.definitionId === exam.definitionId
                            ? "border-brand-300 bg-brand-500/18 text-white"
                            : "border-white/16 bg-white/[0.05] text-slate-200"
                        }`}
                      >
                        {exam.label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-[24px] border border-white/12 bg-black/15 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-xl text-white">{focusedExam.label}</h3>
                        <p className="text-sm text-slate-300">{focusedExam.configSummary}</p>
                      </div>
                      <Button variant="ghost" onClick={() => removeExam(focusedExam.definitionId)}>
                        Remove
                      </Button>
                    </div>
                    <div className="mt-5 space-y-5">
                      {examCatalog[focusedExam.definitionId].configFields.length > 0 ? (
                        examCatalog[focusedExam.definitionId].configFields.map((field) => (
                          <ConfigField
                            key={field.key}
                            field={field}
                            value={(focusedExam.config ?? {})[field.key]}
                            onChange={(next) =>
                              updateExam(focusedExam.definitionId, (current) => ({
                                ...current,
                                config: {
                                  ...(current.config ?? {}),
                                  [field.key]: next
                                }
                              }))
                            }
                          />
                        ))
                      ) : (
                        <p className="text-sm text-slate-300">This exam does not need additional configuration.</p>
                      )}
                    </div>
                  </div>
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
                  <h2 className="text-2xl text-white">Calibrate order, weights, and gates</h2>
                </div>
                <Button onClick={onGenerateAccess} disabled={loading || !canGenerate}>
                  {loading ? "Generating..." : "Generate access"}
                </Button>
              </div>
              <div className="rounded-[22px] border border-white/12 bg-black/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Overall pass target</p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-3xl text-white">{passTarget}%</p>
                  <p className="max-w-sm text-sm text-slate-300">
                    Each exam can have its own gate. The final score uses the selected exam weights.
                  </p>
                </div>
                <input
                  type="range"
                  min={40}
                  max={90}
                  value={passTarget}
                  onChange={(event) => setPassTarget(Number(event.target.value))}
                  className="mt-3 w-full accent-[rgb(47,134,255)]"
                />
              </div>
              <div className="space-y-3">
                {previewExams.length > 0 ? (
                  previewExams.map((exam, index) => (
                    <div key={exam.definitionId} className="rounded-[22px] border border-white/12 bg-white/[0.04] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill label={`#${index + 1}`} tone="neutral" />
                            <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                          </div>
                          <p className="text-sm text-slate-300">{exam.configSummary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => setSelectedExams((prev) => moveItem(prev, index, -1))} disabled={index === 0}>
                            Move up
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedExams((prev) => moveItem(prev, index, 1))}
                            disabled={index === previewExams.length - 1}
                          >
                            Move down
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Duration</p>
                          <p className="text-lg text-white">{exam.durationMinutes} min</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weight</p>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={exam.weight ?? examCatalog[exam.definitionId].defaultWeight}
                            onChange={(event) =>
                              updateExam(exam.definitionId, (current) => ({
                                ...current,
                                weight: Number(event.target.value || 1)
                              }))
                            }
                            className="w-full rounded-[16px] border border-white/15 bg-white/[0.05] px-3 py-2 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Gate</p>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={exam.requiredPercent}
                            onChange={(event) =>
                              updateExam(exam.definitionId, (current) => ({
                                ...current,
                                requiredPercent: Number(event.target.value || 0)
                              }))
                            }
                            className="w-full rounded-[16px] border border-white/15 bg-white/[0.05] px-3 py-2 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-300">No exams selected yet.</p>
                  </div>
                )}
              </div>
            </StagePanel>
          </div>

          <StagePanel className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Live summary</p>
              <h2 className="text-2xl text-white">Assessment blueprint</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Test ID</p>
                <p className="mt-2 font-mono text-xl text-white">{testId}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Summary</p>
                <p className="mt-2 text-lg text-white">{previewExams.length ? `${previewExams.length} exams / ${totalTimeMinutes} min` : "No exams selected"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Overall pass</p>
                <p className="mt-1 text-lg text-white">{passTarget}%</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total time</p>
                <p className="mt-1 text-lg text-white">{totalTimeMinutes} min</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total weight</p>
                <p className="mt-1 text-lg text-white">{totalWeight}</p>
              </div>
            </div>

            <div className="space-y-3">
              {previewExams.length > 0 ? (
                previewExams.map((exam, index) => (
                  <div key={exam.definitionId} className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={`#${index + 1}`} tone="neutral" />
                      <StatusPill label={exam.label} tone={examCatalog[exam.definitionId].accentTone} />
                    </div>
                    <p className="mt-3 text-sm text-slate-100">{exam.configSummary}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {exam.durationMinutes}m | weight {exam.weight} | gate {exam.requiredPercent}%
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-300">Select exams to start building the assessment.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setStep("select")}>
                Select
              </Button>
              <Button variant="secondary" onClick={() => setStep("configure")} disabled={!canConfigure}>
                Configure
              </Button>
              <Button variant="secondary" onClick={() => setStep("calibrate")} disabled={!canCalibrate}>
                Calibrate
              </Button>
            </div>

            {error ? <p className="text-sm text-red-200">{error}</p> : null}

            {invite ? (
              <div className="space-y-3 scene-fade-up">
                <InviteCredentialsPanel invite={invite} testId={testId} openLabel={copy.create.startTest} />
                <Button variant="secondary" onClick={onStartNow}>
                  {copy.create.startNow}
                </Button>
              </div>
            ) : null}
          </StagePanel>
        </div>
      </div>
    </SceneShell>
  );
}

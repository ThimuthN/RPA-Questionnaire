"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionRuntimeCard } from "@/components/runtime/QuestionRuntimeCard";
import { PracticalRuntimeCard } from "@/components/runtime/PracticalRuntimeCard";
import { LogicReasoningRuntimeCard } from "@/components/runtime/LogicReasoningRuntimeCard";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { ActionRail } from "@/components/primitives/ActionRail";
import { isPracticalSubtaskAnswered } from "@/features/practical/grading";
import { isLogicReasoningSubtaskAnswered } from "@/features/logic-reasoning/grading";
import type { PracticalPack } from "@/features/practical/packs";
import type { LogicReasoningPack } from "@/features/logic-reasoning/packs";
import type { Question, ResultSummary, RoleId, StackId } from "@/lib/assessment-engine/types";
import { sectionRegistry } from "@/lib/sections/registry";
import type { SectionId, SectionState } from "@/lib/sections/types";
import { RuntimeUiStatus } from "@/features/runtime/ui-state";
import { HudBar } from "@/components/runtime/HudBar";
import { NavigatorRail, type NavigatorItem } from "@/components/runtime/NavigatorRail";
import { SectionHandoff } from "@/components/runtime/SectionHandoff";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";

interface RuntimeClientProps {
  slug: string;
  attemptId: string;
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  initialSectionState: Partial<Record<SectionId, SectionState>>;
  questions: Question[];
  practicalPack?: PracticalPack;
  logicReasoningPack?: LogicReasoningPack;
}

function statusMeta(status: RuntimeUiStatus): { label: string; tone: "blue" | "teal" | "emerald" | "amber" | "red" } {
  switch (status) {
    case RuntimeUiStatus.Saving:
      return { label: "Saving", tone: "blue" };
    case RuntimeUiStatus.Saved:
      return { label: "Saved", tone: "emerald" };
    case RuntimeUiStatus.Syncing:
      return { label: "Syncing", tone: "teal" };
    case RuntimeUiStatus.WarningTimeLow:
      return { label: "Time low", tone: "amber" };
    case RuntimeUiStatus.CriticalTimeLow:
      return { label: "Critical", tone: "red" };
    case RuntimeUiStatus.Submitting:
      return { label: "Submitting", tone: "blue" };
    default:
      return { label: "Autosave on", tone: "teal" };
  }
}

function mergeSectionState(
  base: Partial<Record<SectionId, SectionState>>,
  patch: Partial<Record<SectionId, Partial<SectionState>>>
): Partial<Record<SectionId, SectionState>> {
  const next: Partial<Record<SectionId, SectionState>> = { ...base };
  for (const [sectionId, incoming] of Object.entries(patch) as Array<[SectionId, Partial<SectionState>]>) {
    const current = next[sectionId] ?? { answers: {}, remainingSeconds: 0 };
    next[sectionId] = {
      answers: { ...(current.answers ?? {}), ...(incoming.answers ?? {}) },
      remainingSeconds:
        typeof incoming.remainingSeconds === "number" ? incoming.remainingSeconds : current.remainingSeconds,
      earned: typeof incoming.earned === "number" ? incoming.earned : current.earned,
      possible: typeof incoming.possible === "number" ? incoming.possible : current.possible
    };
  }
  return next;
}

export function RuntimeClient(props: RuntimeClientProps) {
  const router = useRouter();
  const orderedSections = props.sections;
  const [stage, setStage] = useState<SectionId | "submitted">(() => orderedSections[0] ?? "core");
  const [index, setIndex] = useState(0);
  const [sectionState, setSectionState] = useState<Partial<Record<SectionId, SectionState>>>(() => {
    const initial = props.initialSectionState ?? {};
    const merged: Partial<Record<SectionId, SectionState>> = { ...initial };
    for (const sectionId of orderedSections) {
      const existing = merged[sectionId];
      if (!existing) {
        merged[sectionId] = { answers: {}, remainingSeconds: 0 };
      }
    }
    return merged;
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [uiStatus, setUiStatus] = useState<RuntimeUiStatus>(RuntimeUiStatus.Idle);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{ from: SectionId; to: SectionId } | null>(null);
  const [autoSubmitNote, setAutoSubmitNote] = useState("");

  const currentQuestion = props.questions[index];
  const totalQuestions = props.questions.length;
  const coreAnswers = sectionState.core?.answers ?? {};
  const practicalAnswers = sectionState.practical?.answers ?? {};
  const logicAnswers = sectionState.applied_logic_reasoning?.answers ?? {};
  const answeredCount = props.questions.filter((question) => coreAnswers[question.id] != null).length;
  const unansweredCount = totalQuestions - answeredCount;

  const practicalTotal = props.practicalPack?.subtasks.length ?? 0;
  const practicalCompleted = (props.practicalPack?.subtasks ?? []).filter((subtask) => {
    return isPracticalSubtaskAnswered(subtask, practicalAnswers[subtask.id]);
  }).length;

  const logicReasoningTotal = props.logicReasoningPack?.subtasks.length ?? 0;
  const logicReasoningCompleted = (props.logicReasoningPack?.subtasks ?? []).filter((subtask) => {
    return isLogicReasoningSubtaskAnswered(subtask, logicAnswers[subtask.id]);
  }).length;

  const coreRatio = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  const practicalRatio = practicalTotal > 0 ? practicalCompleted / practicalTotal : 0;
  const logicRatio = logicReasoningTotal > 0 ? logicReasoningCompleted / logicReasoningTotal : 0;

  const overallProgress = useMemo(() => {
    const ratios: number[] = [];
    for (const sectionId of orderedSections) {
      if (sectionId === "core") ratios.push(coreRatio);
      if (sectionId === "practical") ratios.push(practicalRatio);
      if (sectionId === "applied_logic_reasoning") ratios.push(logicRatio);
    }
    if (ratios.length === 0) return 0;
    return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
  }, [orderedSections, coreRatio, practicalRatio, logicRatio]);

  const currentRemaining =
    stage === "submitted" ? 0 : Math.max(0, sectionState[stage]?.remainingSeconds ?? 0);
  const status = useMemo(() => statusMeta(uiStatus), [uiStatus]);
  const currentSectionLabel = stage === "submitted" ? "Submitted" : sectionRegistry[stage]?.label ?? stage;

  const stageRef = useRef<SectionId | "submitted">(stage);
  const remainingRef = useRef<number>(currentRemaining);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    remainingRef.current = currentRemaining;
  }, [currentRemaining]);

  function getNextSection(current: SectionId): SectionId | null {
    const idx = orderedSections.indexOf(current);
    if (idx < 0) return null;
    return orderedSections[idx + 1] ?? null;
  }

  function getPreviousSection(current: SectionId): SectionId | null {
    const idx = orderedSections.indexOf(current);
    if (idx <= 0) return null;
    return orderedSections[idx - 1] ?? null;
  }

  function getSectionPendingCount(sectionId: SectionId): number {
    if (sectionId === "core") return unansweredCount;
    if (sectionId === "practical") return Math.max(0, practicalTotal - practicalCompleted);
    if (sectionId === "applied_logic_reasoning") return Math.max(0, logicReasoningTotal - logicReasoningCompleted);
    return 0;
  }

  function getSectionTotalItems(sectionId: SectionId): number {
    if (sectionId === "core") return totalQuestions;
    if (sectionId === "practical") return practicalTotal;
    if (sectionId === "applied_logic_reasoning") return logicReasoningTotal;
    return 0;
  }

  function buildSectionProgress(): { label: string; value: string } {
    if (stage === "core") {
      return { label: "Core progress", value: `${answeredCount}/${totalQuestions}` };
    }
    if (stage === "practical") {
      return { label: "Practical progress", value: `${practicalCompleted}/${practicalTotal}` };
    }
    if (stage === "applied_logic_reasoning") {
      return { label: "Logic progress", value: `${logicReasoningCompleted}/${logicReasoningTotal}` };
    }
    return { label: "Progress", value: `${overallProgress}%` };
  }

  async function persistAutosave(payload?: {
    stage?: SectionId | "submitted";
    sectionState?: Partial<Record<SectionId, Partial<SectionState>>>;
  }) {
    const body = {
      stage: payload?.stage ?? stage,
      sectionState: payload?.sectionState ?? {}
    };

    setUiStatus(RuntimeUiStatus.Syncing);
    await fetch(`/api/attempts/${props.attemptId}/autosave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setUiStatus(RuntimeUiStatus.Saved);
  }

  useEffect(() => {
    if (stage === "core" && currentQuestion) {
      setVisited((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }
  }, [stage, currentQuestion]);

  useEffect(() => {
    if (stage === "submitted") return;
    const timer = setInterval(() => {
      setSectionState((prev) => {
        const current = prev[stage] ?? { answers: {}, remainingSeconds: 0 };
        return {
          ...prev,
          [stage]: {
            ...current,
            remainingSeconds: Math.max(0, current.remainingSeconds - 1)
          }
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "submitted") return;
    const autosaveTimer = setInterval(() => {
      const activeStage = stageRef.current;
      if (activeStage === "submitted") return;
      const sectionPatch: Partial<Record<SectionId, Partial<SectionState>>> = {
        [activeStage]: {
          remainingSeconds: Math.max(0, remainingRef.current)
        }
      };
      void fetch(`/api/attempts/${props.attemptId}/autosave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: activeStage,
          sectionState: sectionPatch
        })
      });
    }, 15000);
    return () => clearInterval(autosaveTimer);
  }, [props.attemptId, stage]);

  useEffect(() => {
    if (stage === "submitted") return;
    if (currentRemaining > 0 && currentRemaining <= 120) {
      if (uiStatus !== RuntimeUiStatus.Saving && uiStatus !== RuntimeUiStatus.Syncing && uiStatus !== RuntimeUiStatus.Submitting) {
        setUiStatus(RuntimeUiStatus.CriticalTimeLow);
      }
      return;
    }
    if (currentRemaining > 0 && currentRemaining <= 300) {
      if (uiStatus !== RuntimeUiStatus.Saving && uiStatus !== RuntimeUiStatus.Syncing && uiStatus !== RuntimeUiStatus.Submitting) {
        setUiStatus(RuntimeUiStatus.WarningTimeLow);
      }
    }
  }, [currentRemaining, stage, uiStatus]);

  useEffect(() => {
    if (stage === "submitted" || currentRemaining > 0 || submitting || pendingTransition) return;
    const next = getNextSection(stage);
    if (!next) {
      setAutoSubmitNote("Time ended, submitting.");
      void onSubmitFinal(true);
      return;
    }

    setPendingTransition({ from: stage, to: next });
    void persistAutosave({
      stage: next,
      sectionState: {
        [stage]: { remainingSeconds: 0 }
      }
    });
  }, [stage, currentRemaining, submitting, pendingTransition]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "enter") {
        event.preventDefault();
        if (stage === "submitted") return;
        const next = getNextSection(stage);
        if (next) {
          setPendingTransition({ from: stage, to: next });
        } else {
          setShowSubmitReview(true);
        }
        return;
      }

      if (stage === "core" && key === "n") {
        event.preventDefault();
        setIndex((prev) => Math.min(props.questions.length - 1, prev + 1));
      }
      if (stage === "core" && key === "p") {
        event.preventDefault();
        setIndex((prev) => Math.max(0, prev - 1));
      }
      if (stage === "core" && key === "f" && currentQuestion) {
        event.preventDefault();
        setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
      }
      if (key === "j") {
        event.preventDefault();
        setNavOpen((prev) => !prev);
      }
      if (stage === "core" && /^[1-9]$/.test(key)) {
        const targetIndex = Number(key) - 1;
        if (targetIndex < props.questions.length) {
          event.preventDefault();
          setIndex(targetIndex);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, props.questions.length, currentQuestion]);

  async function onAnswer(questionId: string, value: unknown) {
    setSectionState((prev) =>
      mergeSectionState(prev, {
        core: { answers: { [questionId]: value } }
      })
    );
    setVisited((prev) => ({ ...prev, [questionId]: true }));
    setUiStatus(RuntimeUiStatus.Saving);
    await persistAutosave({
      stage: "core",
      sectionState: {
        core: { answers: { [questionId]: value } }
      }
    });
  }

  function onPracticalChange(value: Record<string, unknown>) {
    setSectionState((prev) =>
      mergeSectionState(prev, {
        practical: { answers: value }
      })
    );
    void persistAutosave({
      sectionState: {
        practical: { answers: value }
      }
    });
  }

  function onLogicChange(value: Record<string, unknown>) {
    setSectionState((prev) =>
      mergeSectionState(prev, {
        applied_logic_reasoning: { answers: value }
      })
    );
    void persistAutosave({
      sectionState: {
        applied_logic_reasoning: { answers: value }
      }
    });
  }

  async function onSubmitFinal(auto = false) {
    if (submitting) return;
    setSubmitting(true);
    setUiStatus(RuntimeUiStatus.Submitting);
    if (auto) setShowSubmitReview(false);

    const response = await fetch(`/api/attempts/${props.attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = (await response.json()) as { ok: boolean; result: ResultSummary };
    if (data.ok) {
      setResult(data.result);
      setStage("submitted");
      setUiStatus(RuntimeUiStatus.Saved);
    } else {
      setUiStatus(RuntimeUiStatus.Idle);
    }
    setSubmitting(false);
  }

  async function confirmSectionStart() {
    if (!pendingTransition) return;
    const next = pendingTransition.to;
    setStage(next);
    setPendingTransition(null);
    await persistAutosave({ stage: next });
  }

  function goToNextOrSubmit() {
    if (stage === "submitted") return;
    const next = getNextSection(stage);
    if (next) {
      setPendingTransition({ from: stage, to: next });
      return;
    }
    setShowSubmitReview(true);
  }

  function questionState(questionId: string, questionIndex: number) {
    const isCurrent = stage === "core" && questionIndex === index;
    const isAnswered = coreAnswers[questionId] != null;
    const isFlagged = Boolean(flagged[questionId]);
    const isVisited = Boolean(visited[questionId]);
    const isSkipped = isVisited && !isAnswered;
    if (isCurrent) return "current" as const;
    if (isFlagged) return "flagged" as const;
    if (isAnswered) return "answered" as const;
    if (isSkipped) return "skipped" as const;
    return "unseen" as const;
  }

  function buildNavigatorItems(): NavigatorItem[] {
    return props.questions.map((question, questionIndex) => ({
      id: question.id,
      label: String(questionIndex + 1),
      state: questionState(question.id, questionIndex),
      onSelect:
        stage === "core"
          ? () => {
              setIndex(questionIndex);
              setNavOpen(false);
            }
          : undefined
    }));
  }

  function jumpToNextUnanswered() {
    const nextIndex = props.questions.findIndex((question) => coreAnswers[question.id] == null);
    if (nextIndex >= 0) {
      setIndex(nextIndex);
      setNavOpen(false);
    }
  }

  if (!currentQuestion && stage === "core") {
    return (
      <section className="space-y-4">
        <Card>
          <h1 className="text-2xl text-white">Questions unavailable</h1>
          <p className="mt-2 text-slate-300">Restart this attempt from check-in.</p>
          <Button className="mt-4" onClick={() => router.push(`/a/${props.slug}/start`)}>
            Back to Check-in
          </Button>
        </Card>
      </section>
    );
  }

  if (stage === "submitted" && result) {
    return (
      <section className="space-y-4">
        <StagePanel className="space-y-3">
          <h1 className="text-3xl text-white">
            {copy.runtime.finalScore} {result.finalPercent.toFixed(1)}%
          </h1>
          <p className="text-slate-200">
            {copy.runtime.outcome}: {result.pass ? "Pass" : result.borderline ? "Review" : "Fail"}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push(`/a/${props.slug}/result/${props.attemptId}`)}>{copy.runtime.openResult}</Button>
            <Button variant="secondary" onClick={() => router.push("/")}>
              {copy.runtime.finish}
            </Button>
          </div>
        </StagePanel>
      </section>
    );
  }

  const navigatorItems = buildNavigatorItems();
  const sectionProgress = buildSectionProgress();
  const previousSection = stage === "submitted" ? null : getPreviousSection(stage);
  const nextSection = stage === "submitted" ? null : getNextSection(stage);
  const nextSectionLabel = nextSection ? sectionRegistry[nextSection].label : "Submit";

  return (
    <section className="relative space-y-4 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.12),transparent_22%),linear-gradient(180deg,rgba(7,14,28,0.96),rgba(5,11,22,0.99))] p-4 pb-28 shadow-strong md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_78%,rgba(18,179,168,0.04))]" />

      <div className="relative z-10 space-y-4">
        <HudBar
          stageLabel={currentSectionLabel}
          roleId={props.roleId}
          stacks={props.stacks}
          sectionProgressLabel={sectionProgress.label}
          sectionProgressValue={sectionProgress.value}
          overallProgress={overallProgress}
          remainingSeconds={currentRemaining}
          statusLabel={status.label}
          statusTone={status.tone}
        />

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block lg:sticky lg:top-20 lg:h-fit">
            <NavigatorRail
              items={navigatorItems}
              practicalUnlocked={stage !== "core"}
              onNextUnanswered={jumpToNextUnanswered}
            />
          </div>

          <div className="space-y-4">
            {stage === "core" ? (
              <QuestionRuntimeCard
                question={currentQuestion}
                answer={coreAnswers[currentQuestion.id]}
                onChange={(value) => onAnswer(currentQuestion.id, value)}
              />
            ) : null}

            {stage === "practical" ? (
              props.practicalPack ? (
                <PracticalRuntimeCard
                  pack={props.practicalPack}
                  answer={practicalAnswers}
                  onChange={onPracticalChange}
                />
              ) : (
                <StagePanel>
                  <p className="text-slate-200">Practical section data is unavailable.</p>
                </StagePanel>
              )
            ) : null}

            {stage === "applied_logic_reasoning" && props.logicReasoningPack ? (
              <LogicReasoningRuntimeCard
                pack={props.logicReasoningPack}
                answer={logicAnswers}
                onChange={onLogicChange}
              />
            ) : null}

            {autoSubmitNote ? (
              <StagePanel className="border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-100">{autoSubmitNote}</p>
              </StagePanel>
            ) : null}
          </div>
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-x-4 bottom-24 z-30 lg:hidden">
          <NavigatorRail
            items={navigatorItems}
            practicalUnlocked={stage !== "core"}
            onNextUnanswered={jumpToNextUnanswered}
          />
        </div>
      ) : null}

      {pendingTransition ? (
        <SectionHandoff
          pendingCount={getSectionPendingCount(pendingTransition.from)}
          nextSectionLength={getSectionTotalItems(pendingTransition.to)}
          currentSectionLabel={sectionRegistry[pendingTransition.from].label}
          nextSectionLabel={sectionRegistry[pendingTransition.to].label}
          startLabel={`Start ${sectionRegistry[pendingTransition.to].label}`}
          onStart={confirmSectionStart}
          onBack={() => setPendingTransition(null)}
          showBack={true}
        />
      ) : null}

      {showSubmitReview ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <StagePanel className="w-full max-w-md space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">{copy.runtime.reviewSubmit}</p>
            <h3 className="text-2xl text-white">{copy.runtime.submitTitle}</h3>
            <p className="text-sm text-slate-200">
              {orderedSections
                .map((sectionId) => {
                  if (sectionId === "core") return `Core ${answeredCount}/${totalQuestions}`;
                  if (sectionId === "practical") return `Practical ${practicalCompleted}/${practicalTotal}`;
                  return `Logic ${logicReasoningCompleted}/${logicReasoningTotal}`;
                })
                .join(" | ")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onSubmitFinal(false)} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button variant="secondary" onClick={() => setShowSubmitReview(false)}>
                Back
              </Button>
            </div>
          </StagePanel>
        </div>
      ) : null}

      <ActionRail className="sticky bottom-0 left-0 mt-2 rounded-[22px] border-white/10 bg-ink-950/88">
        <Button variant="secondary" className="lg:hidden" onClick={() => setNavOpen((prev) => !prev)}>
          Navigator
        </Button>
        {stage === "core" ? (
          <>
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((prev) => Math.max(0, prev - 1))}>
              {copy.runtime.back}
            </Button>
            <Button
              variant="secondary"
              disabled={index === props.questions.length - 1}
              onClick={() => setIndex((prev) => Math.min(props.questions.length - 1, prev + 1))}
            >
              Next
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                currentQuestion &&
                setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))
              }
            >
              {currentQuestion && flagged[currentQuestion.id] ? "Unflag" : "Flag"}
            </Button>
            <Button onClick={goToNextOrSubmit}>{nextSection ? `Go to ${nextSectionLabel}` : copy.runtime.reviewSubmit}</Button>
          </>
        ) : (
          <>
            {previousSection ? (
              <Button variant="secondary" onClick={() => setStage(previousSection)}>
                {copy.runtime.back}
              </Button>
            ) : null}
            <Button onClick={goToNextOrSubmit} disabled={submitting}>
              {nextSection ? `Go to ${nextSectionLabel}` : copy.runtime.reviewSubmit}
            </Button>
          </>
        )}
      </ActionRail>
    </section>
  );
}

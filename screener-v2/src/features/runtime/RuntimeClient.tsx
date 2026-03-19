"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionRuntimeCard } from "@/components/runtime/QuestionRuntimeCard";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { ActionRail } from "@/components/primitives/ActionRail";
import type {
  ExamBlueprint,
  ExamQuestion,
  ExamState,
  ResultSummary,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { RuntimeUiStatus } from "@/features/runtime/ui-state";
import { HudBar } from "@/components/runtime/HudBar";
import { NavigatorRail, type NavigatorItem } from "@/components/runtime/NavigatorRail";
import { SectionHandoff } from "@/components/runtime/SectionHandoff";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";
import { answeredItemCount, examProgressValue, isExamItemAnswered } from "@/lib/exams/runtime";

interface RuntimeClientProps {
  slug: string;
  attemptId: string;
  roleId: RoleId;
  stacks: StackId[];
  blueprint: ExamBlueprint;
  initialExamState: Partial<Record<string, ExamState>>;
  initialIntegrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
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

function mergeExamState(
  base: Partial<Record<string, ExamState>>,
  patch: Partial<Record<string, Partial<ExamState>>>
): Partial<Record<string, ExamState>> {
  const next: Partial<Record<string, ExamState>> = { ...base };
  for (const [instanceId, incoming] of Object.entries(patch)) {
    if (!incoming) continue;
    const current = next[instanceId] ?? { answers: {}, remainingSeconds: 0 };
    next[instanceId] = {
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
  const orderedExams = useMemo(
    () => [...props.blueprint.exams].sort((a, b) => a.order - b.order),
    [props.blueprint.exams]
  );
  const [stage, setStage] = useState<string | "submitted">(() => orderedExams[0]?.instanceId ?? "submitted");
  const [itemIndices, setItemIndices] = useState<Record<string, number>>({});
  const [examState, setExamState] = useState<Partial<Record<string, ExamState>>>(() => {
    const next = { ...(props.initialExamState ?? {}) };
    for (const exam of orderedExams) {
      next[exam.instanceId] ??= {
        answers: {},
        remainingSeconds: exam.durationMinutes * 60
      };
    }
    return next;
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [uiStatus, setUiStatus] = useState<RuntimeUiStatus>(RuntimeUiStatus.Idle);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{ from: string; to: string } | null>(null);
  const [autoSubmitNote, setAutoSubmitNote] = useState("");
  const [integrity, setIntegrity] = useState(props.initialIntegrity);
  const [integrityNotice, setIntegrityNotice] = useState("");

  const currentExam = stage === "submitted" ? null : orderedExams.find((exam) => exam.instanceId === stage) ?? null;
  const currentIndex = currentExam ? itemIndices[currentExam.instanceId] ?? 0 : 0;
  const currentItems = currentExam?.contentSnapshot.items ?? [];
  const currentItem = currentItems[currentIndex] ?? null;
  const currentExamState = currentExam ? examState[currentExam.instanceId] : undefined;

  const overallProgress = useMemo(() => {
    if (orderedExams.length === 0) return 0;
    const ratios = orderedExams.map((exam) => examProgressValue(exam, examState[exam.instanceId]).ratio);
    return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
  }, [examState, orderedExams]);

  const currentRemaining =
    stage === "submitted"
      ? 0
      : Math.max(0, currentExamState?.remainingSeconds ?? (currentExam ? currentExam.durationMinutes * 60 : 0));
  const status = useMemo(() => statusMeta(uiStatus), [uiStatus]);

  const stageRef = useRef<string | "submitted">(stage);
  const remainingRef = useRef<number>(currentRemaining);
  const integrityNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    remainingRef.current = currentRemaining;
  }, [currentRemaining]);

  function getNextExam(current: string) {
    const index = orderedExams.findIndex((exam) => exam.instanceId === current);
    if (index < 0) return null;
    return orderedExams[index + 1] ?? null;
  }

  function getPreviousExam(current: string) {
    const index = orderedExams.findIndex((exam) => exam.instanceId === current);
    if (index <= 0) return null;
    return orderedExams[index - 1] ?? null;
  }

  function getPendingCount(examId: string) {
    const exam = orderedExams.find((item) => item.instanceId === examId);
    if (!exam) return 0;
    const answered = answeredItemCount(exam, examState[exam.instanceId]);
    return Math.max(0, exam.contentSnapshot.items.length - answered);
  }

  async function persistAutosave(payload?: {
    stage?: string | "submitted";
    examState?: Partial<Record<string, Partial<ExamState>>>;
    integrity?: typeof integrity;
  }) {
    const body = {
      stage: payload?.stage ?? stage,
      examState: payload?.examState ?? {},
      integrity: payload?.integrity
    };

    setUiStatus(RuntimeUiStatus.Syncing);
    const response = await fetch(`/api/attempts/${props.attemptId}/autosave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await response.json()) as {
      ok: boolean;
      stage?: string | "submitted";
      timers?: Record<string, number>;
      integrity?: typeof integrity;
    };
    if (data.ok && data.timers) {
      setExamState((prev) =>
        mergeExamState(
          prev,
          Object.fromEntries(
            Object.entries(data.timers ?? {}).map(([instanceId, remainingSeconds]) => [
              instanceId,
              { remainingSeconds }
            ])
          )
        )
      );
    }
    if (data.ok && data.stage && data.stage !== stageRef.current) {
      setStage(data.stage);
    }
    if (data.ok && data.integrity) {
      setIntegrity(data.integrity);
    }
    setUiStatus(RuntimeUiStatus.Saved);
  }

  function showIntegrityNotice(message: string) {
    setIntegrityNotice(message);
    if (integrityNoticeTimeoutRef.current) {
      clearTimeout(integrityNoticeTimeoutRef.current);
    }
    integrityNoticeTimeoutRef.current = setTimeout(() => {
      setIntegrityNotice("");
    }, 2400);
  }

  function recordIntegrity(type: keyof typeof integrity, message: string) {
    if (stageRef.current === "submitted") return;
    setIntegrity((prev) => {
      const next = { ...prev, [type]: prev[type] + 1 };
      void fetch(`/api/attempts/${props.attemptId}/autosave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: stageRef.current,
          integrity: next
        })
      });
      return next;
    });
    showIntegrityNotice(message);
  }

  useEffect(() => {
    if (!currentItem) return;
    setVisited((prev) => ({ ...prev, [currentItem.id]: true }));
  }, [currentItem]);

  useEffect(() => {
    if (stage === "submitted" || !currentExam) return;
    const timer = setInterval(() => {
      setExamState((prev) =>
        mergeExamState(prev, {
          [currentExam.instanceId]: {
            remainingSeconds: Math.max(0, (prev[currentExam.instanceId]?.remainingSeconds ?? 0) - 1)
          }
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [currentExam, stage]);

  useEffect(() => {
    if (stage === "submitted") return;
    const autosaveTimer = setInterval(() => {
      const activeStage = stageRef.current;
      if (activeStage === "submitted") return;
      void fetch(`/api/attempts/${props.attemptId}/autosave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: activeStage,
          examState: {
            [activeStage]: {
              remainingSeconds: Math.max(0, remainingRef.current)
            }
          }
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
    function onVisibilityChange() {
      if (document.hidden) {
        recordIntegrity("tabHiddenCount", "Tab switch detected. The timer keeps running.");
        return;
      }
      void persistAutosave();
    }

    function onCopy(event: ClipboardEvent) {
      event.preventDefault();
      recordIntegrity("copyCount", "Copy is disabled during the assessment.");
    }

    function onCut(event: ClipboardEvent) {
      event.preventDefault();
      recordIntegrity("copyCount", "Cut is disabled during the assessment.");
    }

    function onPaste(event: ClipboardEvent) {
      event.preventDefault();
      recordIntegrity("pasteCount", "Paste is disabled during the assessment.");
    }

    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      showIntegrityNotice("Right-click is disabled during the assessment.");
    }

    function onFocus() {
      void persistAutosave();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("focus", onFocus);
      if (integrityNoticeTimeoutRef.current) {
        clearTimeout(integrityNoticeTimeoutRef.current);
      }
    };
  }, [props.attemptId]);

  useEffect(() => {
    if (stage === "submitted" || currentRemaining > 0 || submitting || pendingTransition || !currentExam) return;
    const next = getNextExam(currentExam.instanceId);
    if (!next) {
      setAutoSubmitNote("Time ended, submitting.");
      void onSubmitFinal(true);
      return;
    }

    setPendingTransition({ from: currentExam.instanceId, to: next.instanceId });
    void persistAutosave({
      stage: next.instanceId,
      examState: {
        [currentExam.instanceId]: { remainingSeconds: 0 }
      }
    });
  }, [currentExam, currentRemaining, pendingTransition, stage, submitting]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "enter") {
        event.preventDefault();
        if (stage === "submitted" || !currentExam) return;
        const next = getNextExam(currentExam.instanceId);
        if (next) {
          setPendingTransition({ from: currentExam.instanceId, to: next.instanceId });
        } else {
          setShowSubmitReview(true);
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (key === "c" || key === "x")) {
        event.preventDefault();
        recordIntegrity("copyCount", "Copy is disabled during the assessment.");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "v") {
        event.preventDefault();
        recordIntegrity("pasteCount", "Paste is disabled during the assessment.");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "a") {
        event.preventDefault();
        showIntegrityNotice("Select all is disabled during the assessment.");
        return;
      }

      if (!currentExam || currentItems.length <= 1) return;

      if (key === "n") {
        event.preventDefault();
        setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: Math.min(currentItems.length - 1, currentIndex + 1) }));
      }
      if (key === "p") {
        event.preventDefault();
        setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: Math.max(0, currentIndex - 1) }));
      }
      if (key === "f" && currentItem) {
        event.preventDefault();
        setFlagged((prev) => ({ ...prev, [currentItem.id]: !prev[currentItem.id] }));
      }
      if (key === "j") {
        event.preventDefault();
        setNavOpen((prev) => !prev);
      }
      if (/^[1-9]$/.test(key)) {
        const targetIndex = Number(key) - 1;
        if (targetIndex < currentItems.length) {
          event.preventDefault();
          setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: targetIndex }));
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentExam, currentIndex, currentItem, currentItems, stage]);

  async function onAnswer(itemId: string, value: unknown) {
    if (!currentExam) return;
    setExamState((prev) =>
      mergeExamState(prev, {
        [currentExam.instanceId]: { answers: { [itemId]: value } }
      })
    );
    setVisited((prev) => ({ ...prev, [itemId]: true }));
    setUiStatus(RuntimeUiStatus.Saving);
    await persistAutosave({
      stage: currentExam.instanceId,
      examState: {
        [currentExam.instanceId]: { answers: { [itemId]: value } }
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
    setStage(pendingTransition.to);
    setPendingTransition(null);
    await persistAutosave({ stage: pendingTransition.to });
  }

  function goToNextOrSubmit() {
    if (stage === "submitted" || !currentExam) return;
    const next = getNextExam(currentExam.instanceId);
    if (next) {
      setPendingTransition({ from: currentExam.instanceId, to: next.instanceId });
      return;
    }
    setShowSubmitReview(true);
  }

  function itemState(item: ExamQuestion, index: number): NavigatorItem["state"] {
    const isCurrent = currentItem?.id === item.id;
    const answer = currentExamState?.answers?.[item.id];
    const isAnswered = isExamItemAnswered(item, answer);
    const isFlagged = Boolean(flagged[item.id]);
    const isVisited = Boolean(visited[item.id]);
    const isSkipped = isVisited && !isAnswered;
    if (isCurrent) return "current";
    if (isFlagged) return "flagged";
    if (isAnswered) return "answered";
    if (isSkipped) return "skipped";
    return "unseen";
  }

  function buildNavigatorItems(): NavigatorItem[] {
    if (!currentExam) return [];
    return currentExam.contentSnapshot.items.map((item, index) => ({
      id: item.id,
      label: String(index + 1),
      state: itemState(item, index),
      onSelect: () => {
        setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: index }));
        setNavOpen(false);
      }
    }));
  }

  function jumpToNextUnanswered() {
    if (!currentExam) return;
    const nextIndex = currentExam.contentSnapshot.items.findIndex(
      (item) => !isExamItemAnswered(item, currentExamState?.answers?.[item.id])
    );
    if (nextIndex >= 0) {
      setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: nextIndex }));
      setNavOpen(false);
    }
  }

  if (!currentItem && stage !== "submitted") {
    return (
      <section className="space-y-4">
        <Card>
          <h1 className="text-2xl text-white">Exam unavailable</h1>
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
            {copy.runtime.finalScore} {result.finalPercent.toFixed(1)} / 100
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
  const previousExam = currentExam ? getPreviousExam(currentExam.instanceId) : null;
  const nextExam = currentExam ? getNextExam(currentExam.instanceId) : null;
  const progress = currentExam ? examProgressValue(currentExam, currentExamState) : { answered: 0, total: 0, ratio: 0 };
  const sectionProgress = currentExam
    ? { label: `${currentExam.label} progress`, value: `${progress.answered}/${progress.total}` }
    : { label: "Progress", value: `${overallProgress}%` };

  return (
    <section className="relative space-y-4 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.12),transparent_22%),linear-gradient(180deg,rgba(7,14,28,0.96),rgba(5,11,22,0.99))] p-4 pb-28 shadow-strong md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_78%,rgba(18,179,168,0.04))]" />

      <div className="relative z-10 space-y-4">
        <HudBar
          stageLabel={currentExam?.label ?? "Submitted"}
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
              statusLabel={nextExam ? `${nextExam.label} next` : "Ready to submit"}
              statusTone={nextExam ? "teal" : "emerald"}
              onNextUnanswered={jumpToNextUnanswered}
            />
          </div>

          <div className="space-y-4">
            {currentExam ? (
              <QuestionRuntimeCard
                question={currentItem}
                answer={currentExamState?.answers?.[currentItem!.id]}
                onChange={(value) => onAnswer(currentItem!.id, value)}
                sectionLabel={currentExam.label}
                sectionSummary={currentExam.configSummary}
              />
            ) : null}

            {autoSubmitNote ? (
              <StagePanel className="border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-100">{autoSubmitNote}</p>
              </StagePanel>
            ) : null}

            <StagePanel className="border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-200">
                  Security controls active: copy, paste, cut, right-click, and tab switching are monitored.
                </p>
                <p className="text-xs text-slate-400">
                  Tabs hidden: {integrity.tabHiddenCount} | Copy/Cut: {integrity.copyCount} | Paste: {integrity.pasteCount}
                </p>
              </div>
              {integrityNotice ? <p className="mt-2 text-sm text-amber-200">{integrityNotice}</p> : null}
            </StagePanel>
          </div>
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-x-4 bottom-24 z-30 lg:hidden">
          <NavigatorRail
            items={navigatorItems}
            statusLabel={nextExam ? `${nextExam.label} next` : "Ready to submit"}
            statusTone={nextExam ? "teal" : "emerald"}
            onNextUnanswered={jumpToNextUnanswered}
          />
        </div>
      ) : null}

      {pendingTransition ? (
        <SectionHandoff
          pendingCount={getPendingCount(pendingTransition.from)}
          nextSectionLength={orderedExams.find((exam) => exam.instanceId === pendingTransition.to)?.contentSnapshot.items.length ?? 0}
          currentSectionLabel={orderedExams.find((exam) => exam.instanceId === pendingTransition.from)?.label ?? "Current exam"}
          nextSectionLabel={orderedExams.find((exam) => exam.instanceId === pendingTransition.to)?.label ?? "Next exam"}
          startLabel={`Start ${orderedExams.find((exam) => exam.instanceId === pendingTransition.to)?.label ?? "Exam"}`}
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
              {orderedExams
                .map((exam) => {
                  const examProgress = examProgressValue(exam, examState[exam.instanceId]);
                  return `${exam.label} ${examProgress.answered}/${examProgress.total}`;
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
        {currentExam && currentExam.contentSnapshot.items.length > 1 ? (
          <>
            <Button
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={() =>
                setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: Math.max(0, currentIndex - 1) }))
              }
            >
              {copy.runtime.back}
            </Button>
            <Button
              variant="secondary"
              disabled={currentIndex === currentExam.contentSnapshot.items.length - 1}
              onClick={() =>
                setItemIndices((prev) => ({
                  ...prev,
                  [currentExam.instanceId]: Math.min(currentExam.contentSnapshot.items.length - 1, currentIndex + 1)
                }))
              }
            >
              Next
            </Button>
            <Button
              variant="secondary"
              onClick={() => currentItem && setFlagged((prev) => ({ ...prev, [currentItem.id]: !prev[currentItem.id] }))}
            >
              {currentItem && flagged[currentItem.id] ? "Unflag" : "Flag"}
            </Button>
          </>
        ) : previousExam ? (
          <Button variant="secondary" onClick={() => setStage(previousExam.instanceId)}>
            {copy.runtime.back}
          </Button>
        ) : null}

        <Button onClick={goToNextOrSubmit} disabled={submitting}>
          {nextExam ? `Go to ${nextExam.label}` : copy.runtime.reviewSubmit}
        </Button>
      </ActionRail>
    </section>
  );
}

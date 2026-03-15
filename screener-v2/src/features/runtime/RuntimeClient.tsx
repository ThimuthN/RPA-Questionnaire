"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionRuntimeCard } from "@/components/runtime/QuestionRuntimeCard";
import { PracticalRuntimeCard } from "@/components/runtime/PracticalRuntimeCard";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { ActionRail } from "@/components/primitives/ActionRail";
import { isPracticalSubtaskAnswered } from "@/features/practical/grading";
import type { PracticalPack } from "@/features/practical/packs";
import type { Question, ResultSummary, RoleId, StackId } from "@/lib/assessment-engine/types";
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
  questions: Question[];
  practicalPack: PracticalPack;
  initialCoreSeconds: number;
  initialPracticalSeconds: number;
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

export function RuntimeClient(props: RuntimeClientProps) {
  const router = useRouter();
  const [stage, setStage] = useState<"core" | "practical" | "submitted">("core");
  const [index, setIndex] = useState(0);
  const [coreRemaining, setCoreRemaining] = useState(props.initialCoreSeconds);
  const [practicalRemaining, setPracticalRemaining] = useState(props.initialPracticalSeconds);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [practicalAnswer, setPracticalAnswer] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [uiStatus, setUiStatus] = useState<RuntimeUiStatus>(RuntimeUiStatus.Idle);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [showPracticalHandoff, setShowPracticalHandoff] = useState(false);
  const [autoSubmitNote, setAutoSubmitNote] = useState("");

  const currentQuestion = props.questions[index];
  const totalQuestions = props.questions.length;
  const answeredCount = props.questions.filter((question) => answers[question.id] != null).length;
  const unansweredCount = totalQuestions - answeredCount;
  const practicalTotal = props.practicalPack.subtasks.length;
  const practicalCompleted = props.practicalPack.subtasks.filter((subtask) => {
    return isPracticalSubtaskAnswered(subtask, practicalAnswer[subtask.id]);
  }).length;
  const coreRatio = totalQuestions ? answeredCount / totalQuestions : 0;
  const practicalRatio = practicalTotal ? practicalCompleted / practicalTotal : 0;
  const overallProgress = Math.round((coreRatio * 0.7 + practicalRatio * 0.3) * 100);
  const currentRemaining = stage === "core" ? coreRemaining : practicalRemaining;
  const status = useMemo(() => statusMeta(uiStatus), [uiStatus]);

  useEffect(() => {
    if (stage === "core" && currentQuestion) {
      setVisited((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }
  }, [stage, currentQuestion]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (stage === "core") setCoreRemaining((prev) => Math.max(0, prev - 1));
      if (stage === "practical") setPracticalRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if ((stage === "core" || stage === "practical") && currentRemaining > 0 && currentRemaining <= 120) {
      if (uiStatus !== RuntimeUiStatus.Saving && uiStatus !== RuntimeUiStatus.Syncing && uiStatus !== RuntimeUiStatus.Submitting) {
        setUiStatus(RuntimeUiStatus.CriticalTimeLow);
      }
      return;
    }
    if ((stage === "core" || stage === "practical") && currentRemaining > 0 && currentRemaining <= 300) {
      if (uiStatus !== RuntimeUiStatus.Saving && uiStatus !== RuntimeUiStatus.Syncing && uiStatus !== RuntimeUiStatus.Submitting) {
        setUiStatus(RuntimeUiStatus.WarningTimeLow);
      }
    }
  }, [currentRemaining, stage, uiStatus]);

  useEffect(() => {
    if (stage === "core" && coreRemaining === 0) {
      setStage("practical");
      setShowPracticalHandoff(true);
      setUiStatus(RuntimeUiStatus.Syncing);
      void fetch(`/api/attempts/${props.attemptId}/autosave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "practical",
          coreAnswers: answers,
          remainingCoreSeconds: 0
        })
      }).then(() => setUiStatus(RuntimeUiStatus.Saved));
    }
    if (stage === "practical" && practicalRemaining === 0 && !submitting) {
      setAutoSubmitNote("Time ended, submitting.");
      void onSubmitFinal(true);
    }
  }, [coreRemaining, stage, practicalRemaining, submitting, answers, props.attemptId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "enter") {
        event.preventDefault();
        if (stage === "practical") setShowSubmitReview(true);
        if (stage === "core") setShowPracticalHandoff(true);
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

  async function persistAutosave(extra: Record<string, unknown>) {
    setUiStatus(RuntimeUiStatus.Syncing);
    await fetch(`/api/attempts/${props.attemptId}/autosave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        coreAnswers: answers,
        practicalAnswer,
        remainingCoreSeconds: coreRemaining,
        remainingPracticalSeconds: practicalRemaining,
        ...extra
      })
    });
    setUiStatus(RuntimeUiStatus.Saved);
  }

  async function onAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setVisited((prev) => ({ ...prev, [questionId]: true }));
    setUiStatus(RuntimeUiStatus.Saving);
    await fetch(`/api/attempts/${props.attemptId}/autosave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "core",
        coreAnswers: { [questionId]: value }
      })
    });
    setUiStatus(RuntimeUiStatus.Saved);
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

  async function confirmPracticalStart() {
    setStage("practical");
    setShowPracticalHandoff(false);
    await persistAutosave({ stage: "practical" });
  }

  function questionState(questionId: string, questionIndex: number) {
    const isCurrent = stage === "core" && questionIndex === index;
    const isAnswered = answers[questionId] != null;
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
    const nextIndex = props.questions.findIndex((question) => answers[question.id] == null);
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
          <h1 className="text-3xl text-white">{copy.runtime.finalScore} {result.finalPercent.toFixed(1)}%</h1>
          <p className="text-slate-200">{copy.runtime.outcome}: {result.pass ? "Pass" : result.borderline ? "Review" : "Fail"}</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push(`/a/${props.slug}/result/${props.attemptId}`)}>{copy.runtime.openResult}</Button>
            <Button variant="secondary" onClick={() => router.push("/")}>{copy.runtime.finish}</Button>
          </div>
        </StagePanel>
      </section>
    );
  }

  const navigatorItems = buildNavigatorItems();

  return (
    <section className="relative space-y-4 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.12),transparent_22%),linear-gradient(180deg,rgba(7,14,28,0.96),rgba(5,11,22,0.99))] p-4 pb-28 shadow-strong md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_78%,rgba(18,179,168,0.04))]" />

      <div className="relative z-10 space-y-4">
        <HudBar
          stage={stage === "submitted" ? "practical" : stage}
          roleId={props.roleId}
          stacks={props.stacks}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          practicalCompleted={practicalCompleted}
          practicalTotal={practicalTotal}
          overallProgress={overallProgress}
          remainingSeconds={currentRemaining}
          statusLabel={status.label}
          statusTone={status.tone}
        />

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block lg:sticky lg:top-20 lg:h-fit">
            <NavigatorRail
              items={navigatorItems}
              practicalUnlocked={stage === "practical"}
              onNextUnanswered={jumpToNextUnanswered}
            />
          </div>

          <div className="space-y-4">
            {stage === "core" ? (
              <QuestionRuntimeCard
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onChange={(value) => onAnswer(currentQuestion.id, value)}
              />
            ) : (
              <PracticalRuntimeCard
                pack={props.practicalPack}
                answer={practicalAnswer}
                onChange={(value) => {
                  setPracticalAnswer(value);
                  void persistAutosave({ practicalAnswer: value });
                }}
              />
            )}

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
            practicalUnlocked={stage === "practical"}
            onNextUnanswered={jumpToNextUnanswered}
          />
        </div>
      ) : null}

      {showPracticalHandoff ? (
        <SectionHandoff
          unansweredCount={unansweredCount}
          practicalLength={practicalTotal}
          onStart={confirmPracticalStart}
          onBack={() => setShowPracticalHandoff(false)}
          showBack={stage === "core"}
        />
      ) : null}

      {showSubmitReview ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <StagePanel className="w-full max-w-md space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">{copy.runtime.reviewSubmit}</p>
            <h3 className="text-2xl text-white">{copy.runtime.submitTitle}</h3>
            <p className="text-sm text-slate-200">
              Core unanswered: {unansweredCount} | Practical completed: {practicalCompleted}/{practicalTotal}
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
            <Button onClick={() => setShowPracticalHandoff(true)}>Go to practical</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStage("core")}>
              {copy.runtime.back}
            </Button>
            <Button onClick={() => setShowSubmitReview(true)} disabled={submitting}>
              {copy.runtime.reviewSubmit}
            </Button>
          </>
        )}
      </ActionRail>
    </section>
  );
}

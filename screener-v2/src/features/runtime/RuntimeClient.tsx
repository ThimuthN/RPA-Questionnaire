"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionRuntimeCard } from "@/components/runtime/QuestionRuntimeCard";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import type {
  ExamBlueprint,
  ExamQuestion,
  ExamState,
    IntegrityPresetId,
    ResultSummary,
    StackId
  } from "@/lib/assessment-engine/types";
import { RuntimeUiStatus } from "@/features/runtime/ui-state";
import { HudBar } from "@/components/runtime/HudBar";
import { RuntimeTrustBanner } from "@/components/runtime/RuntimeTrustBanner";
import { RuntimeRecoveryModal } from "@/components/runtime/RuntimeRecoveryModal";
import { NavigatorRail, type NavigatorItem } from "@/components/runtime/NavigatorRail";
import { SectionHandoff } from "@/components/runtime/SectionHandoff";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";
import { answeredItemCount, examProgressValue, isExamItemAnswered } from "@/lib/exams/runtime";
import { getIntegrityPolicy } from "@/lib/integrity/policy";

type IntegritySnapshot = { tabHiddenCount: number; copyCount: number; pasteCount: number };

interface RuntimeClientProps {
  slug: string;
  attemptId: string;
  integrityPreset: IntegrityPresetId;
  roleId?: string;
  stacks: StackId[];
  blueprint: ExamBlueprint;
  initialStage?: string | "submitted";
  initialExamState: Partial<Record<string, ExamState>>;
  initialIntegrity: IntegritySnapshot;
  initialStateVersion: number;
  watermarkLabel: string;
}

type AttemptSyncPayload = {
  ok: boolean;
  code?: string;
  message?: string;
  savedAt?: string;
  stage?: string | "submitted";
  timers?: Record<string, number>;
  integrity?: IntegritySnapshot;
  stateVersion?: number;
};

type SubmitResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  result?: ResultSummary;
  stage?: string | "submitted";
  timers?: Record<string, number>;
  integrity?: IntegritySnapshot;
  stateVersion?: number;
};

function mergeIntegrity(local: IntegritySnapshot, server: IntegritySnapshot): IntegritySnapshot {
  return {
    tabHiddenCount: Math.max(local.tabHiddenCount, server.tabHiddenCount),
    copyCount: Math.max(local.copyCount, server.copyCount),
    pasteCount: Math.max(local.pasteCount, server.pasteCount)
  };
}

function statusMeta(status: RuntimeUiStatus): { label: string; tone: "blue" | "teal" | "emerald" | "amber" | "red" } {
  switch (status) {
    case RuntimeUiStatus.Attention:
      return { label: "Needs attention", tone: "amber" };
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

function syncTimeLabel(value?: string) {
  if (!value) return "the last confirmed sync";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "the last confirmed sync";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
  const integrityPolicy = useMemo(() => getIntegrityPolicy(props.integrityPreset), [props.integrityPreset]);
  const [stage, setStage] = useState<string | "submitted">(() => {
    if (props.initialStage === "submitted") {
      return "submitted";
    }
    if (
      typeof props.initialStage === "string" &&
      orderedExams.some((exam) => exam.instanceId === props.initialStage)
    ) {
      return props.initialStage;
    }
    return orderedExams[0]?.instanceId ?? "submitted";
  });
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
  const [stateVersion, setStateVersion] = useState(props.initialStateVersion);
  const [integrityNotice, setIntegrityNotice] = useState("");
  const [saveIssue, setSaveIssue] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date().toISOString());
  const [privacyShieldActive, setPrivacyShieldActive] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  const currentExam = stage === "submitted" ? null : orderedExams.find((exam) => exam.instanceId === stage) ?? null;
  const currentIndex = currentExam ? itemIndices[currentExam.instanceId] ?? 0 : 0;
  const currentItems = currentExam?.contentSnapshot.items ?? [];
  const currentItem = currentItems[currentIndex] ?? null;
  const currentExamState = currentExam ? examState[currentExam.instanceId] : undefined;

  const currentRemaining =
    stage === "submitted"
      ? 0
      : Math.max(0, currentExamState?.remainingSeconds ?? (currentExam ? currentExam.durationMinutes * 60 : 0));
  const status = useMemo(
    () => (saveIssue ? statusMeta(RuntimeUiStatus.Attention) : statusMeta(uiStatus)),
    [saveIssue, uiStatus]
  );
  const trustNote = useMemo(() => {
    if (privacyShieldActive) {
      return integrityPolicy.requireFullscreen && fullscreenSupported && !isFullscreenActive
        ? "Your session is waiting behind a recovery step. Re-enter full-screen to continue."
        : "Your session is waiting behind a recovery step. Resume when you are ready to continue.";
    }
    if (saveIssue) return saveIssue;
    if (integrityNotice) return integrityNotice;
    if (uiStatus === RuntimeUiStatus.Submitting) return "Submitting your assessment now.";
    if (uiStatus === RuntimeUiStatus.Syncing) {
      return "Saving your latest work in the background.";
    }
    if (uiStatus === RuntimeUiStatus.Saved) {
      return "Saved just now. Keep going and your latest answer will stay protected.";
    }
    if (uiStatus === RuntimeUiStatus.CriticalTimeLow) {
      return "Less than two minutes remain. Keep moving and your answers will continue to save.";
    }
    if (uiStatus === RuntimeUiStatus.WarningTimeLow) {
      return "Less than five minutes remain. Focus on your highest-confidence answers.";
    }
    if (autoSubmitNote) return autoSubmitNote;
    return "Your answers keep saving while you work. If something interrupts the flow, you will be guided back in.";
  }, [
    autoSubmitNote,
    fullscreenSupported,
    integrityNotice,
    integrityPolicy.requireFullscreen,
    isFullscreenActive,
    privacyShieldActive,
    saveIssue,
    uiStatus
  ]);

  const stageRef = useRef<string | "submitted">(stage);
  const examStateRef = useRef(examState);
  const integrityRef = useRef(integrity);
  const remainingRef = useRef<number>(currentRemaining);
  const stateVersionRef = useRef<number>(props.initialStateVersion);
  const integrityNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearSyncIndicator() {
    if (syncIndicatorTimeoutRef.current) {
      clearTimeout(syncIndicatorTimeoutRef.current);
      syncIndicatorTimeoutRef.current = null;
    }
  }

  function scheduleSyncIndicator() {
    clearSyncIndicator();
    syncIndicatorTimeoutRef.current = setTimeout(() => {
      setUiStatus((prev) =>
        prev === RuntimeUiStatus.Submitting ? RuntimeUiStatus.Submitting : RuntimeUiStatus.Syncing
      );
      syncIndicatorTimeoutRef.current = null;
    }, 400);
  }

  function applyAutosaveResponse(
    data: AttemptSyncPayload,
    options?: { updateStage?: boolean; updateTimers?: boolean }
  ) {
    if (options?.updateTimers !== false && data.timers) {
      setExamState((prev) => {
        const next = mergeExamState(
          prev,
          Object.fromEntries(
            Object.entries(data.timers ?? {}).map(([instanceId, remainingSeconds]) => [
              instanceId,
              { remainingSeconds }
            ])
          )
        );
        examStateRef.current = next;
        return next;
      });
    }
    if (options?.updateStage !== false && data.stage && data.stage !== stageRef.current) {
      stageRef.current = data.stage;
      setStage(data.stage);
    }
    if (data.integrity) {
      const nextIntegrity = mergeIntegrity(integrityRef.current, data.integrity);
      integrityRef.current = nextIntegrity;
      setIntegrity(nextIntegrity);
    }
    if (typeof data.stateVersion === "number") {
      stateVersionRef.current = data.stateVersion;
      setStateVersion(data.stateVersion);
    }
    if (data.savedAt) {
      setLastSyncedAt(data.savedAt);
    }
    setSaveIssue("");
  }

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    // Conflict retries happen after async round-trips, so refs must track the latest
    // rendered state instead of relying on whatever state snapshot created the request.
    examStateRef.current = examState;
  }, [examState]);

  useEffect(() => {
    // Integrity can change from background events while a request is in flight.
    // Keeping a ref in sync prevents replaying an older snapshot after a conflict.
    integrityRef.current = integrity;
  }, [integrity]);

  useEffect(() => {
    remainingRef.current = currentRemaining;
  }, [currentRemaining]);

  useEffect(() => {
    stateVersionRef.current = stateVersion;
  }, [stateVersion]);

  useEffect(() => {
    return () => {
      if (syncIndicatorTimeoutRef.current) {
        clearTimeout(syncIndicatorTimeoutRef.current);
      }
    };
  }, []);

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

  function getFlaggedCount(examId: string) {
    const exam = orderedExams.find((item) => item.instanceId === examId);
    if (!exam) return 0;
    return exam.contentSnapshot.items.filter((item) => Boolean(flagged[item.id])).length;
  }

  function jumpToExamItem(examId: string, index: number) {
    setStage(examId);
    setItemIndices((prev) => ({ ...prev, [examId]: index }));
    setShowSubmitReview(false);
    setNavOpen(false);
  }

  function jumpToFirstUnansweredAcrossExams() {
    for (const exam of orderedExams) {
      const nextIndex = exam.contentSnapshot.items.findIndex(
        (item) => !isExamItemAnswered(item, examState[exam.instanceId]?.answers?.[item.id])
      );
      if (nextIndex >= 0) {
        jumpToExamItem(exam.instanceId, nextIndex);
        return;
      }
    }
  }

  async function sendAutosaveRequest(
    body: {
      stage?: string | "submitted";
      examState?: Partial<Record<string, Partial<ExamState>>>;
      integrity?: IntegritySnapshot;
    },
    options?: { updateStage?: boolean; updateTimers?: boolean },
    retryCount = 0
  ): Promise<AttemptSyncPayload> {
    const response = await fetch(`/api/attempts/${props.attemptId}/autosave`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        expectedStateVersion: stateVersionRef.current
      })
    });
    const data = (await response.json()) as AttemptSyncPayload;

    if (response.status === 409 && data.code === "version_conflict" && retryCount < 2) {
      if (options?.updateTimers !== false && data.timers) {
        setExamState((prev) => {
          const next = mergeExamState(
            prev,
            Object.fromEntries(
              Object.entries(data.timers ?? {}).map(([instanceId, remainingSeconds]) => [
                instanceId,
                { remainingSeconds }
              ])
            )
          );
          examStateRef.current = next;
          return next;
        });
      }
      if (options?.updateStage !== false && data.stage && data.stage !== stageRef.current) {
        stageRef.current = data.stage;
        setStage(data.stage);
      }
      if (typeof data.stateVersion === "number") {
        stateVersionRef.current = data.stateVersion;
        setStateVersion(data.stateVersion);
      }

      // Retrying the original request body is dangerous here because it may contain
      // older answers or integrity values than the client currently holds.
      // Rebuild from refs so the retry uses the latest client-authoritative state.
      return sendAutosaveRequest(
        {
          stage: stageRef.current,
          examState: examStateRef.current,
          integrity: integrityRef.current
        },
        options,
        retryCount + 1
      );
    }

    return data;
  }

  async function persistAutosave(payload?: {
    stage?: string | "submitted";
    examState?: Partial<Record<string, Partial<ExamState>>>;
    integrity?: IntegritySnapshot;
  }) {
    const body = {
      stage: payload?.stage ?? stage,
      examState: payload?.examState ?? {},
      integrity: payload?.integrity
    };

    scheduleSyncIndicator();
    try {
      const data = await sendAutosaveRequest(body);
      if (!data.ok) {
        throw new Error(data.message ?? "Autosave could not be confirmed.");
      }
      clearSyncIndicator();
      applyAutosaveResponse(data);
      setUiStatus(RuntimeUiStatus.Saved);
      return true;
    } catch {
      clearSyncIndicator();
      setSaveIssue("We could not confirm the latest save. Keep this tab open while we reconnect.");
      setUiStatus(RuntimeUiStatus.Attention);
      return false;
    }
  }

  async function persistHeartbeat(activeStage: string) {
    scheduleSyncIndicator();
    try {
      const data = await sendAutosaveRequest(
        {
          stage: activeStage,
          examState: {
            [activeStage]: {
              remainingSeconds: Math.max(0, remainingRef.current)
            }
          }
        },
        { updateStage: false, updateTimers: false }
      );
      if (!data.ok) {
        throw new Error(data.message ?? "Background sync could not be confirmed.");
      }
      clearSyncIndicator();
      applyAutosaveResponse(data, { updateStage: false, updateTimers: false });
      setUiStatus(RuntimeUiStatus.Saved);
    } catch {
      clearSyncIndicator();
      setSaveIssue("We could not confirm the latest save. Keep this tab open while we reconnect.");
    }
  }

  async function requestFullscreenMode() {
    if (typeof document === "undefined" || !document.fullscreenEnabled) return false;
    if (document.fullscreenElement) {
      setIsFullscreenActive(true);
      return true;
    }

    const target = document.documentElement;
    if (!target.requestFullscreen) return false;

    try {
      await target.requestFullscreen();
      setIsFullscreenActive(Boolean(document.fullscreenElement));
      return Boolean(document.fullscreenElement);
    } catch {
      setIsFullscreenActive(Boolean(document.fullscreenElement));
      showIntegrityNotice("Full-screen permission was not granted. Re-enter to continue.", 4200);
      return false;
    }
  }

  async function resumeAssessmentView() {
    if (integrityPolicy.requireFullscreen && fullscreenSupported && !isFullscreenActive) {
      const ok = await requestFullscreenMode();
      if (!ok) return;
    }
    await persistAutosave();
    setPrivacyShieldActive(false);
  }

  function showIntegrityNotice(message: string, durationMs = 3200) {
    setIntegrityNotice(message);
    if (integrityNoticeTimeoutRef.current) {
      clearTimeout(integrityNoticeTimeoutRef.current);
    }
    integrityNoticeTimeoutRef.current = setTimeout(() => {
      setIntegrityNotice("");
    }, durationMs);
  }

  function recordIntegrity(type: keyof typeof integrity, message: string) {
    if (stageRef.current === "submitted") return;
    setIntegrity((prev) => {
      const next = { ...prev, [type]: prev[type] + 1 };
      integrityRef.current = next;
      void (async () => {
        try {
          const data = await sendAutosaveRequest(
            {
              stage: stageRef.current,
              integrity: next
            },
            { updateStage: false, updateTimers: false }
          );
          if (!data.ok) {
            throw new Error(data.message ?? "Integrity event could not be confirmed.");
          }
          applyAutosaveResponse(data, { updateStage: false, updateTimers: false });
        } catch {
          setSaveIssue("We noted the interruption, but the latest sync has not been confirmed yet.");
        }
      })();
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
      setExamState((prev) => {
        const next = mergeExamState(prev, {
          [currentExam.instanceId]: {
            remainingSeconds: Math.max(0, (prev[currentExam.instanceId]?.remainingSeconds ?? 0) - 1)
          }
        });
        examStateRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentExam, stage]);

  useEffect(() => {
    if (stage === "submitted") return;
    const autosaveTimer = setInterval(() => {
      const activeStage = stageRef.current;
      if (activeStage === "submitted") return;
      void persistHeartbeat(activeStage);
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
    if (typeof document === "undefined") return;

    setFullscreenSupported(Boolean(document.fullscreenEnabled));
    setIsFullscreenActive(Boolean(document.fullscreenElement));

    function onFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreenActive(active);
      if (
        integrityPolicy.requireFullscreen &&
        !active &&
        document.fullscreenEnabled &&
        stageRef.current !== "submitted"
      ) {
        setPrivacyShieldActive(true);
        showIntegrityNotice("Full-screen was exited. Your answers remain saved up to the last confirmed sync.");
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [integrityPolicy.requireFullscreen]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        if (integrityPolicy.blurShieldEnabled) {
          setPrivacyShieldActive(true);
        }
        if (integrityPolicy.monitorTabSwitch) {
          recordIntegrity("tabHiddenCount", "Tab switch detected. The timer kept running while you were away.");
        }
        return;
      }
      void persistAutosave();
    }

    function onCopy(event: ClipboardEvent) {
      if (!integrityPolicy.monitorClipboard) return;
      if (integrityPolicy.blockClipboard) {
        event.preventDefault();
        recordIntegrity("copyCount", "Copy is disabled for this assessment. Your progress is still safe.");
        return;
      }
      recordIntegrity("copyCount", "Clipboard activity was noted. You can keep working once you are ready.");
    }

    function onCut(event: ClipboardEvent) {
      if (!integrityPolicy.monitorClipboard) return;
      if (integrityPolicy.blockClipboard) {
        event.preventDefault();
        recordIntegrity("copyCount", "Cut is disabled for this assessment. Your progress is still safe.");
        return;
      }
      recordIntegrity("copyCount", "Clipboard activity was noted. You can keep working once you are ready.");
    }

    function onPaste(event: ClipboardEvent) {
      if (!integrityPolicy.monitorClipboard) return;
      if (integrityPolicy.blockClipboard) {
        event.preventDefault();
        recordIntegrity("pasteCount", "Paste is disabled for this assessment. Your progress is still safe.");
        return;
      }
      recordIntegrity("pasteCount", "Clipboard activity was noted. You can keep working once you are ready.");
    }

    function onContextMenu(event: MouseEvent) {
      if (!integrityPolicy.blockContextMenu) return;
      event.preventDefault();
      showIntegrityNotice("Right-click is disabled for this assessment.");
    }

    function onFocus() {
      if (integrityPolicy.blurShieldEnabled && stageRef.current !== "submitted") {
        setPrivacyShieldActive(true);
      }
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
  }, [
    integrityPolicy.blockClipboard,
    integrityPolicy.blockContextMenu,
    integrityPolicy.blurShieldEnabled,
    integrityPolicy.monitorClipboard,
    integrityPolicy.monitorTabSwitch,
    props.attemptId
  ]);

  useEffect(() => {
    if (!integrityPolicy.requireFullscreen || !fullscreenSupported || stage === "submitted") return;
    if (!isFullscreenActive) {
      setPrivacyShieldActive(true);
    }
  }, [fullscreenSupported, integrityPolicy.requireFullscreen, isFullscreenActive, stage]);

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
        if (!integrityPolicy.monitorClipboard) return;
        if (integrityPolicy.blockClipboard) {
          event.preventDefault();
          recordIntegrity("copyCount", "Copy is disabled for this assessment. Your progress is still safe.");
          return;
        }
        recordIntegrity("copyCount", "Clipboard activity was noted. You can keep working once you are ready.");
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "v") {
        if (!integrityPolicy.monitorClipboard) return;
        if (integrityPolicy.blockClipboard) {
          event.preventDefault();
          recordIntegrity("pasteCount", "Paste is disabled for this assessment. Your progress is still safe.");
          return;
        }
        recordIntegrity("pasteCount", "Clipboard activity was noted. You can keep working once you are ready.");
        return;
      }

      if (integrityPolicy.blockClipboard && (event.ctrlKey || event.metaKey) && key === "a") {
        event.preventDefault();
        showIntegrityNotice("Select all is disabled for this assessment.");
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
  }, [currentExam, currentIndex, currentItem, currentItems, integrityPolicy.blockClipboard, integrityPolicy.monitorClipboard, stage]);

  async function onAnswer(itemId: string, value: unknown) {
    if (!currentExam) return;
    setExamState((prev) => {
      const next = mergeExamState(prev, {
        [currentExam.instanceId]: { answers: { [itemId]: value } }
      });
      examStateRef.current = next;
      return next;
    });
    setVisited((prev) => ({ ...prev, [itemId]: true }));
    await persistAutosave({
      stage: currentExam.instanceId,
      examState: {
        [currentExam.instanceId]: { answers: { [itemId]: value } }
      }
    });
  }

  async function flushAttemptState() {
    return persistAutosave({
      stage: stageRef.current,
      examState,
      integrity
    });
  }

  async function onSubmitFinal(auto = false, retryCount = 0) {
    if (submitting && retryCount === 0) return;
    setSubmitting(true);
    setUiStatus(RuntimeUiStatus.Submitting);
    if (auto) setShowSubmitReview(false);

    const flushed = await flushAttemptState();
    if (!flushed) {
      setSaveIssue("We could not confirm the final save. Please keep this tab open and try again.");
      setUiStatus(RuntimeUiStatus.Attention);
      setSubmitting(false);
      return;
    }

    const response = await fetch(`/api/attempts/${props.attemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedStateVersion: stateVersionRef.current
      })
    });
    const data = (await response.json()) as SubmitResponse;
    if (data.ok) {
      if (typeof data.stateVersion === "number") {
        stateVersionRef.current = data.stateVersion;
        setStateVersion(data.stateVersion);
      }
      setResult(data.result ?? null);
      setStage("submitted");
      setSaveIssue("");
      setUiStatus(RuntimeUiStatus.Saved);
    } else if (response.status === 409 && data.code === "version_conflict" && retryCount < 2) {
      applyAutosaveResponse(data);
      setSubmitting(false);
      await onSubmitFinal(auto, retryCount + 1);
      return;
    } else {
      setSaveIssue("We could not submit just yet. Your answers remain in the attempt, so please try again.");
      setUiStatus(RuntimeUiStatus.Attention);
    }
    setSubmitting(false);
  }

  async function confirmSectionStart() {
    if (!pendingTransition) return;
    stageRef.current = pendingTransition.to;
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

  function itemState(item: ExamQuestion): NavigatorItem["state"] {
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
      state: itemState(item),
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
  const currentFlaggedCount = currentExam ? getFlaggedCount(currentExam.instanceId) : 0;
  const currentUnansweredCount = Math.max(0, progress.total - progress.answered);
  const submitReviewRows = orderedExams.map((exam) => {
    const examProgress = examProgressValue(exam, examState[exam.instanceId]);
    const unanswered = Math.max(0, examProgress.total - examProgress.answered);
    const flaggedCount = getFlaggedCount(exam.instanceId);
    return {
      exam,
      answered: examProgress.answered,
      total: examProgress.total,
      unanswered,
      flaggedCount
    };
  });
  const totalAnsweredCount = submitReviewRows.reduce((sum, row) => sum + row.answered, 0);
  const totalQuestionCount = submitReviewRows.reduce((sum, row) => sum + row.total, 0);
  const totalUnansweredCount = submitReviewRows.reduce((sum, row) => sum + row.unanswered, 0);
  const totalFlaggedCount = submitReviewRows.reduce((sum, row) => sum + row.flaggedCount, 0);
  const sectionProgressValue = `${progress.answered}/${progress.total}`;
  const recoveryTitle =
    integrityPolicy.requireFullscreen && fullscreenSupported && !isFullscreenActive
      ? "Return to full-screen to continue"
      : "Resume your assessment";
  const recoveryMessage =
    integrityPolicy.requireFullscreen && fullscreenSupported && !isFullscreenActive
      ? "Full-screen is part of this assessment's protection rules. The timer did not stop while full-screen was off."
      : "Your assessment is ready to resume. The timer did not stop while the session was out of focus.";
  const recoveryFacts = [
    "Timer status: it continued running during the interruption.",
    `Saved answers: confirmed through ${syncTimeLabel(lastSyncedAt)}.`,
    `Integrity preset: ${integrityPolicy.label}.`,
    `Activity counts: tab switches ${integrity.tabHiddenCount}, copy/cut ${integrity.copyCount}, paste ${integrity.pasteCount}.`
  ];

  return (
    <section className="relative select-none space-y-4 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(47,134,255,0.12),transparent_22%),linear-gradient(180deg,rgba(7,14,28,0.96),rgba(5,11,22,0.99))] p-4 pb-28 shadow-strong md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_78%,rgba(18,179,168,0.04))]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
        <div className="absolute -left-10 top-20 rotate-[-18deg] text-2xl font-medium uppercase tracking-[0.28em] text-white/70">
          {props.watermarkLabel} / {props.attemptId.slice(0, 12)}
        </div>
        <div className="absolute right-[-40px] top-1/3 rotate-[-18deg] text-2xl font-medium uppercase tracking-[0.28em] text-white/70">
          {props.watermarkLabel} / {props.attemptId.slice(0, 12)}
        </div>
        <div className="absolute left-6 bottom-24 rotate-[-18deg] text-2xl font-medium uppercase tracking-[0.28em] text-white/70">
          {props.watermarkLabel} / {props.attemptId.slice(0, 12)}
        </div>
      </div>

      <div
        className={`relative z-10 space-y-4 transition duration-200 ${
          privacyShieldActive ? "pointer-events-none blur-md" : ""
        }`}
      >
        <HudBar
          stageLabel={currentExam?.label ?? "Submitted"}
          roleId={props.roleId}
          sectionProgressValue={sectionProgressValue}
          remainingSeconds={currentRemaining}
          statusLabel={status.label}
          statusTone={status.tone}
          trustStrip={
            <RuntimeTrustBanner
              lastSyncedAt={lastSyncedAt}
              integrityPresetLabel={integrityPolicy.shortLabel}
              note={trustNote}
            />
          }
        />

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="hidden lg:block lg:sticky lg:top-20 lg:h-fit">
            <NavigatorRail
              items={navigatorItems}
              statusLabel={nextExam ? `${nextExam.label} next` : "Ready to submit"}
              onNextUnanswered={jumpToNextUnanswered}
              answeredCount={progress.answered}
              unansweredCount={currentUnansweredCount}
              flaggedCount={currentFlaggedCount}
            />
          </div>

          <div className="space-y-4">
            {currentExam ? (
              <QuestionRuntimeCard
                question={currentItem}
                answer={currentExamState?.answers?.[currentItem!.id]}
                onChange={(value) => onAnswer(currentItem!.id, value)}
                questionIndex={currentIndex}
                questionCount={currentItems.length}
              />
            ) : null}

            {autoSubmitNote ? (
              <StagePanel className="border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-100">{autoSubmitNote}</p>
              </StagePanel>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="lg:hidden" onClick={() => setNavOpen((prev) => !prev)}>
                {navOpen ? "Hide navigator" : "Open navigator"}
              </Button>
              <Button
                variant="secondary"
                disabled={!currentExam || (currentIndex === 0 && !previousExam)}
                onClick={() => {
                  if (!currentExam) return;
                  if (currentIndex > 0) {
                    setItemIndices((prev) => ({ ...prev, [currentExam.instanceId]: Math.max(0, currentIndex - 1) }));
                    return;
                  }
                  if (previousExam) {
                    setStage(previousExam.instanceId);
                    setItemIndices((prev) => ({
                      ...prev,
                      [previousExam.instanceId]: Math.max(0, previousExam.contentSnapshot.items.length - 1)
                    }));
                  }
                }}
              >
                {copy.runtime.back}
              </Button>
              <Button
                variant="secondary"
                onClick={() => currentItem && setFlagged((prev) => ({ ...prev, [currentItem.id]: !prev[currentItem.id] }))}
              >
                {currentItem && flagged[currentItem.id] ? "Unflag" : "Flag"}
              </Button>
              <Button
                onClick={() => {
                  if (!currentExam) return;
                  if (currentIndex < currentExam.contentSnapshot.items.length - 1) {
                    setItemIndices((prev) => ({
                      ...prev,
                      [currentExam.instanceId]: Math.min(currentExam.contentSnapshot.items.length - 1, currentIndex + 1)
                    }));
                    return;
                  }
                  goToNextOrSubmit();
                }}
                disabled={submitting}
              >
                {currentExam && currentIndex < currentExam.contentSnapshot.items.length - 1
                  ? "Next"
                  : nextExam
                    ? "Next section"
                    : copy.runtime.reviewSubmit}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {navOpen ? (
        <div className="fixed inset-x-4 bottom-24 z-30 lg:hidden">
          <NavigatorRail
            items={navigatorItems}
            statusLabel={nextExam ? `${nextExam.label} next` : "Ready to submit"}
            onNextUnanswered={jumpToNextUnanswered}
            answeredCount={progress.answered}
            unansweredCount={currentUnansweredCount}
            flaggedCount={currentFlaggedCount}
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

      <RuntimeRecoveryModal
        open={privacyShieldActive}
        title={recoveryTitle}
        message={recoveryMessage}
        facts={recoveryFacts}
        actionLabel={
          integrityPolicy.requireFullscreen && fullscreenSupported && !isFullscreenActive
            ? "Enter full-screen"
            : "Resume assessment"
        }
        onAction={() => void resumeAssessmentView()}
      />

      {showSubmitReview ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
          <StagePanel className="w-full max-w-lg space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">{copy.runtime.reviewSubmit}</p>
            <h3 className="text-2xl text-white">{copy.runtime.submitTitle}</h3>
            <div className="flex flex-wrap gap-2 text-sm text-slate-200">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1">
                Answered {totalAnsweredCount}/{totalQuestionCount}
              </span>
              <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1">
                Unanswered {totalUnansweredCount}
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1">
                Flagged {totalFlaggedCount}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-200">
              {submitReviewRows.map((row) => (
                <div
                  key={row.exam.instanceId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span>{row.exam.label}</span>
                  <span className="text-slate-300">
                    {row.answered}/{row.total} answered | {row.unanswered} unanswered | {row.flaggedCount} flagged
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {totalUnansweredCount > 0 ? (
                <Button variant="secondary" onClick={jumpToFirstUnansweredAcrossExams}>
                  Jump to first unanswered
                </Button>
              ) : null}
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

    </section>
  );
}

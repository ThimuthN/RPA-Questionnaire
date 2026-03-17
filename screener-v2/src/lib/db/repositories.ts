import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import type {
  DetailedResultSummary,
  Question,
  ResultReviewItem,
  ResultReviewSection,
  ResultSummary,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { buildResultSummary, scoreQuestion } from "@/lib/assessment-engine/scoring";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { getRoleConfig, questionBank } from "@/lib/data/question-bank";
import { prisma } from "@/lib/db/prisma";
import { buildLogicReasoningQuestion } from "@/features/logic-reasoning/grading";
import type { LogicReasoningSubtask } from "@/features/logic-reasoning/packs";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";
import { buildPracticalQuestion } from "@/features/practical/grading";
import type { PracticalSubtask } from "@/features/practical/packs";
import { pickPracticalPack } from "@/features/practical/packs";
import {
  createSectionState,
  getDefaultSelectedSections,
  normalizeSelectedSections,
  orderedSections,
  sectionRegistry
} from "@/lib/sections/registry";
import type { SectionId, SectionState } from "@/lib/sections/types";
import { hashValue, randomPasscode, randomToken } from "@/lib/tokens/token-service";

interface InviteRecord {
  id: string;
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  slug: string;
  tokenHash: string;
  passcodeHash?: string;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId?: RoleId;
  passTargetPercent: number;
  stacks?: StackId[];
  sections: SectionId[];
  maxAttempts: number;
  usedAttempts: number;
  expiresAt?: string;
  createdAt: string;
}

interface ParticipantRecord {
  id: string;
  kind: "candidate" | "employee";
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface AttemptRecord {
  id: string;
  assessmentVersionId: string;
  inviteId?: string;
  participantId: string;
  roleId: RoleId;
  passTargetPercent: number;
  stacks: StackId[];
  sections: SectionId[];
  sectionState: Partial<Record<SectionId, SectionState>>;
  seed: number;
  stage: SectionId | "submitted";
  status: "in_progress" | "submitted";
  coreQuestionIds: string[];
  coreAnswers: Record<string, unknown>;
  practicalAnswer: Record<string, unknown>;
  logicReasoningAnswer?: Record<string, unknown>;
  practicalEarned: number;
  practicalPossible: number;
  logicReasoningEarned: number;
  logicReasoningPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds?: number;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
  startedAt: string;
  submittedAt?: string;
}

interface PersistedBreakdown {
  sections: SectionId[];
  passPercent: number;
  practicalMinPercent: number;
  sectionBreakdown: ResultSummary["sectionBreakdown"];
  breakdownByCategory: ResultSummary["breakdownByCategory"];
}

function cuidLike() {
  return crypto.randomUUID().replace(/-/g, "");
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toStacks(value: Prisma.JsonValue | null | undefined): StackId[] {
  return Array.isArray(value) ? (value as StackId[]) : [];
}

function toSections(value: Prisma.JsonValue | null | undefined): SectionId[] {
  if (Array.isArray(value)) {
    return normalizeSelectedSections(value as SectionId[]);
  }
  return getDefaultSelectedSections();
}

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function normalizeStage(stage: string, sections: SectionId[], status: string): SectionId | "submitted" {
  if (status === "submitted") return "submitted";
  if (stage && sections.includes(stage as SectionId)) {
    return stage as SectionId;
  }
  return sections[0] ?? "core";
}

function ensureSectionState(args: {
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  stored: Partial<Record<SectionId, SectionState>>;
  legacy: {
    coreAnswers: Record<string, unknown>;
    practicalAnswer: Record<string, unknown>;
    logicAnswer: Record<string, unknown>;
    remainingCoreSeconds: number;
    remainingPracticalSeconds: number;
    remainingLogicReasoningSeconds: number | null;
    practicalEarned: number;
    practicalPossible: number;
    logicReasoningEarned: number;
    logicReasoningPossible: number;
  };
}): Partial<Record<SectionId, SectionState>> {
  const baseline = createSectionState({
    roleId: args.roleId,
    stacks: args.stacks,
    sections: args.sections
  });

  for (const sectionId of args.sections) {
    const existing = args.stored[sectionId];
    const fallback = baseline[sectionId] ?? { answers: {}, remainingSeconds: 0 };

    if (sectionId === "core") {
      baseline.core = {
        answers: { ...args.legacy.coreAnswers, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ?? args.legacy.remainingCoreSeconds ?? fallback.remainingSeconds
      };
      continue;
    }

    if (sectionId === "practical") {
      baseline.practical = {
        answers: { ...args.legacy.practicalAnswer, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ?? args.legacy.remainingPracticalSeconds ?? fallback.remainingSeconds,
        earned:
          typeof existing?.earned === "number"
            ? existing.earned
            : args.legacy.practicalEarned > 0
              ? args.legacy.practicalEarned
              : undefined,
        possible:
          typeof existing?.possible === "number"
            ? existing.possible
            : args.legacy.practicalPossible > 0
              ? args.legacy.practicalPossible
              : undefined
      };
      continue;
    }

    if (sectionId === "applied_logic_reasoning") {
      baseline.applied_logic_reasoning = {
        answers: { ...args.legacy.logicAnswer, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ??
          args.legacy.remainingLogicReasoningSeconds ??
          fallback.remainingSeconds,
        earned:
          typeof existing?.earned === "number"
            ? existing.earned
            : args.legacy.logicReasoningEarned > 0
              ? args.legacy.logicReasoningEarned
              : undefined,
        possible:
          typeof existing?.possible === "number"
            ? existing.possible
            : args.legacy.logicReasoningPossible > 0
              ? args.legacy.logicReasoningPossible
              : undefined
      };
    }
  }

  return baseline;
}

function splitSectionState(sectionState: Partial<Record<SectionId, SectionState>>) {
  return {
    coreAnswers: sectionState.core?.answers ?? {},
    practicalAnswer: sectionState.practical?.answers ?? {},
    logicReasoningAnswer: sectionState.applied_logic_reasoning?.answers ?? {},
    remainingCoreSeconds: sectionState.core?.remainingSeconds ?? 0,
    remainingPracticalSeconds: sectionState.practical?.remainingSeconds ?? 0,
    remainingLogicReasoningSeconds: sectionState.applied_logic_reasoning?.remainingSeconds ?? null,
    practicalEarned: sectionState.practical?.earned ?? 0,
    practicalPossible: sectionState.practical?.possible ?? 0,
    logicReasoningEarned: sectionState.applied_logic_reasoning?.earned ?? 0,
    logicReasoningPossible: sectionState.applied_logic_reasoning?.possible ?? 0
  };
}

function normalizePassTargetPercent(value: number | null | undefined, roleId?: RoleId): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  if (roleId) {
    return Number(getRoleConfig(roleId).pass_percentage ?? 60);
  }
  return 60;
}

function mapInvite(row: {
  id: string;
  assessmentVersionId: string;
  mode: string;
  slug: string;
  tokenHash: string;
  passcodeHash: string | null;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId: string | null;
  passTargetPercent: number | null;
  stacksJson: Prisma.JsonValue | null;
  sectionsJson: Prisma.JsonValue | null;
  maxAttempts: number;
  usedAttempts: number;
  expiresAt: Date | null;
  createdAt: Date;
}): InviteRecord {
  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    mode: row.mode as InviteRecord["mode"],
    slug: row.slug,
    tokenHash: row.tokenHash,
    passcodeHash: row.passcodeHash ?? undefined,
    roleLocked: row.roleLocked,
    stackLocked: row.stackLocked,
    roleId: (row.roleId as RoleId | null) ?? undefined,
    passTargetPercent: normalizePassTargetPercent(row.passTargetPercent, (row.roleId as RoleId | null) ?? undefined),
    stacks: toStacks(row.stacksJson),
    sections: toSections(row.sectionsJson),
    maxAttempts: row.maxAttempts,
    usedAttempts: row.usedAttempts,
    expiresAt: row.expiresAt?.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function mapParticipant(row: {
  id: string;
  kind: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}): ParticipantRecord {
  return {
    id: row.id,
    kind: row.kind as ParticipantRecord["kind"],
    fullName: row.fullName,
    email: row.email,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapAttempt(row: {
  id: string;
  assessmentVersionId: string;
  inviteId: string | null;
  participantId: string;
  roleId: string;
  passTargetPercent: number | null;
  stacksJson: Prisma.JsonValue;
  sectionsJson: Prisma.JsonValue | null;
  sectionStateJson: Prisma.JsonValue | null;
  seed: number;
  stage: string;
  status: string;
  coreQuestionIdsJson: Prisma.JsonValue;
  coreAnswersJson: Prisma.JsonValue;
  practicalAnswerJson: Prisma.JsonValue;
  practicalEarned: number;
  practicalPossible: number;
  logicReasoningAnswerJson: Prisma.JsonValue | null;
  logicReasoningEarned: number;
  logicReasoningPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds: number | null;
  integrityJson: Prisma.JsonValue;
  startedAt: Date;
  submittedAt: Date | null;
}): AttemptRecord {
  const roleId = row.roleId as RoleId;
  const stacks = toStacks(row.stacksJson);
  const sections = toSections(row.sectionsJson);
  const storedSectionState = toObject<Partial<Record<SectionId, SectionState>>>(row.sectionStateJson, {});
  const sectionState = ensureSectionState({
    roleId,
    stacks,
    sections,
    stored: storedSectionState,
    legacy: {
      coreAnswers: toObject<Record<string, unknown>>(row.coreAnswersJson, {}),
      practicalAnswer: toObject<Record<string, unknown>>(row.practicalAnswerJson, {}),
      logicAnswer: toObject<Record<string, unknown>>(row.logicReasoningAnswerJson, {}),
      remainingCoreSeconds: row.remainingCoreSeconds,
      remainingPracticalSeconds: row.remainingPracticalSeconds,
      remainingLogicReasoningSeconds: row.remainingLogicReasoningSeconds,
      practicalEarned: row.practicalEarned,
      practicalPossible: row.practicalPossible,
      logicReasoningEarned: row.logicReasoningEarned,
      logicReasoningPossible: row.logicReasoningPossible
    }
  });

  const split = splitSectionState(sectionState);

  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    inviteId: row.inviteId ?? undefined,
    participantId: row.participantId,
    roleId,
    passTargetPercent: normalizePassTargetPercent(row.passTargetPercent, roleId),
    stacks,
    sections,
    sectionState,
    seed: row.seed,
    stage: normalizeStage(row.stage, sections, row.status),
    status: row.status as AttemptRecord["status"],
    coreQuestionIds: toStringArray(row.coreQuestionIdsJson),
    coreAnswers: split.coreAnswers,
    practicalAnswer: split.practicalAnswer,
    logicReasoningAnswer: split.logicReasoningAnswer,
    practicalEarned: split.practicalEarned,
    practicalPossible: split.practicalPossible,
    logicReasoningEarned: split.logicReasoningEarned,
    logicReasoningPossible: split.logicReasoningPossible,
    remainingCoreSeconds: split.remainingCoreSeconds,
    remainingPracticalSeconds: split.remainingPracticalSeconds,
    remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds ?? undefined,
    integrity: toObject<AttemptRecord["integrity"]>(row.integrityJson, {
      tabHiddenCount: 0,
      copyCount: 0,
      pasteCount: 0
    }),
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString()
  };
}

function normalizeBreakdown(
  raw: ResultSummary["sectionBreakdown"] | Record<string, any>,
  passPercent: number
): ResultSummary["sectionBreakdown"] {
  const normalized: ResultSummary["sectionBreakdown"] = {};
  for (const section of orderedSections) {
    const row = (raw as Record<string, any>)[section.id];
    if (!row) continue;
    const percent = Number(row.percent ?? 0);
    const requiredPercent = Number(row.requiredPercent ?? Math.max(passPercent, section.minPercentRequired ?? 0));
    normalized[section.id] = {
      label: typeof row.label === "string" ? row.label : section.label,
      pointsEarned: Number(row.pointsEarned ?? 0),
      pointsPossible: Number(row.pointsPossible ?? 0),
      percent,
      requiredPercent,
      pass: typeof row.pass === "boolean" ? row.pass : percent >= requiredPercent
    };
  }
  return normalized;
}

function parseBreakdown(
  value: Prisma.JsonValue | null | undefined,
  attempt: AttemptRecord | null
): PersistedBreakdown {
  const fallbackSections = attempt?.sections ?? getDefaultSelectedSections();
  const parsed = toObject<Record<string, unknown>>(value, {});
  const passPercent = Number(parsed.passPercent ?? 0);
  const rawSections = Array.isArray(parsed.sections) ? (parsed.sections as SectionId[]) : fallbackSections;
  const sections = normalizeSelectedSections(rawSections);
  const rawSectionBreakdown = toObject<Record<string, unknown>>(parsed.sectionBreakdown as Prisma.JsonValue, {});

  return {
    sections,
    passPercent,
    practicalMinPercent: Number(parsed.practicalMinPercent ?? 0),
    sectionBreakdown: normalizeBreakdown(rawSectionBreakdown, passPercent),
    breakdownByCategory: toObject<ResultSummary["breakdownByCategory"]>(
      parsed.breakdownByCategory as Prisma.JsonValue,
      {}
    )
  };
}

function toResultSummary(
  resultRow: {
    attemptId: string;
    corePercent: number;
    practicalPercent: number;
    finalPercent: number;
    pass: boolean;
    borderline: boolean;
    breakdownJson: Prisma.JsonValue;
  },
  attempt: AttemptRecord | null,
  participant?: ParticipantRecord | null
): ResultSummary | null {
  if (!attempt) return null;
  const breakdown = parseBreakdown(resultRow.breakdownJson, attempt);
  const corePercent = breakdown.sectionBreakdown.core?.percent ?? resultRow.corePercent;
  const practicalPercent = breakdown.sectionBreakdown.practical?.percent ?? resultRow.practicalPercent;

  return {
    attemptId: resultRow.attemptId,
    candidateName: participant?.fullName,
    candidateEmail: participant?.email,
    roleId: attempt.roleId,
    stacks: attempt.stacks,
    sections: breakdown.sections,
    corePercent,
    practicalPercent,
    finalPercent: resultRow.finalPercent,
    passPercent: breakdown.passPercent,
    practicalMinPercent: breakdown.practicalMinPercent,
    pass: resultRow.pass,
    borderline: resultRow.borderline,
    sectionBreakdown: breakdown.sectionBreakdown,
    breakdownByCategory: breakdown.breakdownByCategory
  };
}

const reviewFormatLabels: Record<string, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  ordering: "Ordering",
  matching: "Matching",
  fill_blank_constrained: "Fill in the blank",
  log_analysis_single_select: "Log analysis",
  trace_execution: "Trace execution",
  best_next_step: "Best next step",
  case_triage: "Case triage"
};

function splitPrompt(prompt: string) {
  const normalized = String(prompt || "").replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0] || "Question";
  const body = normalized.startsWith(title) ? normalized.slice(title.length).trim() : normalized;
  return {
    title,
    prompt: body || undefined
  };
}

function tokenToIndex(token: string | number, options: string[]): number {
  if (Number.isInteger(token)) return Number(token);
  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;
  return options.findIndex((option) => option === value);
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
}

function toReviewStatus(pointsEarned: number, pointsPossible: number, answered: boolean): ResultReviewItem["status"] {
  if (!answered) return "unanswered";
  if (pointsPossible > 0 && pointsEarned >= pointsPossible) return "correct";
  if (pointsEarned > 0) return "partial";
  return "incorrect";
}

function indexedOptionLabel(options: string[], token: string | number) {
  const index = tokenToIndex(token, options);
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  return String(token);
}

function indexedAnswerLines(options: string[], answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.map((token) => indexedOptionLabel(options, Number(token)));
  }
  if (answer === null || answer === undefined || String(answer).trim() === "") {
    return [];
  }
  return [indexedOptionLabel(options, Number(answer))];
}

function indexedExpectedLines(options: string[], expected: Array<string | number>) {
  return expected.map((token) => indexedOptionLabel(options, token));
}

function orderedItemLines(items: string[], order: unknown) {
  if (!Array.isArray(order)) return [];
  return order
    .map((token) => {
      const index = Number(token);
      return Number.isInteger(index) && index >= 0 && index < items.length ? items[index] : String(token);
    })
    .filter(Boolean);
}

function pairLines(
  leftItems: string[],
  mapping: Record<string, string>,
  resolve: (value: string) => string
) {
  return leftItems.map((left) => `${left} -> ${mapping[left] ? resolve(mapping[left]) : "No selection"}`);
}

function coreCandidateAnswerLines(question: Question, answer: unknown) {
  switch (question.format) {
    case "single_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage":
      return indexedAnswerLines(question.options ?? [], answer);
    case "multi_select":
      return indexedAnswerLines(question.options ?? [], answer);
    case "ordering":
      return orderedItemLines(question.items ?? [], answer);
    case "matching":
      return pairLines(
        question.leftItems ?? [],
        answer && typeof answer === "object" ? (answer as Record<string, string>) : {},
        (value) => value
      );
    case "fill_blank_constrained": {
      const value = Array.isArray(answer) ? String(answer[0] ?? "") : String(answer ?? "");
      return value.trim() ? [value] : [];
    }
    default:
      return [];
  }
}

function coreExpectedAnswerLines(question: Question) {
  switch (question.format) {
    case "single_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage":
    case "multi_select":
      return indexedExpectedLines(question.options ?? [], question.correctAnswer ?? []);
    case "ordering":
      return orderedItemLines(question.items ?? [], question.correctOrder ?? []);
    case "matching":
      return pairLines(question.leftItems ?? [], question.correctPairs ?? {}, (value) => value);
    case "fill_blank_constrained":
      return (question.acceptedAnswers ?? []).map(String);
    default:
      return [];
  }
}

function optionLabelById(
  options: Array<{ id: string; label: string }>,
  value: string
) {
  return options.find((option) => option.id === value)?.label ?? value;
}

function practicalItem(task: PracticalSubtask, answer: unknown): ResultReviewItem {
  const pointsPossible = Number(task.points || 0);
  const answered = hasValue(answer);

  if (task.type === "single_select") {
    const selected = typeof answer === "string" ? answer : "";
    const correct = selected === task.expected;
    return {
      id: task.id,
      title: task.label,
      formatLabel: "Practical single select",
      pointsEarned: correct ? pointsPossible : 0,
      pointsPossible,
      status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
      candidateAnswerLines: selected ? [optionLabelById(task.options, selected)] : [],
      expectedAnswerLines: [optionLabelById(task.options, task.expected)]
    };
  }

  const mapping = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};
  const correct = task.leftItems.every((left) => String(mapping[left] ?? "") === String(task.expected[left] ?? ""));
  return {
    id: task.id,
    title: task.label,
    formatLabel: "Practical matching",
    pointsEarned: correct ? pointsPossible : 0,
    pointsPossible,
    status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(task.leftItems, task.expected, (value) => optionLabelById(task.rightOptions, value))
  };
}

function logicItem(task: LogicReasoningSubtask, answer: unknown): ResultReviewItem {
  const pointsPossible = Number(task.points || 0);
  const answered = hasValue(answer);

  if (task.type === "single_select") {
    const selected = typeof answer === "string" ? answer : "";
    const correct = selected === task.expected;
    return {
      id: task.id,
      title: task.label,
      promptBlocks: task.promptBlocks,
      formatLabel: "Logic single select",
      pointsEarned: correct ? pointsPossible : 0,
      pointsPossible,
      status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
      candidateAnswerLines: selected ? [optionLabelById(task.options, selected)] : [],
      expectedAnswerLines: [optionLabelById(task.options, task.expected)]
    };
  }

  const mapping = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};
  const expectedCount = Object.keys(task.expected).length || 1;
  const correctCount = Object.entries(task.expected).filter(([left, right]) => mapping[left] === right).length;
  const pointsEarned = Math.round(correctCount * (pointsPossible / expectedCount));

  return {
    id: task.id,
    title: task.label,
    promptBlocks: task.promptBlocks,
    formatLabel: "Logic matching",
    pointsEarned,
    pointsPossible,
    status: toReviewStatus(pointsEarned, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(task.leftItems, task.expected, (value) => optionLabelById(task.rightOptions, value))
  };
}

function buildReviewSections(attempt: AttemptRecord): ResultReviewSection[] {
  const questionsById = new Map(questionBank.map((question) => [question.id, question]));
  const sections: ResultReviewSection[] = [];

  for (const sectionId of attempt.sections) {
    if (sectionId === "core") {
      const items = attempt.coreQuestionIds
        .map((questionId) => questionsById.get(questionId))
        .filter((question): question is Question => Boolean(question))
        .map((question) => {
          const answer = attempt.sectionState.core?.answers?.[question.id];
          const score = scoreQuestion(question, answer);
          const prompt = splitPrompt(question.prompt);

          return {
            id: question.id,
            title: prompt.title,
            prompt: prompt.prompt,
            promptBlocks: question.promptBlocks,
            logSnippet: "logSnippet" in question ? question.logSnippet : undefined,
            category: question.category,
            formatLabel: reviewFormatLabels[question.format] ?? question.format,
            pointsEarned: score.pointsEarned,
            pointsPossible: score.pointsPossible,
            status: toReviewStatus(score.pointsEarned, score.pointsPossible, hasValue(answer)),
            candidateAnswerLines: coreCandidateAnswerLines(question, answer),
            expectedAnswerLines: coreExpectedAnswerLines(question),
            explanation: question.explanation || undefined
          } satisfies ResultReviewItem;
        });

      sections.push({
        id: sectionId,
        label: sectionRegistry[sectionId].label,
        items
      });
      continue;
    }

    if (sectionId === "practical") {
      const practicalPack = pickPracticalPack(attempt.roleId, attempt.stacks);
      const practicalQuestion = buildPracticalQuestion(practicalPack);
      const answers = attempt.sectionState.practical?.answers ?? {};

      sections.push({
        id: sectionId,
        label: sectionRegistry[sectionId].label,
        description: practicalQuestion.prompt,
        items: practicalQuestion.subtasks.map((task) => practicalItem(task, answers[task.id]))
      });
      continue;
    }

    if (sectionId === "applied_logic_reasoning") {
      const logicPack = pickLogicReasoningPack(attempt.roleId, attempt.stacks);
      const logicQuestion = buildLogicReasoningQuestion(logicPack);
      const answers = attempt.sectionState.applied_logic_reasoning?.answers ?? {};

      sections.push({
        id: sectionId,
        label: sectionRegistry[sectionId].label,
        description: logicQuestion.prompt,
        items: logicQuestion.subtasks.map((task) => logicItem(task, answers[task.id]))
      });
    }
  }

  return sections;
}

export async function createInvite(input: {
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  roleLocked?: boolean;
  stackLocked?: boolean;
  roleId?: RoleId;
  passTargetPercent?: number;
  stacks?: StackId[];
  sections?: SectionId[];
  maxAttempts?: number;
  expiresAt?: string;
  withPasscode?: boolean;
}) {
  const token = randomToken(24);
  const passcode = input.withPasscode ? randomPasscode() : undefined;
  const selectedSections = normalizeSelectedSections(input.sections);
  const passTargetPercent = normalizePassTargetPercent(input.passTargetPercent, input.roleId);

  const row = await prisma.invite.create({
    data: {
      id: cuidLike(),
      assessmentVersionId: input.assessmentVersionId,
      mode: input.mode,
      slug: randomToken(6).toLowerCase(),
      tokenHash: hashValue(token),
      passcodeHash: passcode ? hashValue(passcode) : null,
      roleLocked: input.roleLocked ?? true,
      stackLocked: input.stackLocked ?? true,
      roleId: input.roleId ?? null,
      passTargetPercent,
      stacksJson: input.stacks?.length ? toJsonValue(input.stacks) : Prisma.JsonNull,
      sectionsJson: toJsonValue(selectedSections),
      maxAttempts: input.maxAttempts ?? 1,
      usedAttempts: 0,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdAt: new Date()
    }
  });
  return { row: mapInvite(row), token, passcode };
}

export async function validateInvite(input: {
  token?: string;
  slug?: string;
  passcode?: string;
  roleId?: RoleId;
}): Promise<{ ok: boolean; message?: string; invite?: InviteRecord; remainingAttempts?: number }> {
  const token = input.token?.trim();
  const slug = input.slug?.trim().toLowerCase();
  const row = token
    ? await prisma.invite.findUnique({ where: { tokenHash: hashValue(token) } })
    : slug
      ? await prisma.invite.findUnique({ where: { slug } })
      : null;

  if (!row) return { ok: false, message: "Invite not found." };

  const invite = mapInvite(row);
  if (invite.expiresAt && Date.parse(invite.expiresAt) < Date.now()) {
    return { ok: false, message: "Invite expired." };
  }
  if (invite.usedAttempts >= invite.maxAttempts) {
    return { ok: false, message: "Attempt limit reached." };
  }
  if (invite.passcodeHash && hashValue(String(input.passcode || "")) !== invite.passcodeHash) {
    return { ok: false, message: "Passcode invalid." };
  }
  if (invite.roleLocked && invite.roleId && input.roleId && input.roleId !== invite.roleId) {
    return { ok: false, message: "Invite is locked to a different role." };
  }

  return {
    ok: true,
    invite,
    remainingAttempts: Math.max(0, invite.maxAttempts - invite.usedAttempts)
  };
}

export async function createOrGetParticipant(input: {
  kind: "candidate" | "employee";
  fullName: string;
  email: string;
  phone?: string;
}): Promise<ParticipantRecord> {
  const normalizedEmail = input.email.toLowerCase();
  const existing = await prisma.participant.findUnique({
    where: {
      kind_email: {
        kind: input.kind,
        email: normalizedEmail
      }
    }
  });
  if (existing) return mapParticipant(existing);

  const created = await prisma.participant.create({
    data: {
      id: cuidLike(),
      kind: input.kind,
      fullName: input.fullName,
      email: normalizedEmail,
      phone: input.phone ?? null,
      createdAt: new Date()
    }
  });
  return mapParticipant(created);
}

export async function startAttempt(input: {
  inviteId?: string;
  assessmentVersionId?: string;
  participantId: string;
  roleId: RoleId;
  passTargetPercent?: number;
  stacks: StackId[];
  sections?: SectionId[];
}) {
  const selectedSections = normalizeSelectedSections(input.sections);
  const passTargetPercent = normalizePassTargetPercent(input.passTargetPercent, input.roleId);
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(input.roleId, input.stacks, selectionSeed, questionBank);
  const sectionState = createSectionState({
    roleId: input.roleId,
    stacks: input.stacks,
    sections: selectedSections
  });
  const split = splitSectionState(sectionState);
  const attemptId = cuidLike();
  const startedAt = new Date();

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.attempt.create({
      data: {
        id: attemptId,
        assessmentVersionId: input.assessmentVersionId ?? "v1-default",
        inviteId: input.inviteId ?? null,
        participantId: input.participantId,
        roleId: input.roleId,
        passTargetPercent,
        stacksJson: toJsonValue(input.stacks),
        sectionsJson: toJsonValue(selectedSections),
        sectionStateJson: toJsonValue(sectionState),
        seed: selection.seed,
        stage: selectedSections[0] ?? "core",
        status: "in_progress",
        coreQuestionIdsJson: toJsonValue(selectedSections.includes("core") ? selection.selectedIds : []),
        coreAnswersJson: toJsonValue(split.coreAnswers),
        practicalAnswerJson: toJsonValue(split.practicalAnswer),
        practicalEarned: 0,
        practicalPossible: 0,
        logicReasoningAnswerJson: selectedSections.includes("applied_logic_reasoning")
          ? toJsonValue(split.logicReasoningAnswer)
          : Prisma.JsonNull,
        logicReasoningEarned: 0,
        logicReasoningPossible: 0,
        remainingCoreSeconds: split.remainingCoreSeconds,
        remainingPracticalSeconds: split.remainingPracticalSeconds,
        remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
        integrityJson: toJsonValue({ tabHiddenCount: 0, copyCount: 0, pasteCount: 0 }),
        startedAt
      }
    });

    if (input.inviteId) {
      await tx.invite.update({
        where: { id: input.inviteId },
        data: { usedAttempts: { increment: 1 } }
      });
    }

    return created;
  });

  return { attempt: mapAttempt(attempt), selection };
}

export async function patchAttempt(
  attemptId: string,
  patch: Partial<
    Pick<AttemptRecord, "stage"> & {
      integrity: Partial<AttemptRecord["integrity"]>;
      sectionState: Partial<Record<SectionId, SectionState>>;
    }
  >
) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") return null;

  const mergedSectionState: Partial<Record<SectionId, SectionState>> = {
    ...current.sectionState
  };

  if (patch.sectionState) {
    for (const sectionId of current.sections) {
      const incoming = patch.sectionState[sectionId];
      if (!incoming) continue;
      const existing = mergedSectionState[sectionId] ?? { answers: {}, remainingSeconds: 0 };
      mergedSectionState[sectionId] = {
        answers: { ...(existing.answers ?? {}), ...(incoming.answers ?? {}) },
        remainingSeconds:
          typeof incoming.remainingSeconds === "number"
            ? incoming.remainingSeconds
            : existing.remainingSeconds,
        earned: typeof incoming.earned === "number" ? incoming.earned : existing.earned,
        possible: typeof incoming.possible === "number" ? incoming.possible : existing.possible
      };
    }
  }

  const split = splitSectionState(mergedSectionState);
  const nextStage =
    patch.stage && (patch.stage === "submitted" || current.sections.includes(patch.stage))
      ? patch.stage
      : current.stage;

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      stage: nextStage,
      sectionStateJson: toJsonValue(mergedSectionState),
      coreAnswersJson: toJsonValue(split.coreAnswers),
      practicalAnswerJson: toJsonValue(split.practicalAnswer),
      logicReasoningAnswerJson: current.sections.includes("applied_logic_reasoning")
        ? toJsonValue(split.logicReasoningAnswer)
        : Prisma.JsonNull,
      remainingCoreSeconds: split.remainingCoreSeconds,
      remainingPracticalSeconds: split.remainingPracticalSeconds,
      remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
      integrityJson: patch.integrity
        ? toJsonValue({
            tabHiddenCount: Number(patch.integrity.tabHiddenCount ?? current.integrity.tabHiddenCount),
            copyCount: Number(patch.integrity.copyCount ?? current.integrity.copyCount),
            pasteCount: Number(patch.integrity.pasteCount ?? current.integrity.pasteCount)
          })
        : toJsonValue(current.integrity)
    }
  });

  return mapAttempt(updated);
}

export async function submitAttempt(input: { attemptId: string }) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") return null;

  const result = buildResultSummary({
    attemptId: current.id,
    roleId: current.roleId,
    stacks: current.stacks,
    passTargetPercent: current.passTargetPercent,
    sections: current.sections,
    coreQuestionIds: current.coreQuestionIds,
    sectionState: current.sectionState
  });

  const submittedSectionState: Partial<Record<SectionId, SectionState>> = {
    ...current.sectionState
  };

  for (const sectionId of result.sections) {
    const sectionResult = result.sectionBreakdown[sectionId];
    if (!sectionResult) continue;
    const existing = submittedSectionState[sectionId] ?? { answers: {}, remainingSeconds: 0 };
    submittedSectionState[sectionId] = {
      ...existing,
      earned: sectionResult.pointsEarned,
      possible: sectionResult.pointsPossible
    };
  }

  const split = splitSectionState(submittedSectionState);

  await prisma.$transaction(async (tx) => {
    await tx.attempt.update({
      where: { id: input.attemptId },
      data: {
        status: "submitted",
        stage: "submitted",
        sectionStateJson: toJsonValue(submittedSectionState),
        practicalEarned: split.practicalEarned,
        practicalPossible: split.practicalPossible,
        logicReasoningEarned: split.logicReasoningEarned,
        logicReasoningPossible: split.logicReasoningPossible,
        submittedAt: new Date()
      }
    });

    await tx.result.upsert({
      where: { attemptId: input.attemptId },
      update: {
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          sections: result.sections,
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      },
      create: {
        id: cuidLike(),
        attemptId: input.attemptId,
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          sections: result.sections,
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      }
    });
  });

  return result;
}

export async function listResults() {
  const resultRows = await prisma.result.findMany({
    orderBy: { createdAt: "desc" }
  });
  const attemptIds = resultRows.map((row) => row.attemptId);
  if (attemptIds.length === 0) return [];

  const attemptRows = await prisma.attempt.findMany({
    where: { id: { in: attemptIds } }
  });
  const attemptsById = new Map(attemptRows.map((row) => [row.id, mapAttempt(row)]));
  const participantIds = [...new Set(attemptRows.map((row) => row.participantId))];
  const participantRows =
    participantIds.length > 0
      ? await prisma.participant.findMany({
          where: { id: { in: participantIds } }
        })
      : [];
  const participantsById = new Map(participantRows.map((row) => [row.id, mapParticipant(row)]));

  return resultRows
    .map((row) => {
      const attempt = attemptsById.get(row.attemptId) ?? null;
      const participant = attempt ? participantsById.get(attempt.participantId) ?? null : null;
      return {
        summary: toResultSummary(row, attempt, participant),
        submittedAt: attempt?.submittedAt ?? attempt?.startedAt ?? ""
      };
    })
    .filter((row): row is { summary: ResultSummary; submittedAt: string } => Boolean(row.summary))
    .sort((a, b) => Date.parse(b.submittedAt || "1970-01-01T00:00:00.000Z") - Date.parse(a.submittedAt || "1970-01-01T00:00:00.000Z"))
    .map((row) => row.summary);
}

export async function getResult(attemptId: string) {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });
  const participantRow = attemptRow
    ? await prisma.participant.findUnique({
        where: { id: attemptRow.participantId }
      })
    : null;

  return toResultSummary(
    resultRow,
    attemptRow ? mapAttempt(attemptRow) : null,
    participantRow ? mapParticipant(participantRow) : null
  );
}

export async function getDetailedResult(attemptId: string): Promise<DetailedResultSummary | null> {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });
  if (!attemptRow) return null;

  const participantRow = await prisma.participant.findUnique({
    where: { id: attemptRow.participantId }
  });
  const attempt = mapAttempt(attemptRow);
  const summary = toResultSummary(resultRow, attempt, participantRow ? mapParticipant(participantRow) : null);

  if (!summary) return null;

  return {
    summary,
    reviewSections: buildReviewSections(attempt)
  };
}

export async function getAttempt(attemptId: string) {
  const row = await prisma.attempt.findUnique({ where: { id: attemptId } });
  return row ? mapAttempt(row) : null;
}

import { Prisma } from "@prisma/client";
import type {
  AssessmentContextType,
  ExamBlueprint,
  ExamState,
  Question,
  ResultReviewItem,
  ResultReviewState,
  ResultReviewSection,
  ResultSummary,
  StackId
} from "@/lib/assessment-engine/types";
import { scoreQuestion } from "@/lib/assessment-engine/scoring";
import { summarizeExamInstance } from "@/lib/exams/catalog";
import type { LogicReasoningSubtask } from "@/features/logic-reasoning/packs";
import type { PracticalSubtask } from "@/features/practical/packs";
import { getDefaultSelectedSections, normalizeSelectedSections, orderedSections } from "@/lib/sections/registry";
import type { SectionId } from "@/lib/sections/types";

interface ResultProjectionAttempt {
  roleId?: string | null;
  stacks: StackId[];
  sections: SectionId[];
  blueprint: ExamBlueprint;
  examState: Partial<Record<string, ExamState>>;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
}

interface ResultProjectionParticipant {
  fullName: string;
  email: string;
}

interface ResultProjectionCandidate {
  roleId?: string | null;
  positionAppliedFor?: string | null;
  role?: { label: string | null } | null;
}

interface PersistedBreakdown {
  sections: SectionId[];
  exams: ResultSummary["exams"];
  passPercent: number;
  practicalMinPercent: number;
  sectionBreakdown: ResultSummary["sectionBreakdown"];
  examBreakdown: ResultSummary["examBreakdown"];
  breakdownByCategory: ResultSummary["breakdownByCategory"];
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function toObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function normalizeBreakdown(
  raw: ResultSummary["sectionBreakdown"] | Record<string, unknown>,
  passPercent: number
): ResultSummary["sectionBreakdown"] {
  const normalized: ResultSummary["sectionBreakdown"] = {};

  for (const section of orderedSections) {
    const rowValue = (raw as Record<string, unknown>)[section.id];
    if (!rowValue || typeof rowValue !== "object" || Array.isArray(rowValue)) continue;

    const row = rowValue as Record<string, unknown>;
    const percent = Number(row.percent ?? 0);
    const requiredPercent = Number(
      row.requiredPercent ?? Math.max(passPercent, section.minPercentRequired ?? 0)
    );

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
  attempt: ResultProjectionAttempt | null
): PersistedBreakdown {
  const fallbackSections = attempt?.sections ?? getDefaultSelectedSections();
  const fallbackExams = attempt?.blueprint.exams.map(summarizeExamInstance) ?? [];
  const parsed = toObject<Record<string, unknown>>(value, {});
  const passPercent = Number(parsed.passPercent ?? 0);
  const rawSections = Array.isArray(parsed.sections) ? (parsed.sections as SectionId[]) : fallbackSections;
  const sections = normalizeSelectedSections(rawSections);
  const rawSectionBreakdown = toObject<Record<string, unknown>>(
    parsed.sectionBreakdown as Prisma.JsonValue,
    {}
  );
  const exams = Array.isArray(parsed.exams) ? (parsed.exams as ResultSummary["exams"]) : fallbackExams;
  const examBreakdown = toObject<ResultSummary["examBreakdown"]>(
    parsed.examBreakdown as Prisma.JsonValue,
    {}
  );

  return {
    sections,
    exams,
    passPercent,
    practicalMinPercent: Number(parsed.practicalMinPercent ?? 0),
    sectionBreakdown: normalizeBreakdown(rawSectionBreakdown, passPercent),
    examBreakdown,
    breakdownByCategory: toObject<ResultSummary["breakdownByCategory"]>(
      parsed.breakdownByCategory as Prisma.JsonValue,
      {}
    )
  };
}

export function toResultSummary(
  resultRow: {
    attemptId: string;
    contextType?: string;
    reviewState?: string;
    corePercent: number;
    practicalPercent: number;
    finalPercent: number;
    pass: boolean;
    borderline: boolean;
    breakdownJson: Prisma.JsonValue;
  },
  attempt: ResultProjectionAttempt | null,
  participant?: ResultProjectionParticipant | null,
  candidate?: ResultProjectionCandidate | null
): ResultSummary | null {
  if (!attempt) return null;

  const breakdown = parseBreakdown(resultRow.breakdownJson, attempt);
  const corePercent = breakdown.sectionBreakdown.core?.percent ?? resultRow.corePercent;
  const practicalPercent = breakdown.sectionBreakdown.practical?.percent ?? resultRow.practicalPercent;
  const exams =
    breakdown.exams.length > 0 ? breakdown.exams : attempt.blueprint.exams.map(summarizeExamInstance);
  const coreExam = attempt.blueprint.exams.find((exam) => exam.definitionId === "core_exam");
  const coreExamRoleId =
    typeof coreExam?.config?.roleId === "string" && coreExam.config.roleId.trim().length > 0
      ? coreExam.config.roleId.trim()
      : undefined;
  const coreExamRoleLabel =
    typeof coreExam?.config?.roleLabel === "string" && coreExam.config.roleLabel.trim().length > 0
      ? coreExam.config.roleLabel.trim()
      : undefined;
  const examBreakdown =
    Object.keys(breakdown.examBreakdown).length > 0
      ? Object.fromEntries(
          exams.map((exam) => {
            const persisted = breakdown.examBreakdown[exam.instanceId];
            const weightedMarksPossible = Number(persisted?.weightedMarksPossible ?? exam.weight);
            const fallbackPercent =
              typeof persisted?.percent === "number"
                ? persisted.percent
                : Number(persisted?.pointsPossible ?? 0) > 0
                  ? (Number(persisted?.pointsEarned ?? 0) / Number(persisted?.pointsPossible ?? 0)) * 100
                  : undefined;
            const weightedMarksEarned =
              typeof persisted?.weightedMarksEarned === "number"
                ? persisted.weightedMarksEarned
                : typeof fallbackPercent === "number"
                  ? roundOne((fallbackPercent * weightedMarksPossible) / 100)
                  : Number(breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0);

            return [
              exam.instanceId,
              {
                instanceId: exam.instanceId,
                definitionId: exam.definitionId,
                legacySectionId: exam.legacySectionId,
                label: persisted?.label ?? exam.label,
                configSummary: persisted?.configSummary ?? exam.configSummary,
                durationMinutes: Number(persisted?.durationMinutes ?? exam.durationMinutes),
                pointsEarned: Number(persisted?.pointsEarned ?? 0),
                pointsPossible: Number(persisted?.pointsPossible ?? 0),
                percent: Number(persisted?.percent ?? 0),
                weightedMarksEarned,
                weightedMarksPossible,
                requiredPercent: Number(
                  persisted?.requiredPercent ??
                    breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.requiredPercent ??
                    exam.requiredPercent
                ),
                pass:
                  typeof persisted?.pass === "boolean"
                    ? persisted.pass
                    : (persisted?.percent ?? 0) >= exam.requiredPercent,
                order: Number(persisted?.order ?? exam.order)
              }
            ];
          })
        )
      : Object.fromEntries(
          exams.map((exam) => [
            exam.instanceId,
            {
              instanceId: exam.instanceId,
              definitionId: exam.definitionId,
              legacySectionId: exam.legacySectionId,
              label: exam.label,
              configSummary: exam.configSummary,
              durationMinutes: exam.durationMinutes,
              pointsEarned: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0,
              pointsPossible:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsPossible ?? 0,
              percent: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.percent ?? 0,
              weightedMarksEarned:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0,
              weightedMarksPossible: exam.weight,
              requiredPercent:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.requiredPercent ??
                exam.requiredPercent,
              pass: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pass ?? false,
              order: exam.order
            }
          ])
        );

    return {
      attemptId: resultRow.attemptId,
      candidateName: participant?.fullName,
      candidateEmail: participant?.email,
      candidateRoleId: candidate?.roleId ?? undefined,
      candidateRoleLabel: candidate?.role?.label ?? candidate?.positionAppliedFor ?? undefined,
      contextType: (resultRow.contextType as AssessmentContextType | undefined) ?? "general",
      reviewState: (resultRow.reviewState as ResultReviewState | undefined) ?? "unreviewed",
      roleId: attempt.roleId ?? undefined,
      coreExamRoleId,
      coreExamRoleLabel,
      stacks: attempt.stacks,
    sections: breakdown.sections,
    exams,
    corePercent,
    practicalPercent,
    finalPercent: resultRow.finalPercent,
    passPercent: breakdown.passPercent,
    practicalMinPercent: breakdown.practicalMinPercent,
    pass: resultRow.pass,
    borderline: resultRow.borderline,
    integrity: attempt.integrity,
    sectionBreakdown: breakdown.sectionBreakdown,
    examBreakdown,
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

function toReviewStatus(
  pointsEarned: number,
  pointsPossible: number,
  answered: boolean
): ResultReviewItem["status"] {
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

function optionLabelById(options: Array<{ id: string; label: string }>, value: string) {
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
  const correct = task.leftItems.every(
    (left) => String(mapping[left] ?? "") === String(task.expected[left] ?? "")
  );

  return {
    id: task.id,
    title: task.label,
    formatLabel: "Practical matching",
    pointsEarned: correct ? pointsPossible : 0,
    pointsPossible,
    status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(
      task.leftItems,
      task.expected,
      (value) => optionLabelById(task.rightOptions, value)
    )
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
  const pointsEarned = Math.round(correctCount * (pointsPossible / expectedCount) * 100) / 100;

  return {
    id: task.id,
    title: task.label,
    promptBlocks: task.promptBlocks,
    formatLabel: "Logic matching",
    pointsEarned,
    pointsPossible,
    status: toReviewStatus(pointsEarned, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(
      task.leftItems,
      task.expected,
      (value) => optionLabelById(task.rightOptions, value)
    )
  };
}

export function buildReviewSections(attempt: ResultProjectionAttempt): ResultReviewSection[] {
  const sections: ResultReviewSection[] = [];

  for (const exam of [...attempt.blueprint.exams].sort((a, b) => a.order - b.order)) {
    const state = attempt.examState[exam.instanceId] ?? {
      answers: {},
      remainingSeconds: exam.durationMinutes * 60
    };

    const standardItems = exam.contentSnapshot.items.filter(
      (question): question is Question =>
        question.format !== "practical_task" && question.format !== "logic_reasoning"
    );

    if (standardItems.length === exam.contentSnapshot.items.length) {
      const items = standardItems.map((question) => {
        const answer = state.answers?.[question.id];
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
        id: exam.instanceId,
        label: exam.label,
        configSummary: exam.configSummary,
        items
      });
      continue;
    }

    const composite = exam.contentSnapshot.items[0];
    if (!composite) continue;

    if (composite.format === "practical_task") {
      const compositeAnswer =
        state.answers?.[composite.id] && typeof state.answers?.[composite.id] === "object"
          ? (state.answers[composite.id] as Record<string, unknown>)
          : {};

      sections.push({
        id: exam.instanceId,
        label: exam.label,
        description: composite.prompt,
        configSummary: exam.configSummary,
        items: composite.subtasks.map((task) => practicalItem(task as PracticalSubtask, compositeAnswer[task.id]))
      });
      continue;
    }

    if (composite.format === "logic_reasoning") {
      const compositeAnswer =
        state.answers?.[composite.id] && typeof state.answers?.[composite.id] === "object"
          ? (state.answers[composite.id] as Record<string, unknown>)
          : {};

      sections.push({
        id: exam.instanceId,
        label: exam.label,
        description: composite.prompt,
        configSummary: exam.configSummary,
        items: composite.subtasks.map((task) => logicItem(task as LogicReasoningSubtask, compositeAnswer[task.id]))
      });
    }
  }

  return sections;
}

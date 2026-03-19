import type {
  ExamBlueprint,
  ExamBreakdown,
  ExamQuestion,
  ExamState,
  ResultSummary,
  RoleId,
  ScoreOutput,
  StackId
} from "@/lib/assessment-engine/types";
import { configV2 } from "@/lib/data/question-bank";
import { summarizeExamInstance } from "@/lib/exams/catalog";
import { questionRegistry } from "@/lib/question-types";
import { scoreQuestion } from "@/lib/question-types/scoring";
import { toInt } from "@/lib/assessment-engine/utils";

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizePassTargetPercent(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  return 60;
}

function scoreExamItem(item: ExamQuestion, answer: unknown): ScoreOutput {
  if (
    item.format === "single_select" ||
    item.format === "multi_select" ||
    item.format === "ordering" ||
    item.format === "matching" ||
    item.format === "fill_blank_constrained" ||
    item.format === "log_analysis_single_select" ||
    item.format === "trace_execution" ||
    item.format === "best_next_step" ||
    item.format === "case_triage"
  ) {
    return scoreQuestion(item, answer);
  }

  const def = questionRegistry[item.format];
  const score = def.score(item as never, (answer ?? {}) as never);
  const pointsPossible = Number(item.points || 0);
  return {
    normalized: score.normalized,
    pointsEarned: roundOne(score.pointsEarned),
    pointsPossible,
    isCorrect: score.isCorrect
  };
}

export interface BuildResultInput {
  attemptId: string;
  roleId: RoleId;
  stacks: StackId[];
  passTargetPercent?: number;
  blueprint: ExamBlueprint;
  examState: Partial<Record<string, ExamState>>;
  integrity?: { tabHiddenCount: number; copyCount: number; pasteCount: number };
}

export function buildResultSummary(input: BuildResultInput): ResultSummary {
  const passPercent = normalizePassTargetPercent(input.passTargetPercent);
  const examBreakdown: ExamBreakdown = {};
  const sectionBreakdown: ResultSummary["sectionBreakdown"] = {};
  const byCategory: Record<string, { correctCount: number; totalCount: number; percent: number }> = {};
  let weightedPercentSum = 0;
  let weightSum = 0;

  const orderedExams = [...input.blueprint.exams].sort((a, b) => a.order - b.order);

  for (const exam of orderedExams) {
    const state = input.examState[exam.instanceId] ?? { answers: {}, remainingSeconds: 0 };
    let pointsEarned = 0;
    let pointsPossible = 0;

    for (const item of exam.contentSnapshot.items) {
      const answer = state.answers?.[item.id];
      const score = scoreExamItem(item, answer);
      pointsEarned += score.pointsEarned;
      pointsPossible += score.pointsPossible;

      if ("category" in item && item.category) {
        if (!byCategory[item.category]) {
          byCategory[item.category] = { correctCount: 0, totalCount: 0, percent: 0 };
        }
        byCategory[item.category].totalCount += 1;
        if (score.isCorrect) byCategory[item.category].correctCount += 1;
      }
    }

    const percent = pointsPossible > 0 ? roundOne((pointsEarned / pointsPossible) * 100) : 0;
    const weightedMarksPossible = exam.weight;
    const weightedMarksEarned = roundOne((percent * weightedMarksPossible) / 100);
    const breakdownItem = {
      instanceId: exam.instanceId,
      definitionId: exam.definitionId,
      legacySectionId: exam.legacySectionId,
      label: exam.label,
      configSummary: exam.configSummary,
      durationMinutes: exam.durationMinutes,
      pointsEarned: roundOne(pointsEarned),
      pointsPossible: roundOne(pointsPossible),
      percent,
      weightedMarksEarned,
      weightedMarksPossible,
      requiredPercent: exam.requiredPercent,
      pass: percent >= exam.requiredPercent,
      order: exam.order
    };

    examBreakdown[exam.instanceId] = breakdownItem;

    if (exam.legacySectionId) {
      sectionBreakdown[exam.legacySectionId] = {
        label: exam.label,
        pointsEarned: breakdownItem.weightedMarksEarned,
        pointsPossible: breakdownItem.weightedMarksPossible,
        percent: breakdownItem.percent,
        requiredPercent: breakdownItem.requiredPercent,
        pass: breakdownItem.pass
      };
    }

    weightedPercentSum += percent * exam.weight;
    weightSum += exam.weight;
  }

  for (const category of Object.keys(byCategory)) {
    const row = byCategory[category];
    row.percent = row.totalCount ? roundOne((row.correctCount / row.totalCount) * 100) : 0;
  }

  const weightedMarksTotal = Object.values(examBreakdown).reduce((sum, item) => sum + item.weightedMarksEarned, 0);
  const finalPercent =
    weightSum === 100
      ? roundOne(weightedMarksTotal)
      : weightSum > 0
        ? roundOne(weightedPercentSum / weightSum)
        : 0;
  const examSummaries = orderedExams.map(summarizeExamInstance);
  const sections = examSummaries
    .map((exam) => exam.legacySectionId)
    .filter((sectionId): sectionId is NonNullable<typeof sectionId> => Boolean(sectionId));
  const corePercent =
    Object.values(examBreakdown).find((item) => item.definitionId === "core_exam")?.percent ??
    sectionBreakdown.core?.percent ??
    0;
  const practicalBreakdown = Object.values(examBreakdown).find((item) => item.definitionId === "practical_exam");
  const practicalPercent = practicalBreakdown?.percent ?? sectionBreakdown.practical?.percent ?? 0;
  const practicalMinPercent = practicalBreakdown?.requiredPercent ?? 0;
  const sectionGatesOk = Object.values(examBreakdown).every((item) => item.pass);
  const borderline = finalPercent >= passPercent - toInt(configV2.borderlineReviewBandPercent, 10);

  return {
    attemptId: input.attemptId,
    roleId: input.roleId,
    stacks: input.stacks,
    sections,
    exams: examSummaries,
    corePercent,
    practicalPercent,
    finalPercent,
    passPercent,
    practicalMinPercent,
    pass: finalPercent >= passPercent && sectionGatesOk,
    borderline: !(finalPercent >= passPercent && sectionGatesOk) && borderline,
    integrity: input.integrity ?? { tabHiddenCount: 0, copyCount: 0, pasteCount: 0 },
    sectionBreakdown,
    examBreakdown,
    breakdownByCategory: byCategory
  };
}

export { scoreQuestion };

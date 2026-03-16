import type { Question, ResultSummary, RoleId, ScoreOutput, ScoringMethod, StackId } from "@/lib/assessment-engine/types";
import { buildLogicReasoningQuestion, scoreLogicReasoningQuestion } from "@/features/logic-reasoning/grading";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";
import { buildPracticalQuestion, scorePracticalQuestion } from "@/features/practical/grading";
import { pickPracticalPack } from "@/features/practical/packs";
import { configV2, getRoleConfig, questionBank } from "@/lib/data/question-bank";
import { sectionRegistry } from "@/lib/sections/registry";
import type { SectionId, SectionState } from "@/lib/sections/types";
import { clamp, toInt, uniqueInts } from "@/lib/assessment-engine/utils";

function tokenToIndex(token: string | number, options: string[]): number {
  if (Number.isInteger(token)) return Number(token);
  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;
  return options.findIndex((x) => x === value);
}

function scoreChoiceLike(q: Question, answer: unknown): number {
  if (!("options" in q) || !Array.isArray(q.options)) return 0;
  const expected = (q.correctAnswer || [])
    .map((x) => tokenToIndex(x, q.options || []))
    .filter((x) => x >= 0);
  const picked = toInt(answer, -9999);
  return expected.includes(picked) ? 1 : 0;
}

function scoreMultiSelect(q: Question, answer: unknown, method: ScoringMethod): number {
  if (!("options" in q) || !Array.isArray(q.options)) return 0;
  const expected = new Set(
    (q.correctAnswer || [])
      .map((x) => tokenToIndex(x, q.options || []))
      .filter((x) => x >= 0)
  );
  const selected = uniqueInts(answer);
  if (method === "all_or_nothing") {
    if (expected.size !== selected.length) return 0;
    return selected.every((x) => expected.has(x)) ? 1 : 0;
  }
  let correct = 0;
  let wrong = 0;
  for (const idx of selected) {
    if (expected.has(idx)) correct += 1;
    else wrong += 1;
  }
  return expected.size ? Math.max(0, correct - wrong) / expected.size : 0;
}

function scoreOrdering(q: Question, answer: unknown, method: ScoringMethod): number {
  if (!Array.isArray((q as any).correctOrder)) return 0;
  const expected = (q as any).correctOrder as number[];
  const actual = Array.isArray(answer) ? answer.map((x) => toInt(x, -999)) : [];
  if (expected.length !== actual.length) return 0;
  if (method === "all_or_nothing") {
    return expected.every((x, idx) => x === actual[idx]) ? 1 : 0;
  }
  let aligned = 0;
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] === actual[i]) aligned += 1;
  }
  return expected.length ? aligned / expected.length : 0;
}

function scoreMatching(q: Question, answer: unknown, method: ScoringMethod): number {
  const expected = ((q as any).correctPairs || {}) as Record<string, string>;
  const keys = Object.keys(expected);
  const map = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};
  if (!keys.length) return 0;
  if (method === "all_or_nothing") {
    return keys.every((key) => String(map[key] || "") === String(expected[key])) ? 1 : 0;
  }
  let correct = 0;
  let wrong = 0;
  for (const key of keys) {
    const got = String(map[key] || "");
    if (!got) continue;
    if (got === String(expected[key])) correct += 1;
    else wrong += 1;
  }
  return Math.max(0, correct - wrong) / keys.length;
}

function scoreFillBlank(q: Question, answer: unknown): number {
  const accepted = ((q as any).acceptedAnswers || []).map((x: string) => x.trim().toLowerCase());
  const candidate = Array.isArray(answer)
    ? String(answer[0] || "").trim().toLowerCase()
    : String(answer || "").trim().toLowerCase();
  return accepted.includes(candidate) ? 1 : 0;
}

export function scoreQuestion(q: Question, answer: unknown): ScoreOutput {
  const method = q.scoringMethod || "all_or_nothing";
  let normalized = 0;
  switch (q.format) {
    case "single_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage":
      normalized = scoreChoiceLike(q, answer);
      break;
    case "multi_select":
      normalized = scoreMultiSelect(q, answer, method);
      break;
    case "ordering":
      normalized = scoreOrdering(q, answer, method);
      break;
    case "matching":
      normalized = scoreMatching(q, answer, method);
      break;
    case "fill_blank_constrained":
      normalized = scoreFillBlank(q, answer);
      break;
    default:
      normalized = 0;
  }
  normalized = clamp(normalized, 0, 1);
  const pointsPossible = Number(q.points || 1);
  const pointsEarned = Math.round(normalized * pointsPossible * 100) / 100;
  return { normalized, pointsEarned, pointsPossible, isCorrect: normalized >= 0.999 };
}

export interface BuildResultInput {
  attemptId: string;
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  coreQuestionIds: string[];
  sectionState: Partial<Record<SectionId, SectionState>>;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildResultSummary(input: BuildResultInput): ResultSummary {
  const role = getRoleConfig(input.roleId);
  const passPercent = toInt(role.pass_percentage, 60);
  const selectedSections = input.sections.filter((sectionId) => Boolean(sectionRegistry[sectionId]));
  const byCategory: Record<string, { correctCount: number; totalCount: number; percent: number }> = {};
  const sectionBreakdown: ResultSummary["sectionBreakdown"] = {};
  let weightedPercentSum = 0;
  let weightSum = 0;

  for (const sectionId of selectedSections) {
    const section = sectionRegistry[sectionId];
    let pointsEarned = 0;
    let pointsPossible = 0;

    if (sectionId === "core") {
      for (const questionId of input.coreQuestionIds) {
        const question = questionBank.find((item) => item.id === questionId);
        if (!question) continue;
        const answer = input.sectionState.core?.answers?.[questionId];
        const score = scoreQuestion(question, answer);
        pointsEarned += score.pointsEarned;
        pointsPossible += score.pointsPossible;
        if (!byCategory[question.category]) {
          byCategory[question.category] = { correctCount: 0, totalCount: 0, percent: 0 };
        }
        byCategory[question.category].totalCount += 1;
        if (score.isCorrect) byCategory[question.category].correctCount += 1;
      }
    }

    if (sectionId === "practical") {
      const practicalPack = pickPracticalPack(input.roleId, input.stacks);
      const practicalQuestion = buildPracticalQuestion(practicalPack);
      const practicalScore = scorePracticalQuestion(practicalQuestion, input.sectionState.practical?.answers ?? {});
      pointsEarned = practicalScore.pointsEarned;
      pointsPossible = practicalQuestion.points;
    }

    if (sectionId === "applied_logic_reasoning") {
      const logicPack = pickLogicReasoningPack(input.roleId, input.stacks);
      const logicQuestion = buildLogicReasoningQuestion(logicPack);
      const logicScore = scoreLogicReasoningQuestion(logicQuestion, input.sectionState.applied_logic_reasoning?.answers ?? {});
      pointsEarned = logicScore.earned;
      pointsPossible = logicScore.possible;
    }

    const percent = pointsPossible > 0 ? roundOne((pointsEarned / pointsPossible) * 100) : 0;
    sectionBreakdown[sectionId] = {
      label: section.label,
      pointsEarned: roundOne(pointsEarned),
      pointsPossible: roundOne(pointsPossible),
      percent
    };

    weightedPercentSum += percent * section.weight;
    weightSum += section.weight;
  }

  for (const category of Object.keys(byCategory)) {
    const row = byCategory[category];
    row.percent = row.totalCount ? roundOne((row.correctCount / row.totalCount) * 100) : 0;
  }

  const finalPercent = weightSum > 0 ? roundOne(weightedPercentSum / weightSum) : 0;
  const practicalPercent = sectionBreakdown.practical?.percent ?? 0;
  const practicalMinPercent = selectedSections.includes("practical")
    ? (sectionRegistry.practical.minPercentRequired ?? 0)
    : 0;

  let sectionGatesOk = true;
  for (const sectionId of selectedSections) {
    const minPercentRequired = sectionRegistry[sectionId].minPercentRequired;
    if (typeof minPercentRequired === "number" && minPercentRequired > 0) {
      const currentPercent = sectionBreakdown[sectionId]?.percent ?? 0;
      if (currentPercent < minPercentRequired) {
        sectionGatesOk = false;
      }
    }
  }

  const pass = finalPercent >= passPercent && sectionGatesOk;
  const borderline = finalPercent >= passPercent - toInt(configV2.borderlineReviewBandPercent, 10);

  return {
    attemptId: input.attemptId,
    roleId: input.roleId,
    stacks: input.stacks,
    sections: selectedSections,
    corePercent: sectionBreakdown.core?.percent ?? 0,
    practicalPercent,
    finalPercent,
    passPercent,
    practicalMinPercent,
    pass,
    borderline: !pass && borderline,
    sectionBreakdown,
    breakdownByCategory: byCategory
  };
}

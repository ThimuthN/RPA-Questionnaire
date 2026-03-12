import type {
  Question,
  ResultSummary,
  RoleId,
  ScoreOutput,
  ScoringMethod,
  StackId
} from "@/lib/assessment-engine/types";
import { clamp, toInt, uniqueInts } from "@/lib/assessment-engine/utils";
import { configV2, getRoleConfig, questionBank } from "@/lib/data/question-bank";

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
  coreQuestionIds: string[];
  coreAnswers: Record<string, unknown>;
  practicalEarned: number;
  practicalPossible: number;
}

export function buildResultSummary(input: BuildResultInput): ResultSummary {
  const role = getRoleConfig(input.roleId);
  const passPercent = toInt(role.pass_percentage, 60);
  const practicalMinPercent = 50;
  const practicalWeightPercent = 30;
  const coreWeightPercent = 70;
  let coreEarned = 0;
  let corePossible = 0;
  const byCategory: Record<string, { correctCount: number; totalCount: number; percent: number }> = {};

  for (const questionId of input.coreQuestionIds) {
    const question = questionBank.find((x) => x.id === questionId);
    if (!question) continue;
    const score = scoreQuestion(question, input.coreAnswers[questionId]);
    coreEarned += score.pointsEarned;
    corePossible += score.pointsPossible;
    if (!byCategory[question.category]) {
      byCategory[question.category] = { correctCount: 0, totalCount: 0, percent: 0 };
    }
    byCategory[question.category].totalCount += 1;
    if (score.isCorrect) byCategory[question.category].correctCount += 1;
  }

  Object.keys(byCategory).forEach((category) => {
    const row = byCategory[category];
    row.percent = row.totalCount ? Math.round((row.correctCount / row.totalCount) * 1000) / 10 : 0;
  });

  const corePercent = corePossible ? Math.round((coreEarned / corePossible) * 1000) / 10 : 0;
  const practicalPercent = input.practicalPossible
    ? Math.round((input.practicalEarned / input.practicalPossible) * 1000) / 10
    : 0;
  const finalPercent =
    Math.round((corePercent * coreWeightPercent + practicalPercent * practicalWeightPercent)) / 100;
  const borderline = finalPercent >= passPercent - toInt(configV2.borderlineReviewBandPercent, 10);
  const pass = finalPercent >= passPercent && practicalPercent >= practicalMinPercent;

  return {
    attemptId: input.attemptId,
    roleId: input.roleId,
    stacks: input.stacks,
    corePercent,
    practicalPercent,
    finalPercent,
    passPercent,
    practicalMinPercent,
    pass,
    borderline: !pass && borderline,
    sectionBreakdown: {
      core: { pointsEarned: coreEarned, pointsPossible: corePossible, percent: corePercent },
      practical: {
        pointsEarned: input.practicalEarned,
        pointsPossible: input.practicalPossible,
        percent: practicalPercent
      }
    },
    breakdownByCategory: byCategory
  };
}

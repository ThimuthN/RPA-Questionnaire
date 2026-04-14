import type { Question, ScoringMethod } from "@/lib/assessment-engine/types";

function tokenToIndex(token: string | number, options: string[]): number {
  if (Number.isInteger(token)) return Number(token);
  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;
  return options.findIndex((option) => option === value);
}

function toInt(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsed) ? parsed : fallback;
}

function uniqueInts(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<number>();
  const result: number[] = [];

  for (const item of value) {
    const next = toInt(item, Number.NaN);
    if (!Number.isInteger(next) || seen.has(next)) continue;
    seen.add(next);
    result.push(next);
  }

  return result;
}

export type QuestionAutoScorer<Q = unknown, A = unknown> = (
  question: Q,
  answer: A,
  method: ScoringMethod
) => number;

export const scoreChoiceLike: QuestionAutoScorer<Question, unknown> = (question, answer) => {
  if (!("options" in question) || !Array.isArray(question.options)) return 0;

  const expected = (question.correctAnswer || [])
    .map((token) => tokenToIndex(token, question.options || []))
    .filter((index) => index >= 0);

  const picked = toInt(answer, -9999);
  return expected.includes(picked) ? 1 : 0;
};

export const scoreMultiSelect: QuestionAutoScorer<Question, unknown> = (question, answer, method) => {
  if (!("options" in question) || !Array.isArray(question.options)) return 0;

  const expected = new Set(
    (question.correctAnswer || [])
      .map((token) => tokenToIndex(token, question.options || []))
      .filter((index) => index >= 0)
  );

  const selected = uniqueInts(answer);
  if (method === "all_or_nothing") {
    if (expected.size !== selected.length) return 0;
    return selected.every((index) => expected.has(index)) ? 1 : 0;
  }

  let correct = 0;
  let wrong = 0;
  for (const index of selected) {
    if (expected.has(index)) correct += 1;
    else wrong += 1;
  }

  return expected.size ? Math.max(0, correct - wrong) / expected.size : 0;
};

export const scoreOrdering: QuestionAutoScorer<Question, unknown> = (question, answer, method) => {
  if (!Array.isArray((question as { correctOrder?: number[] }).correctOrder)) return 0;

  const expected = (question as { correctOrder: number[] }).correctOrder;
  const actual = Array.isArray(answer) ? answer.map((item) => toInt(item, -999)) : [];

  if (expected.length !== actual.length) return 0;
  if (method === "all_or_nothing") {
    return expected.every((item, index) => item === actual[index]) ? 1 : 0;
  }

  let aligned = 0;
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === actual[index]) aligned += 1;
  }

  return expected.length ? aligned / expected.length : 0;
};

export const scoreMatching: QuestionAutoScorer<Question, unknown> = (question, answer, method) => {
  const expected = ((question as { correctPairs?: Record<string, string> }).correctPairs || {}) as Record<
    string,
    string
  >;
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
};

export const scoreFillBlank: QuestionAutoScorer<Question, unknown> = (question, answer) => {
  const accepted = ((question as { acceptedAnswers?: string[] }).acceptedAnswers || []).map((item) =>
    item.trim().toLowerCase()
  );
  const candidate = Array.isArray(answer)
    ? String(answer[0] || "").trim().toLowerCase()
    : String(answer || "").trim().toLowerCase();

  return accepted.includes(candidate) ? 1 : 0;
};

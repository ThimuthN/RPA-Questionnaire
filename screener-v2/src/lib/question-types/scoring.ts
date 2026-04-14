import type { Question, ScoreOutput } from "@/lib/assessment-engine/types";
import { clamp } from "@/lib/assessment-engine/utils";
import { getQuestionScorer } from "@/lib/question-types/scoring-registry";

export function scoreQuestion(q: Question, answer: unknown): ScoreOutput {
  const method = q.scoringMethod || "all_or_nothing";
  const scorer = getQuestionScorer(q.format);
  let normalized = scorer ? scorer(q, answer, method) : 0;
  normalized = clamp(normalized, 0, 1);
  const pointsPossible = Number(q.points || 1);
  const pointsEarned = Math.round(normalized * pointsPossible * 100) / 100;
  return { normalized, pointsEarned, pointsPossible, isCorrect: normalized >= 0.999 };
}

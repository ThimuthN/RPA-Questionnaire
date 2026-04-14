import { z } from "zod";
import { clamp } from "@/lib/assessment-engine/utils";
import type { ScoringMethod } from "@/lib/assessment-engine/types";
import type { QuestionAutoScorer } from "@/lib/question-types/auto-scorers";

export const commonQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  promptBlocks: z.array(z.any()).optional(),
  points: z.number(),
  options: z.array(z.string()).optional(),
  items: z.array(z.string()).optional(),
  leftItems: z.array(z.string()).optional(),
  rightItems: z.array(z.string()).optional(),
  correctPairs: z.record(z.string(), z.string()).optional(),
  blank: z.string().optional(),
  choices: z.array(z.string()).optional(),
  acceptedAnswers: z.array(z.string()).optional()
});

export function buildAutoScoreAdapter<Q extends { points?: number; scoringMethod?: ScoringMethod }, A>(
  scorer: QuestionAutoScorer<Q, A>
) {
  return (question: Q, answer: A) => {
    const normalized = clamp(scorer(question, answer, question.scoringMethod || "all_or_nothing"), 0, 1);
    const pointsPossible = Number(question.points || 1);
    const pointsEarned = Math.round(normalized * pointsPossible * 100) / 100;

    return {
      normalized,
      pointsEarned,
      isCorrect: normalized >= 0.999
    };
  };
}

export function reviewLines(question: any, answer: any) {
  return {
    lines: [
      `Question: ${question.prompt}`,
      `Your answer: ${JSON.stringify(answer)}`,
      `Expected: ${JSON.stringify(question.correctAnswer || question.correctPairs || question.correctOrder || question.acceptedAnswers || [])}`
    ]
  };
}

import { z } from "zod";
import { scoreQuestion } from "@/lib/question-types/scoring";

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

export function scoreAdapter(question: any, answer: any) {
  const score = scoreQuestion(question, answer);
  return {
    normalized: score.normalized,
    pointsEarned: score.pointsEarned,
    isCorrect: score.isCorrect
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

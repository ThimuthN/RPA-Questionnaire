import type { ComponentType } from "react";
import type { z } from "zod";
import type { QuestionFormatId } from "@/lib/assessment-engine/types";

export interface QuestionTypeDef<Q, A, R> {
  type: QuestionFormatId;
  schema: z.ZodType<Q>;
  answerSchema: z.ZodType<A>;
  validateAnswer: (question: Q, answer: A) => { ok: boolean; reason?: string };
  score: (question: Q, answer: A) => { normalized: number; pointsEarned: number; isCorrect: boolean };
  toReviewModel: (question: Q, answer: A) => R;
  Renderer: ComponentType<{ question: Q; answer: A | null; onChange: (value: A) => void }>;
  ReviewRenderer: ComponentType<{ review: R }>;
}

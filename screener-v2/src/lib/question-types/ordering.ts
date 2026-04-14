import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { OrderingRenderer } from "@/components/runtime/renderers/OrderingRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { scoreOrdering } from "@/lib/question-types/auto-scorers";
import { buildAutoScoreAdapter, commonQuestionSchema, reviewLines } from "@/lib/question-types/_base";

export const orderingDef: QuestionTypeDef<any, number[], { lines: string[] }> = {
  type: "ordering",
  runtimeLabel: "Ordering",
  runtimeHint: "Arrange the items in the safest working order.",
  schema: commonQuestionSchema.extend({
    items: z.array(z.string()).min(2),
    correctOrder: z.array(z.number().int()).min(2)
  }),
  answerSchema: z.array(z.number().int()),
  validateAnswer: (question, answer) => ({
    ok: Array.isArray(answer) && answer.length === (question.items || []).length,
    reason: "Arrange all items."
  }),
  score: buildAutoScoreAdapter(scoreOrdering),
  toReviewModel: reviewLines,
  autoScorer: scoreOrdering,
  Renderer: OrderingRenderer,
  ReviewRenderer: GenericReviewRenderer
};

import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { ChoiceRenderer } from "@/components/runtime/renderers/ChoiceRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { scoreChoiceLike } from "@/lib/question-types/auto-scorers";
import { buildAutoScoreAdapter, commonQuestionSchema, reviewLines } from "@/lib/question-types/_base";

export const singleSelectDef: QuestionTypeDef<any, number, { lines: string[] }> = {
  type: "single_select",
  runtimeLabel: "Single select",
  runtimeHint: "Choose the one best answer.",
  schema: commonQuestionSchema.extend({
    options: z.array(z.string()).min(2),
    correctAnswer: z.array(z.string()).min(1)
  }),
  answerSchema: z.number().int().min(0),
  validateAnswer: (_question, answer) => ({
    ok: Number.isInteger(answer),
    reason: "Select one option."
  }),
  score: buildAutoScoreAdapter(scoreChoiceLike),
  toReviewModel: reviewLines,
  autoScorer: scoreChoiceLike,
  Renderer: ChoiceRenderer,
  ReviewRenderer: GenericReviewRenderer
};

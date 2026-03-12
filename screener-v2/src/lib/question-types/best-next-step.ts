import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { ChoiceRenderer } from "@/components/runtime/renderers/ChoiceRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { commonQuestionSchema, reviewLines, scoreAdapter } from "@/lib/question-types/_base";

export const bestNextStepDef: QuestionTypeDef<any, number, { lines: string[] }> = {
  type: "best_next_step",
  schema: commonQuestionSchema.extend({
    options: z.array(z.string()).min(2),
    correctAnswer: z.array(z.string()).min(1)
  }),
  answerSchema: z.number().int().min(0),
  validateAnswer: (_question, answer) => ({ ok: Number.isInteger(answer), reason: "Pick one answer." }),
  score: scoreAdapter,
  toReviewModel: reviewLines,
  Renderer: ChoiceRenderer,
  ReviewRenderer: GenericReviewRenderer
};

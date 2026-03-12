import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { ChoiceRenderer } from "@/components/runtime/renderers/ChoiceRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { commonQuestionSchema, reviewLines, scoreAdapter } from "@/lib/question-types/_base";

export const singleSelectDef: QuestionTypeDef<any, number, { lines: string[] }> = {
  type: "single_select",
  schema: commonQuestionSchema.extend({
    options: z.array(z.string()).min(2),
    correctAnswer: z.array(z.string()).min(1)
  }),
  answerSchema: z.number().int().min(0),
  validateAnswer: (_question, answer) => ({
    ok: Number.isInteger(answer),
    reason: "Select one option."
  }),
  score: scoreAdapter,
  toReviewModel: reviewLines,
  Renderer: ChoiceRenderer,
  ReviewRenderer: GenericReviewRenderer
};

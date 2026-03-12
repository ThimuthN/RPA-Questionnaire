import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { FillBlankRenderer } from "@/components/runtime/renderers/FillBlankRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { commonQuestionSchema, reviewLines, scoreAdapter } from "@/lib/question-types/_base";

export const fillBlankDef: QuestionTypeDef<any, string, { lines: string[] }> = {
  type: "fill_blank_constrained",
  schema: commonQuestionSchema.extend({
    blank: z.string(),
    choices: z.array(z.string()).min(2),
    acceptedAnswers: z.array(z.string()).min(1)
  }),
  answerSchema: z.string().min(1),
  validateAnswer: (_question, answer) => ({
    ok: Boolean(String(answer || "").trim()),
    reason: "Select one answer."
  }),
  score: scoreAdapter,
  toReviewModel: reviewLines,
  Renderer: FillBlankRenderer,
  ReviewRenderer: GenericReviewRenderer
};

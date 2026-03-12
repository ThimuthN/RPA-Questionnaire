import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { ChoiceRenderer } from "@/components/runtime/renderers/ChoiceRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { commonQuestionSchema, reviewLines, scoreAdapter } from "@/lib/question-types/_base";

const MultiChoiceRenderer = (props: any) => ChoiceRenderer({ ...props, multiple: true });

export const multiSelectDef: QuestionTypeDef<any, number[], { lines: string[] }> = {
  type: "multi_select",
  schema: commonQuestionSchema.extend({
    options: z.array(z.string()).min(2),
    correctAnswer: z.array(z.string()).min(1)
  }),
  answerSchema: z.array(z.number().int().min(0)),
  validateAnswer: (_question, answer) => ({
    ok: Array.isArray(answer) && answer.length > 0,
    reason: "Select at least one option."
  }),
  score: scoreAdapter,
  toReviewModel: reviewLines,
  Renderer: MultiChoiceRenderer,
  ReviewRenderer: GenericReviewRenderer
};

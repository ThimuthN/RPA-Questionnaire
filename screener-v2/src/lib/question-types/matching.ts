import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { MatchingRenderer } from "@/components/runtime/renderers/MatchingRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import { commonQuestionSchema, reviewLines, scoreAdapter } from "@/lib/question-types/_base";

export const matchingDef: QuestionTypeDef<any, Record<string, string>, { lines: string[] }> = {
  type: "matching",
  schema: commonQuestionSchema.extend({
    leftItems: z.array(z.string()).min(2),
    rightItems: z.array(z.string()).min(2),
    correctPairs: z.record(z.string(), z.string())
  }),
  answerSchema: z.record(z.string(), z.string()),
  validateAnswer: (question, answer) => ({
    ok: (question.leftItems || []).every((item: string) => Boolean(answer[item])),
    reason: "Match all left items."
  }),
  score: scoreAdapter,
  toReviewModel: reviewLines,
  Renderer: MatchingRenderer,
  ReviewRenderer: GenericReviewRenderer
};

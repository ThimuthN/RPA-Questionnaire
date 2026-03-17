import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { LogicReasoningRenderer } from "@/components/runtime/renderers/LogicReasoningRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import {
  scoreLogicReasoningQuestion,
  validateLogicReasoningAnswer
} from "@/features/logic-reasoning/grading";

const logicReasoningOptionSchema = z.object({
  id: z.string(),
  label: z.string()
});

const logicReasoningSingleSelectSubtaskSchema = z.object({
  id: z.string(),
  type: z.literal("single_select"),
  label: z.string(),
  promptBlocks: z.array(z.any()).optional(),
  points: z.number(),
  expected: z.string(),
  options: z.array(logicReasoningOptionSchema).min(2)
});

const logicReasoningMatchingSubtaskSchema = z.object({
  id: z.string(),
  type: z.literal("matching"),
  label: z.string(),
  promptBlocks: z.array(z.any()).optional(),
  points: z.number(),
  leftItems: z.array(z.string()).min(1),
  rightOptions: z.array(logicReasoningOptionSchema).min(2),
  expected: z.record(z.string(), z.string())
});

const logicReasoningSubtaskSchema = z.union([
  logicReasoningSingleSelectSubtaskSchema,
  logicReasoningMatchingSubtaskSchema
]);

const logicReasoningSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  promptBlocks: z.array(z.any()).optional(),
  points: z.number(),
  subtasks: z.array(logicReasoningSubtaskSchema)
});

const logicReasoningAnswerSchema = z.record(z.string(), z.any());

function validateLogicReasoning(question: any, answer: Record<string, unknown>) {
  const valid = validateLogicReasoningAnswer(question, answer);
  return {
    ok: valid,
    reason: valid ? undefined : "Complete all logic and reasoning subtasks."
  };
}

function scoreLogicReasoning(question: any, answer: Record<string, unknown>) {
  const { earned, possible } = scoreLogicReasoningQuestion(question, answer);
  return {
    normalized: possible > 0 ? earned / possible : 0,
    pointsEarned: earned,
    isCorrect: possible > 0 ? earned >= possible : false
  };
}

export const logicReasoningDef: QuestionTypeDef<any, Record<string, unknown>, { lines: string[] }> = {
  type: "logic_reasoning",
  schema: logicReasoningSchema,
  answerSchema: logicReasoningAnswerSchema,
  validateAnswer: validateLogicReasoning,
  score: scoreLogicReasoning,
  toReviewModel: (question, answer) => ({
    lines: [
      `Logic task: ${question.prompt}`,
      ...Object.keys(answer).map((key) => `${key}: ${JSON.stringify(answer[key])}`)
    ]
  }),
  Renderer: LogicReasoningRenderer as any,
  ReviewRenderer: GenericReviewRenderer
};

import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { PracticalTaskRenderer } from "@/components/runtime/renderers/PracticalTaskRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import {
  scorePracticalQuestion,
  validatePracticalAnswer
} from "@/features/practical/grading";

const practicalOptionSchema = z.object({
  id: z.string(),
  label: z.string()
});

const practicalSingleSelectSubtaskSchema = z.object({
  id: z.string(),
  type: z.literal("single_select"),
  label: z.string(),
  points: z.number(),
  expected: z.string(),
  options: z.array(practicalOptionSchema).min(2)
});

const practicalMatchingSubtaskSchema = z.object({
  id: z.string(),
  type: z.literal("matching"),
  label: z.string(),
  points: z.number(),
  leftItems: z.array(z.string()).min(1),
  rightOptions: z.array(practicalOptionSchema).min(2),
  expected: z.record(z.string(), z.string())
});

const practicalSubtaskSchema = z.union([
  practicalSingleSelectSubtaskSchema,
  practicalMatchingSubtaskSchema
]);

const practicalSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  points: z.number(),
  subtasks: z.array(practicalSubtaskSchema)
});

const practicalAnswerSchema = z.record(z.string(), z.any());

function validatePractical(question: any, answer: Record<string, unknown>) {
  return validatePracticalAnswer(question, answer);
}

function scorePractical(question: any, answer: Record<string, unknown>) {
  return scorePracticalQuestion(question, answer);
}

function practicalReview(question: any, answer: Record<string, unknown>) {
  const lines = [`Practical task: ${question.prompt}`];
  const subtasks = Array.isArray(question.subtasks) ? question.subtasks : [];
  for (const task of subtasks) {
    lines.push(`${task.label}: ${JSON.stringify(answer[task.id])}`);
  }
  return { lines };
}

export const practicalTaskDef: QuestionTypeDef<any, Record<string, unknown>, { lines: string[] }> = {
  type: "practical_task",
  schema: practicalSchema,
  answerSchema: practicalAnswerSchema,
  validateAnswer: validatePractical,
  score: scorePractical,
  toReviewModel: practicalReview,
  Renderer: PracticalTaskRenderer,
  ReviewRenderer: GenericReviewRenderer
};

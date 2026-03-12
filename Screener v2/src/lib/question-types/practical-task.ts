import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { PracticalTaskRenderer } from "@/components/runtime/renderers/PracticalTaskRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";

const practicalSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  points: z.number(),
  subtasks: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["text", "ordering", "single_select"]),
      label: z.string(),
      points: z.number(),
      expected: z.any().optional(),
      items: z.array(z.string()).optional()
    })
  )
});

const practicalAnswerSchema = z.record(z.string(), z.any());

function validatePractical(question: any, answer: Record<string, unknown>) {
  const subtasks = Array.isArray(question.subtasks) ? question.subtasks : [];
  const missing = subtasks.filter((task: any) => answer[task.id] == null || answer[task.id] === "");
  if (missing.length) {
    return { ok: false, reason: `Complete all practical subtasks (${missing.length} missing).` };
  }
  return { ok: true };
}

function scorePractical(question: any, answer: Record<string, unknown>) {
  const subtasks = Array.isArray(question.subtasks) ? question.subtasks : [];
  let earned = 0;
  let possible = 0;
  for (const task of subtasks) {
    const points = Number(task.points || 1);
    possible += points;
    const expected = task.expected;
    const actual = answer[task.id];
    if (task.type === "ordering") {
      const exp = JSON.stringify(expected || []);
      const act = JSON.stringify(actual || []);
      if (exp === act) earned += points;
      continue;
    }
    if (Array.isArray(expected)) {
      if (expected.includes(actual)) earned += points;
      continue;
    }
    if (String(expected || "").toLowerCase() === String(actual || "").toLowerCase()) {
      earned += points;
    }
  }
  const normalized = possible ? earned / possible : 0;
  return {
    normalized,
    pointsEarned: Math.round(earned * 100) / 100,
    isCorrect: normalized >= 0.999
  };
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

import type { ExamQuestion, ExamState, FrozenExamInstance } from "@/lib/assessment-engine/types";
import { questionRegistry } from "@/lib/question-types";

export function isExamItemAnswered(item: ExamQuestion, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;
  const def = questionRegistry[item.format];
  if (!def) return false;
  const parsed = def.answerSchema.safeParse(answer);
  if (!parsed.success) return false;
  return def.validateAnswer(item as never, parsed.data as never).ok;
}

export function answeredItemCount(instance: FrozenExamInstance, state?: ExamState) {
  return instance.contentSnapshot.items.filter((item) => isExamItemAnswered(item, state?.answers?.[item.id])).length;
}

export function examProgressValue(instance: FrozenExamInstance, state?: ExamState) {
  const total = instance.contentSnapshot.items.length;
  const answered = answeredItemCount(instance, state);
  return {
    answered,
    total,
    ratio: total > 0 ? answered / total : 0
  };
}

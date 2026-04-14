import type { ExamQuestion } from "@/lib/assessment-engine/types";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { getQuestionsByIds, questionBank } from "@/lib/data/question-bank";
import { ensureStacks, resolveCoreBasisRoleId } from "@/lib/exams/definition-support";

export function buildCoreQuestions(config: Record<string, unknown>): ExamQuestion[] {
  const roleId = resolveCoreBasisRoleId(config);
  const stacks = ensureStacks(config.stacks);
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(roleId, stacks, selectionSeed, questionBank);
  return getQuestionsByIds(selection.selectedIds);
}

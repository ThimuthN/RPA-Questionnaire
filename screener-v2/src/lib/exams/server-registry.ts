import type { ExamQuestion } from "@/lib/assessment-engine/types";
import { addonDefinitionRegistry } from "@/lib/addons/definitions";
import type { ExamDefinitionId } from "@/lib/exams/definitions";

export function resolveExamItems(definitionId: ExamDefinitionId, config: Record<string, unknown>): ExamQuestion[] {
  return addonDefinitionRegistry[definitionId].resolveItems(config);
}

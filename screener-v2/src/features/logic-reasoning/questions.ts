import type { ExamQuestion, LogicReasoningQuestion, StackId } from "@/lib/assessment-engine/types";
import { pickLogicReasoningPack } from "@/features/logic-reasoning/packs";

export function buildLogicReasoningQuestions(config: Record<string, unknown>): ExamQuestion[] {
  const stack = String(config.stack || "UiPath") as StackId;
  const pack = pickLogicReasoningPack("Associate", [stack]);
  const question: LogicReasoningQuestion = {
    id: `${pack.id}_logic_reasoning`,
    format: "logic_reasoning",
    title: pack.title,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, task) => sum + Number(task.points || 0), 0),
    subtasks: pack.subtasks
  };
  return [question];
}

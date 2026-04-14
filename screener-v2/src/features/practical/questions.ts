import type { ExamQuestion, PracticalTaskQuestion, StackId } from "@/lib/assessment-engine/types";
import { pickPracticalPack } from "@/features/practical/packs";

export function buildPracticalQuestions(config: Record<string, unknown>): ExamQuestion[] {
  const stack = String(config.stack || "UiPath") as StackId;
  const pack = pickPracticalPack("Associate", [stack]);
  const question: PracticalTaskQuestion = {
    id: `${pack.id}_practical`,
    format: "practical_task",
    title: pack.title,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, task) => sum + Number(task.points || 0), 0),
    subtasks: pack.subtasks
  };
  return [question];
}

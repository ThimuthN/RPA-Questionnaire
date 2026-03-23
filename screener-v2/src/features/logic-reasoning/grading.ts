import type { LogicReasoningPack, LogicReasoningSubtask } from "./packs";

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildLogicReasoningQuestion(pack: LogicReasoningPack) {
  return {
    id: pack.id,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, subtask) => sum + subtask.points, 0),
    subtasks: pack.subtasks
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isLogicReasoningSubtaskAnswered(task: LogicReasoningSubtask, value: unknown): boolean {
  if (task.type === "single_select") {
    return typeof value === "string" && value.trim().length > 0;
  }

  if (task.type === "matching") {
    if (!isRecord(value)) return false;
    const leftItems = Array.isArray(task.leftItems) ? task.leftItems : [];
    return leftItems.every((left) => typeof value[left] === "string" && String(value[left]).trim().length > 0);
  }

  return false;
}

export function validateLogicReasoningAnswer(
  question: ReturnType<typeof buildLogicReasoningQuestion>,
  answer: Record<string, unknown>
): boolean {
  for (const subtask of question.subtasks) {
    if (!isLogicReasoningSubtaskAnswered(subtask, answer[subtask.id])) return false;
  }
  return true;
}

export function scoreLogicReasoningQuestion(
  question: ReturnType<typeof buildLogicReasoningQuestion>,
  answer: Record<string, unknown>
): { earned: number; possible: number } {
  let earned = 0;
  let possible = 0;

  for (const subtask of question.subtasks) {
    possible += subtask.points;
    const subtaskAnswer = answer[subtask.id];

    if (subtask.type === "single_select") {
      if (subtaskAnswer === subtask.expected) {
        earned += subtask.points;
      }
    } else if (subtask.type === "matching") {
      const matchingAnswer = isRecord(subtaskAnswer) ? (subtaskAnswer as Record<string, string>) : {};
      const expectedEntries = Object.entries(subtask.expected);
      const expectedCount = expectedEntries.length || 1;
      const correctCount = expectedEntries.filter(([left, right]) => matchingAnswer[left] === right).length;
      earned += roundTwo(correctCount * (subtask.points / expectedCount));
    }
  }

  return { earned: roundTwo(earned), possible };
}

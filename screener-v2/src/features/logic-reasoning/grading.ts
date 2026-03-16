import type { LogicReasoningPack, LogicReasoningSubtask } from "./packs";

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
  // Basic validation - ensure all subtasks have answers
  for (const subtask of question.subtasks) {
    const subtaskAnswer = answer[subtask.id];
    if (!subtaskAnswer) return false;

    if (subtask.type === "single_select") {
      if (typeof subtaskAnswer !== "string") return false;
    } else if (subtask.type === "matching") {
      if (typeof subtaskAnswer !== "object" || subtaskAnswer === null) return false;
      const matchingAnswer = subtaskAnswer as Record<string, string>;
      if (Object.keys(matchingAnswer).length !== subtask.leftItems.length) return false;
    }
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
      const matchingAnswer = subtaskAnswer as Record<string, string>;
      let subtaskEarned = 0;
      for (const [left, right] of Object.entries(matchingAnswer)) {
        if (subtask.expected[left] === right) {
          subtaskEarned += subtask.points / Object.keys(subtask.expected).length;
        }
      }
      earned += Math.round(subtaskEarned);
    }
  }

  return { earned, possible };
}
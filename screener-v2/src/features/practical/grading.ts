import type { PracticalPack, PracticalSubtask } from "@/features/practical/packs";

export interface PracticalQuestionModel {
  id: string;
  prompt: string;
  points: number;
  subtasks: PracticalSubtask[];
}

export interface PracticalScoreResult {
  normalized: number;
  pointsEarned: number;
  isCorrect: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildPracticalQuestion(pack: PracticalPack): PracticalQuestionModel {
  return {
    id: `${pack.id}_practical`,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum, item) => sum + Number(item.points || 0), 0),
    subtasks: pack.subtasks
  };
}

export function isPracticalSubtaskAnswered(task: PracticalSubtask, value: unknown): boolean {
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

export function validatePracticalAnswer(
  question: PracticalQuestionModel,
  answer: Record<string, unknown>
): { ok: true } | { ok: false; reason: string } {
  const subtasks = Array.isArray(question.subtasks) ? question.subtasks : [];
  const missing = subtasks.filter((task) => !isPracticalSubtaskAnswered(task, answer[task.id]));
  if (missing.length) {
    return { ok: false, reason: `Complete all practical subtasks (${missing.length} missing).` };
  }
  return { ok: true };
}

function isSubtaskCorrect(task: PracticalSubtask, value: unknown): boolean {
  if (task.type === "single_select") {
    return typeof value === "string" && value === task.expected;
  }

  if (task.type === "matching") {
    if (!isRecord(value) || !isRecord(task.expected)) return false;
    const leftItems = Array.isArray(task.leftItems) ? task.leftItems : [];
    return leftItems.every((left) => String(value[left] ?? "") === String(task.expected[left] ?? ""));
  }

  return false;
}

export function scorePracticalQuestion(
  question: PracticalQuestionModel,
  answer: Record<string, unknown>
): PracticalScoreResult {
  const subtasks = Array.isArray(question.subtasks) ? question.subtasks : [];
  let earned = 0;
  let possible = 0;

  for (const task of subtasks) {
    const points = Number(task.points || 1);
    possible += points;
    if (isSubtaskCorrect(task, answer[task.id])) {
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

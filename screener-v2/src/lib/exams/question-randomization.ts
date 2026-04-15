import type {
  CompositeSubtask,
  ExamQuestion,
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  Question
} from "@/lib/assessment-engine/types";
import { hashSeed, rng, sequence, shuffle } from "@/lib/assessment-engine/utils";

function tokenToIndex(token: string | number, options: string[]): number {
  if (Number.isInteger(token)) return Number(token);

  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;

  return options.findIndex((option) => option === value);
}

function buildOrder(length: number, seedKey: string) {
  const order = sequence(length);
  return shuffle(order, rng(hashSeed(seedKey)));
}

function reorderList<T>(items: T[], order: number[]) {
  return order.map((index) => items[index]);
}

function remapCorrectAnswers(correctAnswer: string[], options: string[], order: number[]) {
  const oldIndexToNew = new Map<number, number>();

  for (let newIndex = 0; newIndex < order.length; newIndex += 1) {
    oldIndexToNew.set(order[newIndex], newIndex);
  }

  return correctAnswer
    .map((token) => tokenToIndex(token, options))
    .filter((oldIndex) => oldIndex >= 0 && oldIndex < options.length)
    .map((oldIndex) => String(oldIndexToNew.get(oldIndex)));
}

function randomizeCompositeSubtask(task: CompositeSubtask, seedKey: string): CompositeSubtask {
  if (task.type === "single_select") {
    if (!Array.isArray(task.options) || task.options.length < 2) {
      return task;
    }

    const order = buildOrder(task.options.length, seedKey);

    return {
      ...task,
      options: reorderList(task.options, order)
    };
  }

  if (!Array.isArray(task.rightOptions) || task.rightOptions.length < 2) {
    return task;
  }

  const order = buildOrder(task.rightOptions.length, seedKey);

  return {
    ...task,
    rightOptions: reorderList(task.rightOptions, order)
  };
}

function randomizeCompositeQuestion(
  question: PracticalTaskQuestion | LogicReasoningQuestion,
  seedKey: string
) {
  return {
    ...question,
    subtasks: question.subtasks.map((task, index) =>
      randomizeCompositeSubtask(task, `${seedKey}|subtask:${task.id}|${index}`)
    )
  };
}

function randomizeStandardQuestion(question: Question, seedKey: string): Question {
  switch (question.format) {
    case "matching": {
      if (!Array.isArray(question.rightItems) || question.rightItems.length < 2) {
        return question;
      }

      const order = buildOrder(question.rightItems.length, seedKey);

      return {
        ...question,
        rightItems: reorderList(question.rightItems, order)
      };
    }
    case "fill_blank_constrained": {
      if (!Array.isArray(question.choices) || question.choices.length < 2) {
        return question;
      }

      const order = buildOrder(question.choices.length, seedKey);

      return {
        ...question,
        choices: reorderList(question.choices, order)
      };
    }
    case "single_select":
    case "multi_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage": {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        return question;
      }

      const order = buildOrder(question.options.length, seedKey);

      return {
        ...question,
        options: reorderList(question.options, order),
        correctAnswer: remapCorrectAnswers(question.correctAnswer, question.options, order)
      };
    }
    default:
      return question;
  }
}

export function randomizeExamQuestion(question: ExamQuestion, seedKey: string): ExamQuestion {
  if (question.format === "practical_task" || question.format === "logic_reasoning") {
    return randomizeCompositeQuestion(question, seedKey);
  }

  return randomizeStandardQuestion(question, seedKey);
}


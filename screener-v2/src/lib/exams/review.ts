import type {
  ExamBlueprint,
  ExamState,
  Question,
  ResultReviewItem,
  ResultReviewSection
} from "@/lib/assessment-engine/types";
import { scoreQuestion } from "@/lib/assessment-engine/scoring";
import type { LogicReasoningSubtask } from "@/features/logic-reasoning/packs";
import type { PracticalSubtask } from "@/features/practical/packs";

const reviewFormatLabels: Record<string, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  ordering: "Ordering",
  matching: "Matching",
  fill_blank_constrained: "Fill in the blank",
  log_analysis_single_select: "Log analysis",
  trace_execution: "Trace execution",
  best_next_step: "Best next step",
  case_triage: "Case triage"
};

function splitPrompt(prompt: string) {
  const normalized = String(prompt || "").replace(/\r\n/g, "\n").trim();
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines[0] || "Question";
  const body = normalized.startsWith(title) ? normalized.slice(title.length).trim() : normalized;

  return {
    title,
    prompt: body || undefined
  };
}

function tokenToIndex(token: string | number, options: string[]): number {
  if (Number.isInteger(token)) return Number(token);

  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;

  return options.findIndex((option) => option === value);
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
}

function toReviewStatus(
  pointsEarned: number,
  pointsPossible: number,
  answered: boolean
): ResultReviewItem["status"] {
  if (!answered) return "unanswered";
  if (pointsPossible > 0 && pointsEarned >= pointsPossible) return "correct";
  if (pointsEarned > 0) return "partial";
  return "incorrect";
}

function indexedOptionLabel(options: string[], token: string | number) {
  const index = tokenToIndex(token, options);
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  return String(token);
}

function indexedAnswerLines(options: string[], answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.map((token) => indexedOptionLabel(options, Number(token)));
  }
  if (answer === null || answer === undefined || String(answer).trim() === "") {
    return [];
  }
  return [indexedOptionLabel(options, Number(answer))];
}

function indexedExpectedLines(options: string[], expected: Array<string | number>) {
  return expected.map((token) => indexedOptionLabel(options, token));
}

function orderedItemLines(items: string[], order: unknown) {
  if (!Array.isArray(order)) return [];

  return order
    .map((token) => {
      const index = Number(token);
      return Number.isInteger(index) && index >= 0 && index < items.length ? items[index] : String(token);
    })
    .filter(Boolean);
}

function pairLines(
  leftItems: string[],
  mapping: Record<string, string>,
  resolve: (value: string) => string
) {
  return leftItems.map((left) => `${left} -> ${mapping[left] ? resolve(mapping[left]) : "No selection"}`);
}

function coreCandidateAnswerLines(question: Question, answer: unknown) {
  switch (question.format) {
    case "single_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage":
      return indexedAnswerLines(question.options ?? [], answer);
    case "multi_select":
      return indexedAnswerLines(question.options ?? [], answer);
    case "ordering":
      return orderedItemLines(question.items ?? [], answer);
    case "matching":
      return pairLines(
        question.leftItems ?? [],
        answer && typeof answer === "object" ? (answer as Record<string, string>) : {},
        (value) => value
      );
    case "fill_blank_constrained": {
      const value = Array.isArray(answer) ? String(answer[0] ?? "") : String(answer ?? "");
      return value.trim() ? [value] : [];
    }
    default:
      return [];
  }
}

function coreExpectedAnswerLines(question: Question) {
  switch (question.format) {
    case "single_select":
    case "best_next_step":
    case "log_analysis_single_select":
    case "trace_execution":
    case "case_triage":
    case "multi_select":
      return indexedExpectedLines(question.options ?? [], question.correctAnswer ?? []);
    case "ordering":
      return orderedItemLines(question.items ?? [], question.correctOrder ?? []);
    case "matching":
      return pairLines(question.leftItems ?? [], question.correctPairs ?? {}, (value) => value);
    case "fill_blank_constrained":
      return (question.acceptedAnswers ?? []).map(String);
    default:
      return [];
  }
}

function optionLabelById(options: Array<{ id: string; label: string }>, value: string) {
  return options.find((option) => option.id === value)?.label ?? value;
}

function practicalItem(task: PracticalSubtask, answer: unknown): ResultReviewItem {
  const pointsPossible = Number(task.points || 0);
  const answered = hasValue(answer);

  if (task.type === "single_select") {
    const selected = typeof answer === "string" ? answer : "";
    const correct = selected === task.expected;

    return {
      id: task.id,
      title: task.label,
      formatLabel: "Practical single select",
      pointsEarned: correct ? pointsPossible : 0,
      pointsPossible,
      status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
      candidateAnswerLines: selected ? [optionLabelById(task.options, selected)] : [],
      expectedAnswerLines: [optionLabelById(task.options, task.expected)]
    };
  }

  const mapping = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};
  const correct = task.leftItems.every(
    (left) => String(mapping[left] ?? "") === String(task.expected[left] ?? "")
  );

  return {
    id: task.id,
    title: task.label,
    formatLabel: "Practical matching",
    pointsEarned: correct ? pointsPossible : 0,
    pointsPossible,
    status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(
      task.leftItems,
      task.expected,
      (value) => optionLabelById(task.rightOptions, value)
    )
  };
}

function logicItem(task: LogicReasoningSubtask, answer: unknown): ResultReviewItem {
  const pointsPossible = Number(task.points || 0);
  const answered = hasValue(answer);

  if (task.type === "single_select") {
    const selected = typeof answer === "string" ? answer : "";
    const correct = selected === task.expected;

    return {
      id: task.id,
      title: task.label,
      promptBlocks: task.promptBlocks,
      formatLabel: "Logic single select",
      pointsEarned: correct ? pointsPossible : 0,
      pointsPossible,
      status: toReviewStatus(correct ? pointsPossible : 0, pointsPossible, answered),
      candidateAnswerLines: selected ? [optionLabelById(task.options, selected)] : [],
      expectedAnswerLines: [optionLabelById(task.options, task.expected)]
    };
  }

  const mapping = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};
  const expectedCount = Object.keys(task.expected).length || 1;
  const correctCount = Object.entries(task.expected).filter(([left, right]) => mapping[left] === right).length;
  const pointsEarned = Math.round(correctCount * (pointsPossible / expectedCount) * 100) / 100;

  return {
    id: task.id,
    title: task.label,
    promptBlocks: task.promptBlocks,
    formatLabel: "Logic matching",
    pointsEarned,
    pointsPossible,
    status: toReviewStatus(pointsEarned, pointsPossible, answered),
    candidateAnswerLines: pairLines(task.leftItems, mapping, (value) => optionLabelById(task.rightOptions, value)),
    expectedAnswerLines: pairLines(
      task.leftItems,
      task.expected,
      (value) => optionLabelById(task.rightOptions, value)
    )
  };
}

export function buildReviewSectionsFromBlueprint(
  blueprint: ExamBlueprint,
  examState: Partial<Record<string, Pick<ExamState, "answers">>> = {}
): ResultReviewSection[] {
  const sections: ResultReviewSection[] = [];

  for (const exam of [...blueprint.exams].sort((a, b) => a.order - b.order)) {
    const state = examState[exam.instanceId] ?? { answers: {} };

    const standardItems = exam.contentSnapshot.items.filter(
      (question): question is Question =>
        question.format !== "practical_task" && question.format !== "logic_reasoning"
    );

    if (standardItems.length === exam.contentSnapshot.items.length) {
      const items = standardItems.map((question) => {
        const answer = state.answers?.[question.id];
        const score = scoreQuestion(question, answer);
        const prompt = splitPrompt(question.prompt);

        return {
          id: question.id,
          title: prompt.title,
          prompt: prompt.prompt,
          promptBlocks: question.promptBlocks,
          logSnippet: "logSnippet" in question ? question.logSnippet : undefined,
          category: question.category,
          formatLabel: reviewFormatLabels[question.format] ?? question.format,
          pointsEarned: score.pointsEarned,
          pointsPossible: score.pointsPossible,
          status: toReviewStatus(score.pointsEarned, score.pointsPossible, hasValue(answer)),
          candidateAnswerLines: coreCandidateAnswerLines(question, answer),
          expectedAnswerLines: coreExpectedAnswerLines(question),
          explanation: question.explanation || undefined
        } satisfies ResultReviewItem;
      });

      sections.push({
        id: exam.instanceId,
        label: exam.label,
        configSummary: exam.configSummary,
        items
      });
      continue;
    }

    const composite = exam.contentSnapshot.items[0];
    if (!composite) continue;

    if (composite.format === "practical_task") {
      const compositeAnswer =
        state.answers?.[composite.id] && typeof state.answers?.[composite.id] === "object"
          ? (state.answers[composite.id] as Record<string, unknown>)
          : {};

      sections.push({
        id: exam.instanceId,
        label: exam.label,
        description: composite.prompt,
        configSummary: exam.configSummary,
        items: composite.subtasks.map((task) => practicalItem(task as PracticalSubtask, compositeAnswer[task.id]))
      });
      continue;
    }

    if (composite.format === "logic_reasoning") {
      const compositeAnswer =
        state.answers?.[composite.id] && typeof state.answers?.[composite.id] === "object"
          ? (state.answers[composite.id] as Record<string, unknown>)
          : {};

      sections.push({
        id: exam.instanceId,
        label: exam.label,
        description: composite.prompt,
        configSummary: exam.configSummary,
        items: composite.subtasks.map((task) => logicItem(task as LogicReasoningSubtask, compositeAnswer[task.id]))
      });
    }
  }

  return sections;
}

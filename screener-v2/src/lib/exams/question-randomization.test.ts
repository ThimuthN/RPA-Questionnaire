import { describe, expect, it } from "vitest";
import type {
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  Question
} from "@/lib/assessment-engine/types";
import { randomizeExamQuestion } from "@/lib/exams/question-randomization";

function tokenToIndex(token: string | number, options: string[]) {
  if (Number.isInteger(token)) return Number(token);

  const value = String(token).trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^[A-Za-z]$/.test(value)) return value.toUpperCase().charCodeAt(0) - 65;

  return options.findIndex((option) => option === value);
}

function findShuffledVariant<T>(factory: (seedKey: string) => T, readOrder: (value: T) => string[]) {
  const original = factory("control");
  const originalOrder = readOrder(original);

  for (const seedKey of ["alpha", "beta", "gamma", "delta", "epsilon"]) {
    const candidate = factory(seedKey);
    if (readOrder(candidate).join("|") !== originalOrder.join("|")) {
      return candidate;
    }
  }

  throw new Error("Expected at least one seed to produce a different order.");
}

describe("question randomization", () => {
  it("keeps the correct choice aligned after shuffling a single-select question", () => {
    const sourceQuestion = {
      id: "choice-q1",
      roleLevelMin: "Associate",
      roleLevelMax: null,
      techStack: "General",
      category: "Safety",
      difficulty: 3,
      format: "single_select",
      points: 1,
      scoringMethod: "all_or_nothing",
      prompt: "Pick the best action.",
      options: ["Retry", "Verify completion", "Escalate", "Ignore"],
      correctAnswer: ["B"],
      explanation: "Verify first.",
      rationale: "Replay safety."
    } satisfies Question;

    const randomized = findShuffledVariant(
      (seedKey) => randomizeExamQuestion(sourceQuestion, seedKey) as Question,
      (question) => question.options ?? []
    );

    const originalCorrect = sourceQuestion.options[tokenToIndex(sourceQuestion.correctAnswer[0], sourceQuestion.options)];
    const randomizedCorrect =
      randomized.options?.[tokenToIndex(randomized.correctAnswer[0], randomized.options ?? [])];

    expect(randomized.options).not.toEqual(sourceQuestion.options);
    expect(randomizedCorrect).toBe(originalCorrect);
  });

  it("shuffles fill-blank choices without changing accepted answers", () => {
    const sourceQuestion = {
      id: "fill-q1",
      roleLevelMin: "Associate",
      roleLevelMax: null,
      techStack: "General",
      category: "Requirements",
      difficulty: 2,
      format: "fill_blank_constrained",
      points: 1,
      scoringMethod: "partial_by_blank",
      prompt: "A criterion should be measurable and ____.",
      blank: "Select the missing word.",
      choices: ["repeatable", "popular", "broad", "aspirational"],
      acceptedAnswers: ["repeatable"],
      explanation: "Repeatable is testable.",
      rationale: "Requirement quality."
    } satisfies Question;

    const randomized = findShuffledVariant(
      (seedKey) => randomizeExamQuestion(sourceQuestion, seedKey) as Question,
      (question) => question.choices ?? []
    );

    expect(randomized.choices).not.toEqual(sourceQuestion.choices);
    expect(randomized.acceptedAnswers).toEqual(sourceQuestion.acceptedAnswers);
  });

  it("shuffles matching choices in standard questions and composite subtasks", () => {
    const matchingQuestion = {
      id: "match-q1",
      roleLevelMin: "Associate",
      roleLevelMax: null,
      techStack: "General",
      category: "Controls",
      difficulty: 3,
      format: "matching",
      points: 1,
      scoringMethod: "partial_pairs_with_penalty",
      prompt: "Match each risk to the best control.",
      leftItems: ["File may still be writing", "Grid row order changes"],
      rightItems: ["Readiness signal", "Stable business-key locator", "Extra sleep"],
      correctPairs: {
        "File may still be writing": "Readiness signal",
        "Grid row order changes": "Stable business-key locator"
      },
      explanation: "Choose the strongest control.",
      rationale: "Operational design."
    } satisfies Question;

    const practicalQuestion = {
      id: "practical-q1",
      format: "practical_task",
      prompt: "Complete the recovery design.",
      points: 2,
      subtasks: [
        {
          id: "task-1",
          type: "single_select",
          label: "Best first action",
          points: 1,
          expected: "verify",
          options: [
            { id: "retry", label: "Retry immediately" },
            { id: "verify", label: "Verify completion first" },
            { id: "skip", label: "Skip the item" }
          ]
        },
        {
          id: "task-2",
          type: "matching",
          label: "Map each issue",
          points: 1,
          leftItems: ["Timeout after submit"],
          rightOptions: [
            { id: "uncertain", label: "Completion uncertain" },
            { id: "business", label: "Business exception" },
            { id: "retriable", label: "Retriable technical failure" }
          ],
          expected: {
            "Timeout after submit": "uncertain"
          }
        }
      ]
    } satisfies PracticalTaskQuestion;

    const randomizedMatching = findShuffledVariant(
      (seedKey) => randomizeExamQuestion(matchingQuestion, seedKey) as Question,
      (question) => question.rightItems ?? []
    );
    const randomizedPractical = findShuffledVariant(
      (seedKey) => randomizeExamQuestion(practicalQuestion, seedKey) as PracticalTaskQuestion,
      (question) => [
        ...((question.subtasks[0]?.type === "single_select" ? question.subtasks[0].options : []) ?? []).map(
          (option) => option.id
        ),
        ...((question.subtasks[1]?.type === "matching" ? question.subtasks[1].rightOptions : []) ?? []).map(
          (option) => option.id
        )
      ]
    );

    expect(randomizedMatching.rightItems).not.toEqual(matchingQuestion.rightItems);
    expect(new Set(randomizedMatching.rightItems ?? [])).toEqual(new Set(matchingQuestion.rightItems));

    const randomizedSingleSubtask =
      randomizedPractical.subtasks[0]?.type === "single_select" ? randomizedPractical.subtasks[0] : null;
    const randomizedMatchingSubtask =
      randomizedPractical.subtasks[1]?.type === "matching" ? randomizedPractical.subtasks[1] : null;

    expect(randomizedSingleSubtask?.options.map((option) => option.id)).not.toEqual(
      practicalQuestion.subtasks[0].type === "single_select"
        ? practicalQuestion.subtasks[0].options.map((option) => option.id)
        : []
    );
    expect(randomizedMatchingSubtask?.rightOptions.map((option) => option.id)).not.toEqual(
      practicalQuestion.subtasks[1].type === "matching"
        ? practicalQuestion.subtasks[1].rightOptions.map((option) => option.id)
        : []
    );
  });

  it("shuffles logic single-select subtasks without changing expected ids", () => {
    const logicQuestion = {
      id: "logic-q1",
      format: "logic_reasoning",
      prompt: "Choose the safest diagnosis.",
      points: 1,
      subtasks: [
        {
          id: "logic-task-1",
          type: "single_select",
          label: "Most likely cause",
          points: 1,
          expected: "overlay",
          options: [
            { id: "locator", label: "Wrong locator" },
            { id: "overlay", label: "Blocking overlay" },
            { id: "session", label: "Session expired" }
          ]
        }
      ]
    } satisfies LogicReasoningQuestion;

    const randomized = findShuffledVariant(
      (seedKey) => randomizeExamQuestion(logicQuestion, seedKey) as LogicReasoningQuestion,
      (question) =>
        question.subtasks[0]?.type === "single_select"
          ? question.subtasks[0].options.map((option) => option.id)
          : []
    );

    const randomizedSubtask = randomized.subtasks[0]?.type === "single_select" ? randomized.subtasks[0] : null;

    expect(randomizedSubtask?.options.map((option) => option.id)).not.toEqual(
      logicQuestion.subtasks[0].type === "single_select"
        ? logicQuestion.subtasks[0].options.map((option) => option.id)
        : []
    );
    expect(randomizedSubtask?.expected).toBe("overlay");
  });
});


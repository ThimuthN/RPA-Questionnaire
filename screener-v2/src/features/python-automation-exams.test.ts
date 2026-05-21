import type { Question } from "@/lib/assessment-engine/types";
import { associateSePythonExamAddonDefinition } from "@/features/associate-se-python-exam/definition";
import { buildAssociateSePythonExamQuestions } from "@/features/associate-se-python-exam/questions";
import { sePythonExamAddonDefinition } from "@/features/se-python-exam/definition";
import { buildSePythonExamQuestions } from "@/features/se-python-exam/questions";
import { describe, expect, it } from "vitest";

function formatCounts(questions: Question[]) {
  return questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.format] = (counts[question.format] ?? 0) + 1;
    return counts;
  }, {});
}

function expectChoiceQuestionsToBeValid(questions: Question[]) {
  for (const question of questions) {
    expect(question.points).toBe(1);
    expect(question.prompt.trim().length).toBeGreaterThan(0);
    expect(question.explanation.trim().length).toBeGreaterThan(0);
    expect(question.rationale.trim().length).toBeGreaterThan(0);

    expect("options" in question).toBe(true);
    if (!("options" in question)) {
      continue;
    }

    expect(question.options.length).toBeGreaterThanOrEqual(4);
    expect(question.options.every((option) => option.trim().length > 0)).toBe(true);
    expect(question.correctAnswer.length).toBeGreaterThan(0);
    expect(question.correctAnswer.every((answer) => question.options.includes(answer))).toBe(true);
  }
}

describe("python automation exam add-ons", () => {
  it("exposes the requested Associate SE Python Exam catalog row", () => {
    expect(associateSePythonExamAddonDefinition.label).toBe("Associate SE Python Exam");
    expect(associateSePythonExamAddonDefinition.libraryEntries).toEqual([
      expect.objectContaining({
        seedKey: "addon-associate-se-python-exam-default",
        slug: "associate-se-python-exam",
        label: "Associate SE Python Exam",
        defaultDurationMinutes: 30,
        defaultRequiredPercent: 60,
        sortOrder: 8
      })
    ]);
  });

  it("keeps the Associate SE paper aligned with the source HTML exam", () => {
    const questions = buildAssociateSePythonExamQuestions();

    expect(questions).toHaveLength(12);
    expect(new Set(questions.map((question) => question.id)).size).toBe(12);
    expect(formatCounts(questions)).toEqual({
      single_select: 9,
      multi_select: 3
    });
    expectChoiceQuestionsToBeValid(questions);
  });

  it("exposes the requested SE Python Exam catalog row", () => {
    expect(sePythonExamAddonDefinition.label).toBe("SE Python Exam");
    expect(sePythonExamAddonDefinition.libraryEntries).toEqual([
      expect.objectContaining({
        seedKey: "addon-se-python-exam-default",
        slug: "se-python-exam",
        label: "SE Python Exam",
        defaultDurationMinutes: 30,
        defaultRequiredPercent: 60,
        sortOrder: 9
      })
    ]);
  });

  it("keeps the SE paper aligned with the source HTML exam", () => {
    const questions = buildSePythonExamQuestions();

    expect(questions).toHaveLength(15);
    expect(new Set(questions.map((question) => question.id)).size).toBe(15);
    expect(formatCounts(questions)).toEqual({
      single_select: 11,
      multi_select: 4
    });
    expectChoiceQuestionsToBeValid(questions);
  });
});

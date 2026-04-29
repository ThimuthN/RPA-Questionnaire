import { describe, expect, it } from "vitest";
import { buildPythonRpaScreenerQuestions } from "@/features/python-rpa-screener/questions";

describe("python rpa screener question sets", () => {
  it("builds a 21-question senior paper with unique ids", () => {
    const questions = buildPythonRpaScreenerQuestions("Senior");

    expect(questions).toHaveLength(21);
    expect(new Set(questions.map((question) => question.id)).size).toBe(21);
  });

  it("builds a 31-question lead paper with unique ids", () => {
    const questions = buildPythonRpaScreenerQuestions("Lead");

    expect(questions).toHaveLength(31);
    expect(new Set(questions.map((question) => question.id)).size).toBe(31);
  });

  it("keeps the senior paper aligned with the authored workbook format mix", () => {
    const questions = buildPythonRpaScreenerQuestions("Senior");
    const formatCounts = Object.fromEntries(
      Object.entries(
        questions.reduce<Record<string, number>>((counts, question) => {
          counts[question.format] = (counts[question.format] ?? 0) + 1;
          return counts;
        }, {})
      ).sort(([left], [right]) => left.localeCompare(right))
    );

    expect(formatCounts).toEqual({
      log_analysis_single_select: 2,
      matching: 3,
      multi_select: 2,
      ordering: 2,
      single_select: 12
    });
  });

  it("keeps the lead paper aligned with the authored workbook format mix", () => {
    const questions = buildPythonRpaScreenerQuestions("Lead");
    const formatCounts = Object.fromEntries(
      Object.entries(
        questions.reduce<Record<string, number>>((counts, question) => {
          counts[question.format] = (counts[question.format] ?? 0) + 1;
          return counts;
        }, {})
      ).sort(([left], [right]) => left.localeCompare(right))
    );

    expect(formatCounts).toEqual({
      log_analysis_single_select: 1,
      matching: 2,
      multi_select: 2,
      ordering: 2,
      single_select: 24
    });
  });

  it("keeps both papers fully authored with no empty prompts or explanations", () => {
    for (const level of ["Senior", "Lead"] as const) {
      const questions = buildPythonRpaScreenerQuestions(level);

      for (const question of questions) {
        expect(question.prompt.trim().length).toBeGreaterThan(0);
        expect(question.explanation.trim().length).toBeGreaterThan(0);
        expect(question.rationale.trim().length).toBeGreaterThan(0);

        if ("options" in question) {
          expect(question.options.every((option) => option.trim().length > 0)).toBe(true);
          expect(question.correctAnswer.length).toBeGreaterThan(0);
        }

        if ("items" in question) {
          expect(question.items.every((item) => item.trim().length > 0)).toBe(true);
          expect(question.correctOrder).toHaveLength(question.items.length);
        }

        if ("leftItems" in question) {
          expect(question.leftItems.every((item) => item.trim().length > 0)).toBe(true);
          expect(question.rightItems.every((item) => item.trim().length > 0)).toBe(true);
          expect(Object.keys(question.correctPairs)).toHaveLength(question.leftItems.length);
        }
      }
    }
  });
});

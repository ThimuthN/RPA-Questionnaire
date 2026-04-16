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
});

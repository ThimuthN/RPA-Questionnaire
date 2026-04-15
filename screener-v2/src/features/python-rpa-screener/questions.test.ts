import { describe, expect, it } from "vitest";
import { buildPythonRpaScreenerQuestions } from "@/features/python-rpa-screener/questions";

describe("python rpa screener question sets", () => {
  it("builds an 18-question senior paper with unique ids", () => {
    const questions = buildPythonRpaScreenerQuestions("Senior");

    expect(questions).toHaveLength(18);
    expect(new Set(questions.map((question) => question.id)).size).toBe(18);
  });

  it("builds a 25-question lead paper with unique ids", () => {
    const questions = buildPythonRpaScreenerQuestions("Lead");

    expect(questions).toHaveLength(25);
    expect(new Set(questions.map((question) => question.id)).size).toBe(25);
  });
});


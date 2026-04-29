import { describe, expect, it } from "vitest";
import { buildPythonRpaScreenerQuestions } from "@/features/python-rpa-screener/questions";
import { buildSeniorPythonExamQuestions } from "@/features/python-senior-exam/questions";

describe("senior python exam question set", () => {
  it("builds a 21-question paper with unique exam-specific ids", () => {
    const questions = buildSeniorPythonExamQuestions();

    expect(questions).toHaveLength(21);
    expect(new Set(questions.map((question) => question.id)).size).toBe(21);
    expect(questions.every((question) => question.id.startsWith("senior_python_exam_q"))).toBe(true);
  });

  it("keeps the same authored content as the senior workbook-backed screener", () => {
    const examQuestions = buildSeniorPythonExamQuestions();
    const screenerQuestions = buildPythonRpaScreenerQuestions("Senior");

    expect(examQuestions.map(({ id: _id, ...question }) => question)).toEqual(
      screenerQuestions.map(({ id: _id, ...question }) => question)
    );
  });
});

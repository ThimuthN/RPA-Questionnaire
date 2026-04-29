import { describe, expect, it } from "vitest";
import { buildPythonRpaScreenerQuestions } from "@/features/python-rpa-screener/questions";
import { buildLeadPythonExamQuestions } from "@/features/python-lead-exam/questions";

describe("lead python exam question set", () => {
  it("builds a 31-question paper with unique exam-specific ids", () => {
    const questions = buildLeadPythonExamQuestions();

    expect(questions).toHaveLength(31);
    expect(new Set(questions.map((question) => question.id)).size).toBe(31);
    expect(questions.every((question) => question.id.startsWith("lead_python_exam_q"))).toBe(true);
  });

  it("keeps the same authored content as the lead workbook-backed screener", () => {
    const examQuestions = buildLeadPythonExamQuestions();
    const screenerQuestions = buildPythonRpaScreenerQuestions("Lead");

    expect(examQuestions.map(({ id: _id, ...question }) => question)).toEqual(
      screenerQuestions.map(({ id: _id, ...question }) => question)
    );
  });
});

import type { Question } from "@/lib/assessment-engine/types";
import { buildPythonRpaScreenerQuestions } from "@/features/python-rpa-screener/questions";

function cloneQuestionBankWithPrefix(prefix: string, questions: Question[]) {
  return structuredClone(questions).map((question, index) => ({
    ...question,
    id: `${prefix}_q${String(index + 1).padStart(2, "0")}`
  }));
}

export function buildLeadPythonExamQuestions(): Question[] {
  return cloneQuestionBankWithPrefix("lead_python_exam", buildPythonRpaScreenerQuestions("Lead"));
}

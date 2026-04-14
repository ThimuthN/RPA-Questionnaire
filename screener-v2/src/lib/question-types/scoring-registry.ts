import type { Question } from "@/lib/assessment-engine/types";
import type { QuestionAutoScorer } from "@/lib/question-types/auto-scorers";
import { questionRegistry } from "@/lib/question-types";

export const questionScoringRegistry = Object.fromEntries(
  Object.values(questionRegistry)
    .filter((definition) => definition.autoScorer)
    .map((definition) => [definition.type, definition.autoScorer])
) as Partial<Record<Question["format"], QuestionAutoScorer<any, any>>>;

export const autoScoredQuestionFormatIds = Object.keys(questionScoringRegistry).sort() as Question["format"][];

export function getQuestionScorer(format: unknown) {
  const formatKey = String(format || "") as Question["format"];
  return questionScoringRegistry[formatKey] ?? null;
}

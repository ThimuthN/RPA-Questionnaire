import { describe, expect, it } from "vitest";
import { buildImageAnalysisQuestions } from "@/features/image-analysis/questions";

describe("image analysis question set", () => {
  it("builds a set of unique questions and only renders diagrams for the scanned items", () => {
    const questions = buildImageAnalysisQuestions();
    const diagramQuestionIds = new Set([
      "ba_iq_01",
      "ba_iq_02",
      "ba_iq_05",
      "ba_iq_06",
      "ba_iq_07",
      "ba_iq_09",
      "ba_iq_10",
      "ba_iq_24",
      "ba_iq_25",
      "ba_iq_26",
      "ba_iq_27",
      "ba_iq_28",
      "ba_iq_29",
      "ba_iq_30"
    ]);

    expect(questions).toHaveLength(30);
    expect(new Set(questions.map((question) => question.id)).size).toBe(30);
    expect(questions.filter((question) => question.promptBlocks?.some((block) => block.type === "image")).length).toBe(diagramQuestionIds.size);
    expect(
      questions
        .filter((question) => diagramQuestionIds.has(question.id))
        .every((question) => question.promptBlocks?.some((block) => block.type === "image"))
    ).toBe(true);
    expect(
      questions
        .filter((question) => !diagramQuestionIds.has(question.id))
        .every((question) => !question.promptBlocks?.some((block) => block.type === "image"))
    ).toBe(true);
  });
});

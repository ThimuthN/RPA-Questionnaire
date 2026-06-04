import { describe, expect, it } from "vitest";
import { runtimeQuestionFormatIds } from "@/components/runtime/renderers/registry";
import {
  formatAliasMap,
  questionRegistry,
  registeredQuestionFormatIds
} from "@/lib/question-types";
import {
  autoScoredQuestionFormatIds,
  questionScoringRegistry
} from "@/lib/question-types/scoring-registry";

describe("question format support consistency", () => {
  it("keeps question definitions and runtime renderer support in sync", () => {
    expect(runtimeQuestionFormatIds).toEqual(registeredQuestionFormatIds);
  });

  it("keeps auto-scored formats as a strict subset of registered formats", () => {
    expect(autoScoredQuestionFormatIds.every((format) => registeredQuestionFormatIds.includes(format))).toBe(true);
    // Formats that use custom scoring via def.score() rather than the auto-scorer registry:
    const customScoredFormats = ["logic_reasoning", "practical_task", "questionnaire_form"];
    expect(autoScoredQuestionFormatIds).toEqual(
      registeredQuestionFormatIds.filter((format) => !customScoredFormats.includes(format))
    );
  });

  it("keeps format aliases pointing only to registered formats", () => {
    for (const targetFormat of Object.values(formatAliasMap)) {
      expect(registeredQuestionFormatIds.includes(targetFormat)).toBe(true);
      expect(questionRegistry[targetFormat]).toBeTruthy();
    }
  });

  it("keeps scoring and runtime registries aligned to the same registered ids", () => {
    expect(Object.keys(questionScoringRegistry).every((format) => registeredQuestionFormatIds.includes(format as never))).toBe(true);
  });
});

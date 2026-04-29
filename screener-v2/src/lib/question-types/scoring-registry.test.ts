import { describe, expect, it } from "vitest";
import { getQuestionScorer, questionScoringRegistry } from "@/lib/question-types/scoring-registry";

describe("question scoring registry", () => {
  it("returns scorers for supported formats", () => {
    expect(getQuestionScorer("single_select")).toBeTypeOf("function");
    expect(getQuestionScorer("matching")).toBeTypeOf("function");
  });

  it("returns null for unsupported formats", () => {
    expect(getQuestionScorer("imaginary_format")).toBeNull();
  });

  it("keeps scorers registered for every supported auto-scored question format", () => {
    expect(Object.keys(questionScoringRegistry).sort()).toEqual([
      "best_next_step",
      "case_triage",
      "code_review",
      "fill_blank_constrained",
      "log_analysis_single_select",
      "matching",
      "multi_select",
      "ordering",
      "scenario_mapping",
      "single_select",
      "trace_execution"
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { buildRpaRuntimeQuestions } from "@/features/rpa-runtime/questions";

describe("rpa runtime question sets", () => {
  it("builds a 24-question senior paper with unique ids", () => {
    const questions = buildRpaRuntimeQuestions("Senior");

    expect(questions).toHaveLength(24);
    expect(new Set(questions.map((question) => question.id)).size).toBe(24);
  });

  it("builds a 24-question lead paper with unique ids", () => {
    const questions = buildRpaRuntimeQuestions("Lead");

    expect(questions).toHaveLength(24);
    expect(new Set(questions.map((question) => question.id)).size).toBe(24);
  });

  it("keeps the shared runtime safety base in both papers", () => {
    const seniorIds = new Set(buildRpaRuntimeQuestions("Senior").map((question) => question.id));
    const leadIds = new Set(buildRpaRuntimeQuestions("Lead").map((question) => question.id));

    for (const sharedId of [
      "rpa_runtime_base_q1",
      "rpa_runtime_base_q3",
      "rpa_runtime_base_q5",
      "rpa_runtime_base_q8",
      "rpa_runtime_base_q11",
      "rpa_runtime_base_q12"
    ]) {
      expect(seniorIds.has(sharedId)).toBe(true);
      expect(leadIds.has(sharedId)).toBe(true);
    }
  });
});

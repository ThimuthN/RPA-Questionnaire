import { describe, expect, it } from "vitest";
import { scoreQuestion } from "@/lib/question-types/scoring";

describe("core question scoring", () => {
  it("scores single select by option index", () => {
    const result = scoreQuestion(
      {
        id: "q1",
        roleLevelMin: "Associate",
        roleLevelMax: null,
        techStack: "General",
        category: "Core",
        difficulty: 2,
        format: "single_select",
        points: 2,
        scoringMethod: "all_or_nothing",
        prompt: "Pick one",
        explanation: "",
        rationale: "",
        options: ["A", "B", "C"],
        correctAnswer: ["1"]
      } as never,
      1
    );

    expect(result.pointsEarned).toBe(2);
    expect(result.normalized).toBe(1);
  });

  it("applies partial-with-penalty for multi select", () => {
    const result = scoreQuestion(
      {
        id: "q2",
        roleLevelMin: "Associate",
        roleLevelMax: null,
        techStack: "General",
        category: "Core",
        difficulty: 3,
        format: "multi_select",
        points: 4,
        scoringMethod: "partial_with_penalty",
        prompt: "Pick all",
        explanation: "",
        rationale: "",
        options: ["A", "B", "C", "D"],
        correctAnswer: ["0", "1", "3"]
      } as never,
      [0, 1, 2]
    );

    expect(result.normalized).toBeCloseTo(0.33, 2);
    expect(result.pointsEarned).toBeCloseTo(1.33, 2);
  });

  it("scores matching proportionally with penalty", () => {
    const result = scoreQuestion(
      {
        id: "q3",
        roleLevelMin: "Associate",
        roleLevelMax: null,
        techStack: "General",
        category: "Core",
        difficulty: 3,
        format: "matching",
        points: 6,
        scoringMethod: "partial_pairs_with_penalty",
        prompt: "Match",
        explanation: "",
        rationale: "",
        leftItems: ["A", "B", "C"],
        rightItems: ["X", "Y", "Z"],
        correctPairs: { A: "X", B: "Y", C: "Z" }
      } as never,
      { A: "X", B: "wrong", C: "Z" }
    );

    expect(result.normalized).toBeCloseTo(0.33, 2);
    expect(result.pointsEarned).toBeCloseTo(2, 2);
  });
});

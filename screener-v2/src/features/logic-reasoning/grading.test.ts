import { describe, expect, it } from "vitest";
import {
  scoreLogicReasoningQuestion,
  validateLogicReasoningAnswer
} from "@/features/logic-reasoning/grading";

describe("logic reasoning grading", () => {
  it("requires every matching left item to be answered", () => {
    const question = {
      id: "logic-pack",
      prompt: "Test",
      points: 5,
      subtasks: [
        {
          id: "match-1",
          type: "matching" as const,
          label: "Map items",
          points: 5,
          leftItems: ["A", "B", "C"],
          rightOptions: [
            { id: "x", label: "X" },
            { id: "y", label: "Y" },
            { id: "z", label: "Z" }
          ],
          expected: { A: "x", B: "y", C: "z" }
        }
      ]
    };

    expect(validateLogicReasoningAnswer(question, { "match-1": { A: "x", B: "y" } })).toBe(false);
    expect(
      validateLogicReasoningAnswer(question, { "match-1": { A: "x", B: "y", C: "z" } })
    ).toBe(true);
  });

  it("awards proportional matching credit without integer rounding drift", () => {
    const question = {
      id: "logic-pack",
      prompt: "Test",
      points: 5,
      subtasks: [
        {
          id: "match-1",
          type: "matching" as const,
          label: "Map items",
          points: 5,
          leftItems: ["A", "B", "C"],
          rightOptions: [
            { id: "x", label: "X" },
            { id: "y", label: "Y" },
            { id: "z", label: "Z" }
          ],
          expected: { A: "x", B: "y", C: "z" }
        }
      ]
    };

    const score = scoreLogicReasoningQuestion(question, {
      "match-1": { A: "x", B: "y", C: "wrong" }
    });

    expect(score.possible).toBe(5);
    expect(score.earned).toBe(3.33);
  });
});

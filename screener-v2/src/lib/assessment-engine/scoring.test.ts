import { describe, expect, it } from "vitest";
import { buildResultSummary } from "@/lib/assessment-engine/scoring";

describe("buildResultSummary", () => {
  it("fails when a required exam gate is missed even if the weighted score passes", () => {
    const summary = buildResultSummary({
      attemptId: "attempt-1",
      roleId: "Associate",
      stacks: ["UiPath"],
      passTargetPercent: 60,
      blueprint: {
        exams: [
          {
            instanceId: "core_exam_1",
            definitionId: "core_exam",
            legacySectionId: "core",
            label: "Core",
            configSummary: "Core round",
            durationMinutes: 20,
            weight: 90,
            requiredPercent: 60,
            order: 0,
            contentSnapshot: {
              items: [
                {
                  id: "core-q1",
                  format: "single_select",
                  prompt: "Pick the best option",
                  points: 1,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "core"
                }
              ]
            }
          },
          {
            instanceId: "practical_exam_1",
            definitionId: "practical_exam",
            legacySectionId: "practical",
            label: "Practical",
            configSummary: "Scenario",
            durationMinutes: 10,
            weight: 10,
            requiredPercent: 50,
            order: 1,
            contentSnapshot: {
              items: [
                {
                  id: "prac-q1",
                  format: "single_select",
                  prompt: "Pick the safe option",
                  points: 1,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "practical"
                }
              ]
            }
          }
        ]
      } as never,
      examState: {
        core_exam_1: {
          answers: { "core-q1": 0 },
          remainingSeconds: 1200
        },
        practical_exam_1: {
          answers: { "prac-q1": 1 },
          remainingSeconds: 600
        }
      }
    });

    expect(summary.finalPercent).toBe(90);
    expect(summary.pass).toBe(false);
    expect(summary.examBreakdown.practical_exam_1.pass).toBe(false);
  });

  it("marks borderline results that land inside the review band", () => {
    const summary = buildResultSummary({
      attemptId: "attempt-2",
      roleId: "Associate",
      stacks: ["UiPath"],
      passTargetPercent: 60,
      blueprint: {
        exams: [
          {
            instanceId: "core_exam_1",
            definitionId: "core_exam",
            legacySectionId: "core",
            label: "Core",
            configSummary: "Core round",
            durationMinutes: 20,
            weight: 100,
            requiredPercent: 0,
            order: 0,
            contentSnapshot: {
              items: [
                {
                  id: "core-q1",
                  format: "single_select",
                  prompt: "Pick the best option",
                  points: 10,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "core"
                },
                {
                  id: "core-q2",
                  format: "single_select",
                  prompt: "Pick the best option",
                  points: 10,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "core"
                }
              ]
            }
          }
        ]
      } as never,
      examState: {
        core_exam_1: {
          answers: {
            "core-q1": 0,
            "core-q2": 1
          },
          remainingSeconds: 1200
        }
      }
    });

    expect(summary.finalPercent).toBe(50);
    expect(summary.pass).toBe(false);
    expect(summary.borderline).toBe(true);
  });

  it("computes weighted final score from exam weights rather than section completion counts", () => {
    const summary = buildResultSummary({
      attemptId: "attempt-3",
      roleId: "SeniorSE",
      stacks: ["UiPath", "Python"],
      passTargetPercent: 60,
      blueprint: {
        exams: [
          {
            instanceId: "core_exam_1",
            definitionId: "core_exam",
            legacySectionId: "core",
            label: "Core",
            configSummary: "Senior Software Engineer | UiPath, Python",
            durationMinutes: 30,
            weight: 50,
            requiredPercent: 60,
            order: 0,
            contentSnapshot: {
              items: [
                {
                  id: "core-q1",
                  format: "single_select",
                  prompt: "Pick",
                  points: 1,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "core"
                }
              ]
            }
          },
          {
            instanceId: "practical_exam_1",
            definitionId: "practical_exam",
            legacySectionId: "practical",
            label: "Practical",
            configSummary: "UiPath",
            durationMinutes: 10,
            weight: 30,
            requiredPercent: 60,
            order: 1,
            contentSnapshot: {
              items: [
                {
                  id: "prac-q1",
                  format: "single_select",
                  prompt: "Pick",
                  points: 1,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "practical"
                }
              ]
            }
          },
          {
            instanceId: "logic_exam_1",
            definitionId: "applied_logic_exam",
            legacySectionId: "applied_logic_reasoning",
            label: "Applied Logic & Reasoning",
            configSummary: "Standard set",
            durationMinutes: 10,
            weight: 20,
            requiredPercent: 60,
            order: 2,
            contentSnapshot: {
              items: [
                {
                  id: "logic-q1",
                  format: "single_select",
                  prompt: "Pick",
                  points: 5,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "logic"
                },
                {
                  id: "logic-q2",
                  format: "single_select",
                  prompt: "Pick",
                  points: 5,
                  options: ["A", "B"],
                  correctAnswer: ["0"],
                  category: "logic"
                }
              ]
            }
          }
        ]
      } as never,
      examState: {
        core_exam_1: {
          answers: { "core-q1": 0 },
          remainingSeconds: 1800
        },
        practical_exam_1: {
          answers: { "prac-q1": 0 },
          remainingSeconds: 600
        },
        logic_exam_1: {
          answers: { "logic-q1": 0, "logic-q2": 1 },
          remainingSeconds: 600
        }
      }
    });

    expect(summary.examBreakdown.core_exam_1.weightedMarksEarned).toBe(50);
    expect(summary.examBreakdown.practical_exam_1.weightedMarksEarned).toBe(30);
    expect(summary.examBreakdown.logic_exam_1.weightedMarksEarned).toBe(10);
    expect(summary.finalPercent).toBe(90);
  });
});

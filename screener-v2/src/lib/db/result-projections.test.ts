import { describe, expect, it } from "vitest";
import { toResultSummary } from "@/lib/db/result-projections";

describe("toResultSummary", () => {
  it("hydrates participant details and falls back to exam metadata when exam breakdown is absent", () => {
    const summary = toResultSummary(
      {
        attemptId: "attempt-1",
        corePercent: 80,
        practicalPercent: 60,
        finalPercent: 74,
        pass: true,
        borderline: false,
        breakdownJson: {
          sections: ["core", "practical"],
          exams: [],
          passPercent: 60,
          practicalMinPercent: 50,
          sectionBreakdown: {
            core: {
              label: "Core",
              pointsEarned: 48,
              pointsPossible: 60,
              percent: 80,
              requiredPercent: 60,
              pass: true
            },
            practical: {
              label: "Practical",
              pointsEarned: 12,
              pointsPossible: 20,
              percent: 60,
              requiredPercent: 50,
              pass: true
            }
          },
          examBreakdown: {},
          breakdownByCategory: {}
        }
      },
      {
        roleId: "Associate",
        stacks: ["UiPath"],
        sections: ["core", "practical"],
        blueprint: {
          exams: [
            {
              instanceId: "core_exam_1",
              definitionId: "core_exam",
              legacySectionId: "core",
              label: "Core",
              configSummary: "Core round",
              durationMinutes: 20,
              weight: 60,
              requiredPercent: 60,
              order: 0,
              contentSnapshot: { items: [] }
            },
            {
              instanceId: "practical_exam_1",
              definitionId: "practical_exam",
              legacySectionId: "practical",
              label: "Practical",
              configSummary: "Scenario",
              durationMinutes: 10,
              weight: 40,
              requiredPercent: 50,
              order: 1,
              contentSnapshot: { items: [] }
            }
          ]
        } as never,
        examState: {},
        integrity: {
          tabHiddenCount: 1,
          copyCount: 0,
          pasteCount: 0
        }
      },
      {
        fullName: "Alex Perera",
        email: "alex@example.com"
      }
    );

    expect(summary).not.toBeNull();
    expect(summary?.candidateName).toBe("Alex Perera");
    expect(summary?.candidateEmail).toBe("alex@example.com");
    expect(summary?.examBreakdown.core_exam_1.weightedMarksPossible).toBe(60);
    expect(summary?.examBreakdown.practical_exam_1.percent).toBe(60);
  });

  it("derives weighted marks from percent when legacy exam breakdown is missing weighted fields", () => {
    const summary = toResultSummary(
      {
        attemptId: "attempt-2",
        corePercent: 91.3,
        practicalPercent: 80,
        finalPercent: 73.7,
        pass: false,
        borderline: true,
        breakdownJson: {
          sections: ["core", "practical", "applied_logic_reasoning"],
          exams: [
            {
              instanceId: "core_exam_1",
              definitionId: "core_exam",
              legacySectionId: "core",
              label: "Core",
              configSummary: "Tech Lead",
              durationMinutes: 30,
              weight: 50,
              requiredPercent: 78,
              order: 0
            },
            {
              instanceId: "practical_exam_1",
              definitionId: "practical_exam",
              legacySectionId: "practical",
              label: "Practical",
              configSummary: "UiPath",
              durationMinutes: 10,
              weight: 30,
              requiredPercent: 78,
              order: 1
            },
            {
              instanceId: "logic_exam_1",
              definitionId: "applied_logic_exam",
              legacySectionId: "applied_logic_reasoning",
              label: "Applied Logic & Reasoning",
              configSummary: "Standard set",
              durationMinutes: 10,
              weight: 20,
              requiredPercent: 78,
              order: 2
            }
          ],
          passPercent: 78,
          practicalMinPercent: 78,
          sectionBreakdown: {
            core: {
              label: "Core",
              pointsEarned: 45.7,
              pointsPossible: 50,
              percent: 91.3,
              requiredPercent: 78,
              pass: true
            },
            practical: {
              label: "Practical",
              pointsEarned: 24,
              pointsPossible: 30,
              percent: 80,
              requiredPercent: 78,
              pass: true
            },
            applied_logic_reasoning: {
              label: "Applied Logic & Reasoning",
              pointsEarned: 4,
              pointsPossible: 20,
              percent: 20,
              requiredPercent: 78,
              pass: false
            }
          },
          examBreakdown: {
            core_exam_1: {
              percent: 91.3,
              pointsEarned: 21.9,
              pointsPossible: 24
            },
            practical_exam_1: {
              percent: 80,
              pointsEarned: 8,
              pointsPossible: 10
            },
            logic_exam_1: {
              percent: 20,
              pointsEarned: 2,
              pointsPossible: 10
            }
          },
          breakdownByCategory: {}
        }
      },
      {
        roleId: "TechLead",
        stacks: ["UiPath", "PowerAutomate"],
        sections: ["core", "practical", "applied_logic_reasoning"],
        blueprint: {
          exams: [
            {
              instanceId: "core_exam_1",
              definitionId: "core_exam",
              legacySectionId: "core",
              label: "Core",
              configSummary: "Tech Lead",
              durationMinutes: 30,
              weight: 50,
              requiredPercent: 78,
              order: 0,
              contentSnapshot: { items: [] }
            },
            {
              instanceId: "practical_exam_1",
              definitionId: "practical_exam",
              legacySectionId: "practical",
              label: "Practical",
              configSummary: "UiPath",
              durationMinutes: 10,
              weight: 30,
              requiredPercent: 78,
              order: 1,
              contentSnapshot: { items: [] }
            },
            {
              instanceId: "logic_exam_1",
              definitionId: "applied_logic_exam",
              legacySectionId: "applied_logic_reasoning",
              label: "Applied Logic & Reasoning",
              configSummary: "Standard set",
              durationMinutes: 10,
              weight: 20,
              requiredPercent: 78,
              order: 2,
              contentSnapshot: { items: [] }
            }
          ]
        } as never,
        examState: {},
        integrity: {
          tabHiddenCount: 0,
          copyCount: 0,
          pasteCount: 0
        }
      }
    );

    expect(summary?.examBreakdown.core_exam_1.weightedMarksEarned).toBe(45.7);
    expect(summary?.examBreakdown.practical_exam_1.weightedMarksEarned).toBe(24);
    expect(summary?.examBreakdown.logic_exam_1.weightedMarksEarned).toBe(4);
  });
});

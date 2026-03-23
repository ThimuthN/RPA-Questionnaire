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
});

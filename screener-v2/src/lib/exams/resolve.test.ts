import { describe, expect, it } from "vitest";
import { normalizeExamDrafts, resolveExamBlueprint } from "@/lib/exams/resolve";
import type { ExamDefinitionId } from "@/lib/exams/definitions";

const missingDefinitionId = "legacy_missing_definition" as ExamDefinitionId;

describe("exam blueprint resolution with missing definitions", () => {
  it("resolveExamBlueprint handles unknown definition ids without throwing", () => {
    const drafts = normalizeExamDrafts({
      exams: [
        {
          definitionId: missingDefinitionId,
          config: {},
          weight: 1
        }
      ],
      passPercent: 60
    });

    expect(() => {
      const blueprint = resolveExamBlueprint({
        drafts,
        passPercent: 60
      });
      expect(blueprint).toBeDefined();
      expect(blueprint.exams).toHaveLength(1);
      expect(blueprint.exams[0].label).toBe("Archived assessment");
    }).not.toThrow();
  });

  it("resolveExamBlueprint preserves archived assessment in blueprint", () => {
    const drafts = normalizeExamDrafts({
      exams: [
        {
          definitionId: missingDefinitionId,
          config: {},
          weight: 1
        }
      ],
      passPercent: 60
    });

    const blueprint = resolveExamBlueprint({
      drafts,
      passPercent: 60
    });

    const exam = blueprint.exams[0];
    expect(exam.definitionId).toBe(missingDefinitionId);
    expect(exam.label).toBe("Archived assessment");
    expect(exam.durationMinutes).toBe(60);
    expect(exam.requiredPercent).toBe(60);
    expect(exam.legacySectionId).toBeUndefined();
  });

  it("resolveExamBlueprint still works correctly with known definitions", () => {
    const drafts = normalizeExamDrafts({
      exams: [
        {
          definitionId: "core_exam" as ExamDefinitionId,
          config: { roleId: "Associate" },
          weight: 1
        }
      ],
      passPercent: 60
    });

    const blueprint = resolveExamBlueprint({
      drafts,
      passPercent: 60
    });

    const exam = blueprint.exams[0];
    expect(exam.definitionId).toBe("core_exam");
    expect(exam.label).not.toBe("Archived assessment");
    expect(exam.durationMinutes).toBeGreaterThan(0);
  });

  it("resolveExamBlueprint handles mixed known and unknown definitions", () => {
    const drafts = normalizeExamDrafts({
      exams: [
        {
          definitionId: "core_exam" as ExamDefinitionId,
          config: { roleId: "Associate" },
          weight: 1
        },
        {
          definitionId: missingDefinitionId,
          config: {},
          weight: 1
        },
        {
          definitionId: "practical_exam" as ExamDefinitionId,
          config: { stack: "UiPath" },
          weight: 1
        }
      ],
      passPercent: 60
    });

    const blueprint = resolveExamBlueprint({
      drafts,
      passPercent: 60
    });

    expect(blueprint.exams).toHaveLength(3);
    expect(blueprint.exams[0].label).not.toBe("Archived assessment");
    expect(blueprint.exams[1].label).toBe("Archived assessment");
    expect(blueprint.exams[2].label).not.toBe("Archived assessment");
  });
});

import { describe, expect, it } from "vitest";
import {
  carriesRoleContext,
  defaultDraftForDefinition,
  deriveExamSelectionMetadata,
  examPanelClass,
  examScoreBarClass,
  isCoreExamDefinition,
  isPracticalExamDefinition
} from "@/lib/exams/catalog";
import type { ExamDefinitionId } from "@/lib/exams/definitions";

const missingDefinitionId = "legacy_missing_definition" as ExamDefinitionId;

describe("exam catalog safe access for archived/missing definitions", () => {
  describe("catalog accessors with missing definition", () => {
    it("carriesRoleContext returns false and does not throw", () => {
      expect(carriesRoleContext(missingDefinitionId)).toBe(false);
    });

    it("isCoreExamDefinition returns false and does not throw", () => {
      expect(isCoreExamDefinition(missingDefinitionId)).toBe(false);
    });

    it("isPracticalExamDefinition returns false and does not throw", () => {
      expect(isPracticalExamDefinition(missingDefinitionId)).toBe(false);
    });

    it("examPanelClass returns safe default and does not throw", () => {
      const panelClass = examPanelClass(missingDefinitionId);
      expect(panelClass).toBe("border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]");
    });

    it("examScoreBarClass returns safe default and does not throw", () => {
      const scoreBarClass = examScoreBarClass(missingDefinitionId);
      expect(scoreBarClass).toBe("bg-[color:var(--app-brand)]");
    });
  });

  describe("draft generation with missing definition", () => {
    it("defaultDraftForDefinition returns safe fallback with original definition id", () => {
      const draft = defaultDraftForDefinition(missingDefinitionId);
      expect(draft.definitionId).toBe(missingDefinitionId);
      expect(draft.config).toEqual({});
      expect(draft.weight).toBe(1);
    });

    it("defaultDraftForDefinition returns known definition normally", () => {
      const draft = defaultDraftForDefinition("core_exam" as ExamDefinitionId);
      expect(draft.definitionId).toBe("core_exam");
      expect(draft.config).toBeDefined();
      expect(draft.weight).toBeGreaterThan(0);
    });
  });

  describe("metadata derivation with missing definition", () => {
    it("deriveExamSelectionMetadata returns safe archived label for missing definition", () => {
      const metadata = deriveExamSelectionMetadata(missingDefinitionId, {}, 60);
      expect(metadata.label).toBe("Archived assessment");
      expect(metadata.durationMinutes).toBe(60);
      expect(metadata.configSummary).toBe("");
      expect(metadata.requiredPercent).toBe(60);
      expect(metadata.legacySectionId).toBeUndefined();
    });

    it("deriveExamSelectionMetadata returns correct metadata for known definition", () => {
      const metadata = deriveExamSelectionMetadata("core_exam" as ExamDefinitionId, {}, 60);
      expect(metadata.label).toBeDefined();
      expect(metadata.durationMinutes).toBeGreaterThan(0);
      expect(typeof metadata.requiredPercent).toBe("number");
    });

    it("deriveExamSelectionMetadata respects passPercent for archived assessments", () => {
      const metadata75 = deriveExamSelectionMetadata(missingDefinitionId, {}, 75);
      expect(metadata75.requiredPercent).toBe(75);

      const metadata80 = deriveExamSelectionMetadata(missingDefinitionId, {}, 80);
      expect(metadata80.requiredPercent).toBe(80);
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  addonAssessmentTypeIdSchema,
  orderedAddonAssessmentTypes,
  assertAddonAssessmentTypeConfig,
  prepareAddonAssessmentTypeConfig,
  prepareAddonConfigForFields
} from "@/lib/addons/assessment-types";
import { buildDraftFromAddon, type AddonCatalogEntry } from "@/lib/addons/catalog";
import { resolveExamItems } from "@/lib/exams/server-registry";

describe("addon assessment types", () => {
  it("fills missing runtime config with defaults", () => {
    const config = assertAddonAssessmentTypeConfig("rpa_runtime_exam", {});
    expect(config).toEqual({ level: "Senior" });
  });

  it("rejects invalid runtime single-select config", () => {
    expect(() =>
      assertAddonAssessmentTypeConfig("rpa_runtime_exam", { level: "Manager" })
    ).toThrow(/invalid level/i);
  });

  it("accepts only registered add-on assessment types", () => {
    expect(() => addonAssessmentTypeIdSchema.parse("rpa_runtime_exam")).not.toThrow();
    expect(() => addonAssessmentTypeIdSchema.parse("python_rpa_screener_exam")).not.toThrow();
    expect(() => addonAssessmentTypeIdSchema.parse("imaginary_exam")).toThrow();
  });

  it("keeps the authored add-on assessment type order stable", () => {
    expect(orderedAddonAssessmentTypes.map((item) => item.id)).toEqual([
      "core_exam",
      "core_2_exam",
      "rpa_runtime_exam",
      "python_rpa_screener_exam",
      "practical_exam",
      "applied_logic_exam",
      "general_capability_exam",
      "business_analysis_exam",
      "rcm_exam"
    ]);
  });

  it("ensures every registered add-on assessment type resolves non-empty exam content", () => {
    for (const assessmentType of orderedAddonAssessmentTypes) {
      const items = resolveExamItems(assessmentType.id, assessmentType.defaultConfig);
      expect(items.length).toBeGreaterThan(0);
    }
  });

  it("normalizes multi-select config against allowed options while preserving other known defaults", () => {
    const result = prepareAddonAssessmentTypeConfig("core_exam", {
      roleId: "SE",
      stacks: ["UiPath", "Bogus", "Python", "UiPath"]
    });

    expect(result.messages).toEqual([]);
    expect(result.config).toMatchObject({
      roleId: "SE",
      roleLabel: "Associate",
      coreBasisRoleId: "Associate",
      stacks: ["UiPath", "Python"]
    });
  });

  it("normalizes draft config built from add-ons before it reaches the builder", () => {
    const addon: AddonCatalogEntry = {
      id: "addon-core",
      slug: "addon-core",
      label: "Core",
      description: "Core assessment",
      assessmentTypeId: "core_exam",
      defaultConfig: {
        roleId: "Associate",
        roleLabel: "Associate",
        coreBasisRoleId: "Associate",
        stacks: ["UiPath"]
      },
      defaultDurationMinutes: 30,
      defaultRequiredPercent: 60,
      defaultWeight: 50,
      isActive: true,
      sortOrder: 0
    };

    const draft = buildDraftFromAddon(addon, {
      configOverride: {
        stacks: ["UiPath", "Bogus", "Python", "UiPath"]
      }
    });

    expect(draft.config).toMatchObject({
      roleId: "Associate",
      roleLabel: "Associate",
      coreBasisRoleId: "Associate",
      stacks: ["UiPath", "Python"]
    });
  });

  it("supports text, number, and boolean config fields without needing a schema engine", () => {
    const result = prepareAddonConfigForFields(
      "Example Assessment",
      [
        {
          key: "promptPrefix",
          label: "Prompt prefix",
          type: "text",
          required: true,
          placeholder: "Enter a prefix"
        },
        {
          key: "questionCount",
          label: "Question count",
          type: "number",
          required: true,
          min: 1,
          max: 30
        },
        {
          key: "shuffleAnswers",
          label: "Shuffle answers",
          type: "boolean",
          required: false,
          trueLabel: "Shuffle enabled",
          falseLabel: "Shuffle disabled"
        }
      ],
      {
        promptPrefix: "Default",
        questionCount: 10,
        shuffleAnswers: false
      },
      {
        promptPrefix: "  Runtime  ",
        questionCount: "12",
        shuffleAnswers: "true"
      }
    );

    expect(result.messages).toEqual([]);
    expect(result.config).toEqual({
      promptPrefix: "Runtime",
      questionCount: 12,
      shuffleAnswers: true
    });
  });

  it("reports invalid number config cleanly", () => {
    const result = prepareAddonConfigForFields(
      "Example Assessment",
      [
        {
          key: "questionCount",
          label: "Question count",
          type: "number",
          required: true,
          min: 1,
          max: 30
        }
      ],
      {
        questionCount: 10
      },
      {
        questionCount: "bogus"
      }
    );

    expect(result.messages).toEqual(["Example Assessment has an invalid question count value."]);
  });
});

import { describe, expect, it } from "vitest";
import { addonAssessmentTypeIds } from "@/lib/addons/assessment-types";
import {
  addonDefinitionIds,
  addonDefinitionRegistry,
  orderedAddonDefinitions
} from "@/lib/addons/definitions";
import { examDefinitionIds } from "@/lib/exams/definitions";

describe("authored add-on definitions", () => {
  it("stay aligned with the derived exam definition ids", () => {
    expect(examDefinitionIds).toEqual(addonDefinitionIds);
  });

  it("stay aligned with the add-on assessment types exposed in the UI", () => {
    expect(addonAssessmentTypeIds).toEqual(addonDefinitionIds);
  });

  it("resolve non-empty content from each authored default config", () => {
    for (const definition of orderedAddonDefinitions) {
      expect(definition.resolveItems(structuredClone(definition.defaultConfig)).length).toBeGreaterThan(0);
      expect(addonDefinitionRegistry[definition.id]).toBe(definition);
    }
  });
});

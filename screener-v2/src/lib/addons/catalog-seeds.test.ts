import { addonCatalogSeeds } from "@/lib/addons/catalog-seeds";
import { addonAssessmentTypeIdSchema, assertAddonAssessmentTypeConfig } from "@/lib/addons/assessment-types";
import { describe, expect, it } from "vitest";

describe("addon catalog seeds", () => {
  it("keeps slug and sort order values unique", () => {
    const slugs = addonCatalogSeeds.map((seed) => seed.slug);
    const sortOrders = addonCatalogSeeds.map((seed) => seed.sortOrder);
    const seedKeys = addonCatalogSeeds.map((seed) => seed.seedKey);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
    expect(new Set(seedKeys).size).toBe(seedKeys.length);
  });

  it("uses only registered assessment types and valid default config", () => {
    for (const seed of addonCatalogSeeds) {
      expect(() => addonAssessmentTypeIdSchema.parse(seed.assessmentTypeId)).not.toThrow();
      expect(() => assertAddonAssessmentTypeConfig(seed.assessmentTypeId, seed.defaultConfig)).not.toThrow();
    }
  });
});

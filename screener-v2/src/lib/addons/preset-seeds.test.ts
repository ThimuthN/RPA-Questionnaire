import { addonCatalogSeeds } from "@/lib/addons/catalog-seeds";
import presetSeeds from "@/lib/addons/preset-seeds.json";
import { assertAddonAssessmentTypeConfig } from "@/lib/addons/assessment-types";
import { describe, expect, it } from "vitest";

describe("addon preset seeds", () => {
  it("keeps preset slug and sort order values unique", () => {
    const slugs = presetSeeds.map((seed) => seed.slug);
    const sortOrders = presetSeeds.map((seed) => seed.sortOrder);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
  });

  it("references only known seeded add-on slugs", () => {
    const addonSlugs = new Set(addonCatalogSeeds.map((seed) => seed.slug));

    for (const preset of presetSeeds) {
      for (const item of preset.items) {
        expect(addonSlugs.has(item.addonSlug)).toBe(true);
      }
    }
  });

  it("keeps seeded preset overrides valid for the referenced add-ons", () => {
    const addonBySlug = new Map(addonCatalogSeeds.map((seed) => [seed.slug, seed]));

    for (const preset of presetSeeds) {
      for (const item of preset.items) {
        const addon = addonBySlug.get(item.addonSlug);
        expect(addon).toBeTruthy();
        if (!addon) continue;

        expect(() =>
          assertAddonAssessmentTypeConfig(addon.assessmentTypeId, {
            ...addon.defaultConfig,
            ...(item.configOverride ?? {})
          })
        ).not.toThrow();

        if (typeof item.weightOverride === "number") {
          expect(item.weightOverride).toBeGreaterThanOrEqual(0);
          expect(item.weightOverride).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

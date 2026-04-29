import { describe, expect, it } from "vitest";
import { pythonRpaScreenerAddonDefinition } from "@/features/python-rpa-screener/definition";

describe("python rpa screener add-on definition", () => {
  it("keeps the shared screener available for compatibility but retires its library slugs", () => {
    expect(pythonRpaScreenerAddonDefinition.libraryEntries).toBeUndefined();
    expect(pythonRpaScreenerAddonDefinition.retiredLibrarySlugs).toEqual([
      "python-rpa-senior-screener",
      "python-rpa-lead-screener"
    ]);
  });

  it("derives the expected runtime config for both levels", () => {
    expect(pythonRpaScreenerAddonDefinition.buildDurationMinutes({ level: "Senior" })).toBe(30);
    expect(pythonRpaScreenerAddonDefinition.buildDurationMinutes({ level: "Lead" })).toBe(40);

    expect(pythonRpaScreenerAddonDefinition.buildRequiredPercent({ level: "Senior" }, 60)).toBe(65);
    expect(pythonRpaScreenerAddonDefinition.buildRequiredPercent({ level: "Lead" }, 60)).toBe(70);

    expect(pythonRpaScreenerAddonDefinition.buildConfigSummary({ level: "Senior" })).toContain("Senior");
    expect(pythonRpaScreenerAddonDefinition.buildConfigSummary({ level: "Lead" })).toContain("Lead");
  });
});

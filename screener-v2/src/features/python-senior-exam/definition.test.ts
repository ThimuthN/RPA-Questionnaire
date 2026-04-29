import { describe, expect, it } from "vitest";
import { pythonSeniorExamAddonDefinition } from "@/features/python-senior-exam/definition";

describe("senior python exam add-on definition", () => {
  it("exposes the requested library label and seeded entry", () => {
    expect(pythonSeniorExamAddonDefinition.label).toBe("Senior Python Exam");
    expect(pythonSeniorExamAddonDefinition.libraryEntries).toEqual([
      expect.objectContaining({
        seedKey: "addon-python-senior-exam-default",
        slug: "python-senior-exam",
        label: "Senior Python Exam",
        defaultDurationMinutes: 30,
        defaultRequiredPercent: 65
      })
    ]);
  });
});

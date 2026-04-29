import { describe, expect, it } from "vitest";
import { pythonLeadExamAddonDefinition } from "@/features/python-lead-exam/definition";

describe("lead python exam add-on definition", () => {
  it("exposes the requested library label and seeded entry", () => {
    expect(pythonLeadExamAddonDefinition.label).toBe("Lead Python Exam");
    expect(pythonLeadExamAddonDefinition.libraryEntries).toEqual([
      expect.objectContaining({
        seedKey: "addon-python-lead-exam-default",
        slug: "python-lead-exam",
        label: "Lead Python Exam",
        defaultDurationMinutes: 40,
        defaultRequiredPercent: 70
      })
    ]);
  });
});

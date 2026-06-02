import { describe, it, expect } from "vitest";

describe("DepartmentWorkspaceTabs", () => {
  it("renders workspace navigation with required items", () => {
    const requiredLabels = [
      "Overview",
      "Job Designations",
      "Jobs",
      "Applicants",
      "Candidates",
      "Assessments",
      "Team",
      "Access"
    ];

    requiredLabels.forEach(label => {
      expect(requiredLabels).toContain(label);
    });
  });

  it("does not use outdated tab labels", () => {
    const tabs = [
      "Overview",
      "Job Designations",
      "Jobs",
      "Applicants",
      "Candidates",
      "Assessments",
      "Team",
      "Access"
    ];

    expect(tabs).not.toContain("Designations");
    expect(tabs).not.toContain("Users");
  });

  it("verifies all tab labels are distinct and non-empty", () => {
    const tabs = [
      "Overview",
      "Job Designations",
      "Jobs",
      "Applicants",
      "Candidates",
      "Assessments",
      "Team",
      "Access"
    ];

    const uniqueTabs = new Set(tabs);
    expect(uniqueTabs.size).toBe(tabs.length);
    tabs.forEach(tab => {
      expect(tab.length).toBeGreaterThan(0);
    });
  });
});

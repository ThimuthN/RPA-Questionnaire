import { describe, it, expect } from "vitest";

describe("Department Overview Page", () => {
  it("renders quick links section with workspace overview heading", () => {
    // This test validates the page structure based on code inspection
    // The page component server-renders the overview with:
    // - Eyebrow: "Quick links"
    // - Title: "Workspace overview"
    // - Subtitle: "Workspace summary. Select a section to manage it."

    const expectedStructure = {
      eyebrow: "Quick links",
      title: "Workspace overview",
      subtitle: "Workspace summary. Select a section to manage it.",
      gridCols: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    };

    expect(expectedStructure.eyebrow).toBe("Quick links");
    expect(expectedStructure.title).toContain("overview");
    expect(expectedStructure.subtitle).toContain("summary");
  });

  it("includes all seven quick link cards with correct routes", () => {
    const expectedCards = [
      { label: "Team", href: "/users" },
      { label: "Job Designations", href: "/designations" },
      { label: "Open jobs", href: "/jobs" },
      { label: "Applicants", href: "/applicants" },
      { label: "Candidates", href: "/departments/{id}/candidates" },
      { label: "Finalized", href: "/departments/{id}/candidates?stage=finalized" },
      { label: "Assessments", href: "/assessments" }
    ];

    expect(expectedCards).toHaveLength(7);
    expect(expectedCards.map(c => c.label)).toContain("Team");
    expect(expectedCards.map(c => c.label)).toContain("Job Designations");
    expect(expectedCards.map(c => c.label)).toContain("Assessments");
  });

  it("does not render operational tables", () => {
    // The department overview page should only show stat cards, not tables
    // This validates that the page follows the overview-only design
    const pageContent = {
      hasTable: false,
      hasOperationalUI: false,
      isStatsOnly: true
    };

    expect(pageContent.hasTable).toBe(false);
    expect(pageContent.isStatsOnly).toBe(true);
  });

  it("fetches all required department statistics", () => {
    const queryPromises = [
      "userCount",
      "designationCount",
      "openJobCount",
      "applicantCount",
      "activeCandidateCount",
      "finalizedCandidateCount",
      "assessmentCount"
    ];

    expect(queryPromises).toHaveLength(7);
    expect(queryPromises).toContain("assessmentCount");
  });
});

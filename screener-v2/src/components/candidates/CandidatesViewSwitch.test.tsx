import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidatesViewSwitch } from "./CandidatesViewSwitch";

vi.mock("@/lib/db/candidates", () => ({
  getCandidateStageCounts: vi.fn().mockResolvedValue({
    applicant: 5,
    pipeline: 12,
    screening: 8,
    interview: 3,
    advanced_review: 2,
    finalized: 1
  })
}));

describe("CandidatesViewSwitch", () => {
  it("shows Jobs and Applicants items in global scope", async () => {
    const component = await CandidatesViewSwitch({
      current: "pipeline",
      scope: "global"
    });

    const html = renderToStaticMarkup(component);

    expect(html).toContain("Jobs");
    expect(html).toContain("Applicants");
    expect(html).toContain("Pipeline");
    expect(html).toContain("Screening");
  });

  it("shows Applicants but not Jobs in department scope", async () => {
    const component = await CandidatesViewSwitch({
      current: "pipeline",
      scope: "department",
      departmentId: "dept-1"
    });

    const html = renderToStaticMarkup(component);

    // Department scope should not have Jobs, but should keep Applicants visible
    expect(html).not.toContain(">Jobs<");
    expect(html).toContain(">Applicants<");

    // And should still have lifecycle tabs
    expect(html).toContain("Pipeline");
    expect(html).toContain("Screening");
    expect(html).toContain("Interview");
    expect(html).toContain("Review");
    expect(html).toContain("Final");
  });

  it("department scope shows all candidate lifecycle tabs", async () => {
    const component = await CandidatesViewSwitch({
      current: "screener",
      scope: "department",
      departmentId: "dept-1",
      countsDepartmentId: "dept-1"
    });

    const html = renderToStaticMarkup(component);

    const lifecycleTabs = ["Applicants", "Pipeline", "Screening", "Interview", "Review", "Final"];
    lifecycleTabs.forEach(tab => {
      expect(html).toContain(tab);
    });
  });

  it("department scope uses scoped URLs for candidate lifecycle links", async () => {
    const component = await CandidatesViewSwitch({
      current: "pipeline",
      scope: "department",
      departmentId: "dept-1",
      countsDepartmentId: "dept-1"
    });

    const html = renderToStaticMarkup(component);

    // Should link to department-scoped candidates/applicants pages
    expect(html).toContain("/departments/dept-1/candidates");
    expect(html).toContain("/departments/dept-1/applicants");

    // Should not link to global candidates paths
    expect(html).not.toContain("/people/candidates/jobs");
    expect(html).not.toContain("/people/candidates/applicants");
  });
});

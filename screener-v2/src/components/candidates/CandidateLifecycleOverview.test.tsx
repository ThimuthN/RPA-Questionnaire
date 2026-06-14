import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CandidateApplicationHistoryPanel,
  CandidateLifecycleSummaryCard
} from "./CandidateLifecycleOverview";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/primitives/StatusPill", () => ({
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/scene/StagePanel", () => ({
  StagePanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

describe("CandidateLifecycleOverview", () => {
  it("surfaces lifecycle summary with the next recommended action", () => {
    const markup = renderToStaticMarkup(
      <CandidateLifecycleSummaryCard
        applications={[
          {
            id: "app-1",
            candidateId: "cand-1",
            jobPostingId: "job-1",
            jobSlug: "rpa-engineer",
            jobTitle: "RPA Engineer",
            status: "under_review",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          }
        ]}
        platformAssessments={[]}
        applicationAssessments={[
          {
            id: "screen-1",
            candidateId: "cand-1",
            jobPostingId: "job-1",
            jobSlug: "rpa-engineer",
            jobTitle: "RPA Engineer",
            status: "under_review",
            screeningStatus: "needs_review",
            screeningAddonResults: [],
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          }
        ]}
        externalAssessments={[]}
        emailLogs={[]}
        hasResume
        filesHref={"/people/candidates/cand-1?tab=files"}
        assessmentsHref={"/people/candidates/cand-1?tab=assessments"}
        emailsHref={"/people/candidates/cand-1?tab=emails"}
        pipelineHref={"/people/candidates/cand-1"}
      />
    );

    expect(markup).toContain("Lifecycle summary");
    expect(markup).toContain("Review assessment evidence");
    expect(markup).toContain("1 application");
    expect(markup).toContain("1 assessment");
    expect(markup).toContain("0 emails");
  });

  it("renders every linked application with screening context", () => {
    const markup = renderToStaticMarkup(
      <CandidateApplicationHistoryPanel
        applications={[
          {
            id: "app-1",
            candidateId: "cand-1",
            jobPostingId: "job-1",
            jobSlug: "rpa-engineer",
            jobTitle: "RPA Engineer",
            roleLabel: "RPA Engineer",
            roleDepartment: "Automation",
            coverNote: "I have already built similar automation workflows.",
            status: "under_review",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          },
          {
            id: "app-2",
            candidateId: "cand-1",
            jobPostingId: "job-2",
            jobSlug: "ops-analyst",
            jobTitle: "Operations Analyst",
            roleLabel: "Operations Analyst",
            roleDepartment: "Operations",
            status: "closed",
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-25T00:00:00.000Z"
          }
        ]}
        applicationAssessments={[
          {
            id: "screen-1",
            candidateId: "cand-1",
            jobPostingId: "job-1",
            jobSlug: "rpa-engineer",
            jobTitle: "RPA Engineer",
            roleLabel: "RPA Engineer",
            roleDepartment: "Automation",
            status: "under_review",
            screenerPresetLabel: "Automation Screen",
            screeningStatus: "needs_review",
            screeningAddonResults: [],
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(markup).toContain("Application history");
    expect(markup).toContain("RPA Engineer");
    expect(markup).toContain("Operations Analyst");
    expect(markup).toContain("Screening Needs review");
    expect(markup).toContain("Automation Screen");
    expect(markup).toContain("I have already built similar automation workflows.");
    expect(markup).toContain("No intake screening");
  });
});

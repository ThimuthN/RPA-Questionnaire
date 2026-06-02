import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CandidateWorkspaceTable } from "./CandidateWorkspaceTable";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

vi.mock("@/components/candidates/CandidatePills", () => ({
  CandidateAssessmentPill: () => <span>Assessment</span>
}));

vi.mock("@/components/candidates/CandidateBulkActionsBar", () => ({
  CandidateBulkActionsBar: () => null
}));

describe("CandidateWorkspaceTable", () => {
  it("uses canonical /people/candidates/[id] profile links", () => {
    const markup = renderToStaticMarkup(
      <CandidateWorkspaceTable
        rows={[
          {
            id: "cand-1",
            fullName: "Candidate One",
            email: "candidate@example.com",
            stage: "pipeline",
            nextAction: "follow_up",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-02T00:00:00.000Z",
            hasResume: true,
            currentFocus: "Follow up",
            latestAssessment: null,
            latestAssessmentStatus: "none",
            latestActivityAt: "2026-06-02T00:00:00.000Z",
            staleDays: 0,
            openWorkBucket: "test_not_sent"
          }
        ]}
        currentPathAndQuery="/departments/dept-1/candidates?stage=pipeline"
        permissions={[]}
      />
    );

    expect(markup).toContain('href="/people/candidates/cand-1"');
    expect(markup).not.toContain('href="/departments/dept-1/candidates/cand-1"');
  });
});

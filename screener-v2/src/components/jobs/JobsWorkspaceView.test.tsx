import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobsWorkspaceView } from "./JobsWorkspaceView";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/primitives/Button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

vi.mock("@/components/primitives/StatusPill", () => ({
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/jobs/JobRowActions", () => ({
  JobRowActions: (props: unknown) => (
    <div data-testid="job-row-actions" data-props={JSON.stringify(props)} />
  )
}));

vi.mock("@/lib/db/jobs", () => ({
  listJobPostings: vi.fn()
}));

const { listJobPostings } = await import("@/lib/db/jobs");

describe("JobsWorkspaceView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listJobPostings).mockResolvedValue([
      {
        id: "job-1",
        slug: "rpa-engineer",
        title: "RPA Engineer",
        roleLabel: "RPA Engineer",
        roleDepartment: "Automation",
        summary: "Summary",
        description: "Description",
        isPublished: true,
        isOpen: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
        applicantCount: 4
      }
    ] as any);
  });

  it("treats the job title as the main entry point and delegates row actions to the layered control", async () => {
    const markup = renderToStaticMarkup(
      await JobsWorkspaceView({
        scope: "global",
        canCreateJob: true,
        canEditJob: true,
        createJobHref: "/people/candidates/jobs/new",
        applicantsBasePath: "/people/candidates/applicants",
        editJobBasePath: "/people/candidates/jobs",
        jobsBasePath: "/people/candidates/jobs"
      })
    );

    expect(markup).toContain('href="/people/candidates/jobs/job-1"');
    expect(markup).toContain("Review applicants");
    expect(markup).toContain("Applicant intake requires attention");
    expect(markup).toContain('data-testid="job-row-actions"');
    expect(markup).toContain("&quot;returnTo&quot;:&quot;/people/candidates/jobs&quot;");
  });
});

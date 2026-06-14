import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicantWorkspaceView } from "./ApplicantWorkspaceView";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/candidates/ApplicantsTable", () => ({
  ApplicantsTable: () => <div data-testid="applicants-table" />
}));

vi.mock("@/components/candidates/CandidatesViewSwitch", () => ({
  CandidatesViewSwitch: () => <div data-testid="candidate-view-switch" />
}));

vi.mock("@/components/workspace/ActiveFilterChips", () => ({
  ActiveFilterChips: ({ items }: { items: Array<{ label: string }> }) => (
    <div data-testid="applicant-active-filters">{items.map((item) => item.label).join(" | ")}</div>
  )
}));

vi.mock("@/components/workspace/PaginationBar", () => ({
  PaginationBar: () => <div data-testid="applicant-pagination" />
}));

vi.mock("@/components/scene/StagePanel", () => ({
  StagePanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/lib/auth/guards", () => ({
  requirePageSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/auth/permission-evaluator", () => ({
  hasGlobalPermission: vi.fn()
}));

vi.mock("@/lib/db/jobs", () => ({
  listApplicantWorkspacePage: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn()
    }
  }
}));

const { requirePageSession, requirePermissionForDepartment } = await import("@/lib/auth/guards");
const { hasGlobalPermission } = await import("@/lib/auth/permission-evaluator");
const { listApplicantWorkspacePage } = await import("@/lib/db/jobs");
const { prisma } = await import("@/lib/db/prisma");

const mockPage = {
  rows: [
    {
      id: "app-1",
      candidateId: "cand-1",
      candidateName: "Applicant One",
      candidateEmail: "applicant@example.com",
      candidateOwner: "Owner One",
      hasResume: true,
      jobPostingId: "job-1",
      jobSlug: "rpa-engineer",
      jobTitle: "RPA Engineer",
      roleLabel: "RPA Engineer",
      appliedAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      status: "submitted"
    }
  ],
  total: 1,
  page: 1,
  pageSize: 12,
  jobOptions: [{ id: "job-1", label: "RPA Engineer" }],
  summary: {
    total: 1,
    resumeMissing: 0,
    submitted: 1,
    underReview: 0
  }
};

describe("ApplicantWorkspaceView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePageSession).mockResolvedValue({
      userId: "user-1",
      name: "Test User",
      email: "user@example.com",
      roleId: "role-1",
      departmentId: "dept-1",
      permissions: ["view_candidates", "manage_candidates"],
      exp: 9999999999
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(hasGlobalPermission).mockResolvedValue(true);
    vi.mocked(listApplicantWorkspacePage).mockResolvedValue(mockPage as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "user-1", name: "Owner One", email: "owner@example.com" }
    ] as any);
  });

  it("renders ApplicantsTable through the shared applicant workspace view", async () => {
    const markup = renderToStaticMarkup(
      await ApplicantWorkspaceView({
        scope: "global",
        searchParams: {}
      })
    );

    expect(markup).toContain('data-testid="applicants-table"');
    expect(markup).toContain('data-testid="applicant-pagination"');
  });

  it("passes departmentId into the applicant loader for department scope", async () => {
    await ApplicantWorkspaceView({
      scope: "department",
      departmentId: "dept-1",
      searchParams: { status: "submitted" }
    });

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(
      expect.any(Object),
      "view_candidates",
      "dept-1"
    );
    expect(vi.mocked(listApplicantWorkspacePage)).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: "dept-1",
        status: "submitted"
      })
    );
  });

  it("surfaces active applicant filters and passes the missing resume filter to the loader", async () => {
    const markup = renderToStaticMarkup(
      await ApplicantWorkspaceView({
        scope: "global",
        searchParams: {
          q: "alice",
          jobId: "job-1",
          status: "under_review",
          resume: "missing"
        }
      })
    );

    expect(vi.mocked(listApplicantWorkspacePage)).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "alice",
        jobId: "job-1",
        status: "under_review",
        resumeMissing: true
      })
    );
    expect(markup).toContain('data-testid="applicant-active-filters"');
    expect(markup).toContain("Search: alice");
    expect(markup).toContain("Job: RPA Engineer");
    expect(markup).toContain("Status: Under review");
    expect(markup).toContain("Resume: Missing");
  });
});

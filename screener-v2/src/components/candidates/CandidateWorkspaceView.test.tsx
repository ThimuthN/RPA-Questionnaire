import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidateWorkspaceView } from "./CandidateWorkspaceView";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/candidates/CandidateWorkspaceTable", () => ({
  CandidateWorkspaceTable: () => <div data-testid="candidate-workspace-table" />
}));

vi.mock("@/components/candidates/CandidateCsvImportModal", () => ({
  CandidateCsvImportModal: () => <div data-testid="candidate-csv-import" />
}));

vi.mock("@/components/candidates/CandidatesViewSwitch", () => ({
  CandidatesViewSwitch: () => <div data-testid="candidate-view-switch" />
}));

vi.mock("@/components/workspace/PersistedTableState", () => ({
  PersistedTableState: () => null
}));

vi.mock("@/components/workspace/ActiveFilterChips", () => ({
  ActiveFilterChips: ({ items }: { items: Array<{ label: string }> }) => (
    <div data-testid="candidate-active-filters">{items.map((item) => item.label).join(" | ")}</div>
  )
}));

vi.mock("@/components/workspace/PaginationBar", () => ({
  PaginationBar: () => <div data-testid="candidate-pagination" />
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

vi.mock("@/lib/db/candidates", () => ({
  listCandidateWorkspacePage: vi.fn()
}));

vi.mock("@/lib/db/departments", () => ({
  listDepartments: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    accessGrant: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const { requirePageSession, requirePermissionForDepartment } = await import("@/lib/auth/guards");
const { hasGlobalPermission } = await import("@/lib/auth/permission-evaluator");
const { listCandidateWorkspacePage } = await import("@/lib/db/candidates");
const { listDepartments } = await import("@/lib/db/departments");

const mockPage = {
  rows: [
    {
      id: "cand-1",
      fullName: "Candidate One",
      email: "candidate@example.com",
      stage: "pipeline",
      nextAction: "follow_up",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      hasResume: true,
      latestResumeStorageKey: "resume-key",
      currentFocus: "Follow up",
      latestAssessment: null,
      latestAssessmentStatus: "none",
      latestActivityAt: "2026-06-02T00:00:00.000Z",
      staleDays: 0,
      openWorkBucket: "test_not_sent"
    }
  ],
  total: 1,
  page: 1,
  pageSize: 12,
  roleOptions: [{ id: "role-1", label: "RPA Engineer", departmentId: "dept-1" }],
  ownerOptions: [{ id: "owner-1", label: "Owner One" }],
  summary: {
    total: 1,
    needsResume: 0,
    testNotSent: 1,
    inProgress: 0,
    readyForReview: 0,
    movedForward: 0,
    stalled: 0
  }
};

describe("CandidateWorkspaceView", () => {
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
    vi.mocked(listCandidateWorkspacePage).mockResolvedValue(mockPage as any);
    vi.mocked(listDepartments).mockResolvedValue([
      { id: "dept-1", name: "RPA SL" },
      { id: "dept-2", name: "RPA IND" }
    ] as any);
  });

  it("renders CandidateWorkspaceTable through the shared workspace view", async () => {
    const markup = renderToStaticMarkup(
      await CandidateWorkspaceView({
        scope: "global",
        searchParams: {}
      })
    );

    expect(markup).toContain('data-testid="candidate-workspace-table"');
    expect(markup).toContain('data-testid="candidate-pagination"');
  });

  it("keeps the global workspace loader unscoped when the viewer has global access", async () => {
    await CandidateWorkspaceView({
      scope: "global",
      searchParams: { stage: "pipeline" }
    });

    expect(vi.mocked(listCandidateWorkspacePage)).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: undefined,
        stage: undefined,
        stageValues: ["pipeline", "new"],
        orgStage: "active"
      })
    );
  });

  it("passes departmentId into the shared loader for department scope", async () => {
    await CandidateWorkspaceView({
      scope: "department",
      departmentId: "dept-1",
      searchParams: { stage: "finalized" }
    });

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(
      expect.any(Object),
      "view_candidates",
      "dept-1"
    );
    expect(vi.mocked(listCandidateWorkspacePage)).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: "dept-1",
        orgStage: undefined,
        stage: "finalized"
      })
    );
  });

  it("separates status pills from action buttons", async () => {
    const markup = renderToStaticMarkup(
      await CandidateWorkspaceView({
        scope: "global",
        searchParams: {}
      })
    );

    // Check for status pills
    expect(markup).toContain("Candidates");
    expect(markup).toContain("0 awaiting review");
    expect(markup).toContain("0 stalled");

    // Check for action buttons
    expect(markup).toContain("Add candidate");
    expect(markup).toContain('data-testid="candidate-csv-import"');
  });

  it("renders correct department empty state copy", async () => {
    vi.mocked(listCandidateWorkspacePage).mockResolvedValue({ ...mockPage, rows: [] } as any);

    const markup = renderToStaticMarkup(
      await CandidateWorkspaceView({
        scope: "department",
        departmentId: "dept-1",
        searchParams: {}
      })
    );

    expect(markup).toContain("No candidates");
    expect(markup).toContain("Add or import candidates");
  });

  it("surfaces active candidate filters instead of hiding them in the form", async () => {
    const markup = renderToStaticMarkup(
      await CandidateWorkspaceView({
        scope: "global",
        searchParams: {
          q: "alice",
          roleId: "role-1",
          owner: "owner-1",
          assessmentStatus: "none",
          sort: "stale_desc"
        }
      })
    );

    expect(markup).toContain('data-testid="candidate-active-filters"');
    expect(markup).toContain("Search: alice");
    expect(markup).toContain("Role: RPA Engineer");
    expect(markup).toContain("Owner: Owner One");
    expect(markup).toContain("Assessment: Not assigned");
    expect(markup).toContain("Sort: Longest inactive");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
  redirect: vi.fn(() => {
    throw new Error("redirect");
  })
}));

vi.mock("@/components/candidates/CandidateActivityModal", () => ({
  CandidateActivityModal: () => <div data-testid="activity-card" />
}));

vi.mock("@/components/candidates/CandidateMilestoneTimeline", () => ({
  CandidateMilestoneTimeline: () => <div data-testid="milestone-timeline" />
}));

vi.mock("@/components/candidates/CandidateNotesModal", () => ({
  CandidateNotesModal: () => <div data-testid="notes-card" />
}));

vi.mock("@/components/candidates/DefaultJourneySkeleton", () => ({
  DefaultJourneySkeleton: ({ hasLinkedApplication }: { hasLinkedApplication: boolean }) => (
    <div data-testid="journey-skeleton">{hasLinkedApplication ? "Linked journey" : "No linked application journey"}</div>
  )
}));

vi.mock("@/components/candidates/EditCandidateInfoModal", () => ({
  EditCandidateInfoModal: () => null
}));

vi.mock("@/components/candidates/FinalizeActionBar", () => ({
  FinalizeActionBar: () => <div data-testid="finalize-action-bar" />
}));

vi.mock("@/components/candidates/ResumePreviewModal", () => ({
  ResumePreviewModal: () => null
}));

vi.mock("@/components/candidates/ResumeUploader", () => ({
  ResumeUploader: () => null
}));

vi.mock("@/components/candidates/TransferCandidateAction", () => ({
  TransferCandidateAction: () => null
}));

vi.mock("@/components/candidates/ResponsibleTeamCard", () => ({
  ResponsibleTeamCard: () => <div data-testid="responsible-team-card" />
}));

vi.mock("@/components/primitives/Button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

vi.mock("@/components/primitives/ConfirmSubmitButton", () => ({
  ConfirmSubmitButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

vi.mock("@/components/primitives/StatusPill", () => ({
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/scene/SceneShell", () => ({
  SceneShell: ({ title, utility, children }: { title: React.ReactNode; utility?: React.ReactNode; children: React.ReactNode }) => (
    <div>
      <div data-testid="scene-title">{title}</div>
      <div data-testid="scene-utility">{utility}</div>
      {children}
    </div>
  )
}));

vi.mock("@/components/scene/StagePanel", () => ({
  StagePanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

vi.mock("@/lib/candidates/lifecycle", () => ({
  getCandidateStageLabel: (stage: string) => stage
}));

vi.mock("@/lib/candidates/workspace", () => ({
  buildCandidateActivityFeed: () => []
}));

vi.mock("@/lib/auth/guards", () => ({
  requirePageSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  getCandidateDetail: vi.fn()
}));

vi.mock("@/lib/db/departments", () => ({
  getDepartment: vi.fn()
}));

vi.mock("@/lib/jobs/types", () => ({
  candidateApplicationStatusLabels: { under_review: "Under review" },
  isActiveApplicationStatus: vi.fn(() => false)
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/hiring-assignments", () => ({
  getApplicationAssignments: vi.fn()
}));

import CandidateDetailPage from "./page";
import { requirePageSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { getCandidateDetail } from "@/lib/db/candidates";
import { getDepartment } from "@/lib/db/departments";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { prisma } from "@/lib/db/prisma";

const mockCandidate = {
  id: "cand-1",
  fullName: "Test Candidate",
  email: "test@example.com",
  roleLabel: "RPA Engineer",
  departmentId: "dept-1",
  stage: "pipeline",
  orgStage: "active",
  finalizedAs: null,
  currentFocus: "Review",
  hrOwner: null,
  resumes: [],
  assessments: [],
  applications: [],
  milestones: [],
  notes: [],
  departmentCandidacies: [],
  activityEvents: []
};

describe("Candidate Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePageSession).mockResolvedValue({
      userId: "user-1",
      permissions: ["view_candidates", "manage_candidates"]
    } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);
    vi.mocked(getCandidateDetail).mockResolvedValue(mockCandidate as never);
    vi.mocked(getDepartment).mockResolvedValue({
      id: "dept-1",
      slug: "rpa-sl",
      name: "RPA SL",
      isActive: true,
      sortOrder: 1
    } as never);
    vi.mocked(getApplicationAssignments).mockResolvedValue([] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);
  });

  it("renders workspace-aware breadcrumb and back link when workspaceId is present", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({
        workspaceId: "dept-1",
        returnTo: "/departments/dept-1/candidates?stage=pipeline"
      })
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Workspaces");
    expect(markup).toContain("RPA SL");
    expect(markup).toContain('href="/departments/dept-1"');
    expect(markup).toContain('href="/departments/dept-1/candidates"');
    expect(markup).toContain('href="/departments/dept-1/candidates?stage=pipeline"');
    expect(markup).toContain("Back to RPA SL candidates");
  });

  it("derives workspace context from candidate data when no workspaceId is provided", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("RPA SL");
    expect(markup).toContain("Back to RPA SL candidates");
  });

  it("renders default journey skeleton when candidate has no milestones", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain('data-testid="journey-skeleton"');
  });

  it("shows linked-application and responsible-team warnings near status when missing", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Setup required");
    expect(markup).toContain("Linked application");
    expect(markup).toContain("Responsible team");
  });

  it("shows responsible team card when an application exists", async () => {
    vi.mocked(getCandidateDetail).mockResolvedValue({
      ...mockCandidate,
      applications: [
        {
          id: "app-1",
          status: "under_review",
          jobTitle: "RPA Engineer",
          roleLabel: "RPA Engineer",
          roleDepartment: "RPA SL",
          createdAt: new Date().toISOString()
        }
      ]
    } as never);

    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain('data-testid="responsible-team-card"');
  });
});

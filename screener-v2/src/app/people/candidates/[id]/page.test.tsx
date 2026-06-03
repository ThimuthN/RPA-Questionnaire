import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all external dependencies
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("notFound"); }),
  redirect: vi.fn(() => { throw new Error("redirect"); })
}));

vi.mock("@/components/candidates/CandidateActivityModal", () => ({
  CandidateActivityModal: () => null
}));

vi.mock("@/components/candidates/CandidateMilestoneTimeline", () => ({
  CandidateMilestoneTimeline: () => <div data-testid="milestone-timeline" />
}));

vi.mock("@/components/candidates/CandidateNotesModal", () => ({
  CandidateNotesModal: () => null
}));

vi.mock("@/components/candidates/DefaultJourneySkeleton", () => ({
  DefaultJourneySkeleton: ({ hasLinkedApplication }: any) => (
    <div data-testid="journey-skeleton">
      {!hasLinkedApplication && "Imported/manual candidate"}
      {hasLinkedApplication && "No tracked milestones"}
    </div>
  )
}));

vi.mock("@/components/candidates/EditCandidateInfoModal", () => ({
  EditCandidateInfoModal: () => null
}));

vi.mock("@/components/candidates/FinalizeActionBar", () => ({
  FinalizeActionBar: () => null
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
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  ConfirmSubmitButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>
}));

vi.mock("@/components/primitives/StatusPill", () => ({
  StatusPill: ({ label }: { label: string }) => <span>{label}</span>
}));

vi.mock("@/components/scene/SceneShell", () => ({
  SceneShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
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

vi.mock("@/lib/jobs/types", () => ({
  candidateApplicationStatusLabels: {},
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
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { prisma } from "@/lib/db/prisma";

const mockCandidate = {
  id: "cand-1",
  fullName: "Test Candidate",
  email: "test@example.com",
  roleLabel: "RPA Engineer",
  stage: "pipeline",
  orgStage: "active",
  finalizedAs: null,
  currentFocus: "Review",
  hrOwner: null,
  resumes: [],
  assessments: [],
  applications: [],
  milestones: [],
  notes: []
};

describe("Candidate Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePageSession).mockResolvedValue({
      userId: "user-1",
      permissions: ["view_candidates", "manage_candidates"]
    } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as any);
    vi.mocked(getCandidateDetail).mockResolvedValue(mockCandidate as any);
    vi.mocked(getApplicationAssignments).mockResolvedValue([]);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
  });

  it("renders default journey skeleton when candidate has no milestones", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain('data-testid="journey-skeleton"');
  });

  it("shows responsible team warning when no linked application", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Responsible team required");
    expect(markup).toContain("Create or link an application first");
  });

  it("shows responsible team card when application exists", async () => {
    const candidateWithApp = {
      ...mockCandidate,
      applications: [{ id: "app-1", status: "under_review", jobTitle: "RPA Engineer", roleLabel: "RPA Engineer", createdAt: new Date().toISOString() }]
    };

    vi.mocked(getCandidateDetail).mockResolvedValue(candidateWithApp as any);

    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain('data-testid="responsible-team-card"');
  });

  it("always renders responsible team section", async () => {
    const result = await CandidateDetailPage({
      params: Promise.resolve({ id: "cand-1" }),
      searchParams: Promise.resolve({})
    });

    const markup = renderToStaticMarkup(result);
    expect(markup).toContain("Responsible team");
  });
});

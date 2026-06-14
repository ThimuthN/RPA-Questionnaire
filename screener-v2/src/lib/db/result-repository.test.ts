import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    result: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/result-projections", () => ({
  buildReviewSections: vi.fn(),
  toResultSummary: vi.fn(() => ({
    attemptId: "attempt-1",
    candidateName: "Jane Doe",
    candidateEmail: "jane@example.com",
    contextType: "hiring",
    reviewState: "unreviewed",
    roleId: "role-1",
    stacks: [],
    sections: [],
    exams: [],
    corePercent: 70,
    practicalPercent: 70,
    finalPercent: 70,
    passPercent: 60,
    practicalMinPercent: 50,
    pass: true,
    borderline: false,
    integrity: { tabHiddenCount: 0, copyCount: 0, pasteCount: 0 },
    sectionBreakdown: {},
    examBreakdown: {},
    breakdownByCategory: {}
  }))
}));

vi.mock("@/lib/db/runtime-repository", () => ({
  mapAttempt: vi.fn((attempt) => attempt),
  mapParticipant: vi.fn((participant) => participant)
}));

vi.mock("@/lib/db/candidates", () => ({
  attachExistingAssessmentToMilestone: vi.fn(),
  bulkUpdateCandidates: vi.fn()
}));

vi.mock("@/lib/db/candidate-assessment-links", () => ({
  syncCandidateAssessmentLatestAttemptInTx: vi.fn()
}));

vi.mock("@/lib/roles/catalog", () => ({
  listRoleCatalog: vi.fn().mockResolvedValue([])
}));

import { prisma } from "@/lib/db/prisma";
import { listAllResultWorkspaceRows } from "./result-repository";

describe("listAllResultWorkspaceRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps department-scoped results visible when the candidate is linked through an active department candidacy", async () => {
    vi.mocked(prisma.result.findMany).mockResolvedValue([
      {
        attemptId: "attempt-1",
        createdAt: new Date("2026-06-14T00:00:00.000Z"),
        attempt: {
          startedAt: "2026-06-13T00:00:00.000Z",
          submittedAt: "2026-06-14T00:00:00.000Z",
          participant: {
            fullName: "Jane Doe",
            email: "jane@example.com"
          },
          candidateAssessment: {
            candidate: {
              id: "cand-1",
              departmentId: null,
              departmentCandidacies: [{ departmentId: "dept-1" }],
              roleId: null,
              positionAppliedFor: "Business Analyst",
              hrOwner: null,
              stage: "screening",
              nextAction: "follow_up",
              screeningStatus: "in_progress",
              notesSummary: null,
              updatedAt: new Date("2026-06-14T00:00:00.000Z"),
              role: null
            }
          }
        }
      }
    ] as never);

    const rows = await listAllResultWorkspaceRows({ departmentId: "dept-1" });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.candidateDepartmentId).toBe("dept-1");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  txCandidateApplicationFindUnique: vi.fn(),
  txCandidateApplicationUpdate: vi.fn(),
  txCandidateUpdate: vi.fn(),
  txDepartmentCandidacyUpsert: vi.fn()
}));

vi.mock("./prisma", () => ({
  prisma: {
    $transaction: prismaMocks.transaction
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidate: vi.fn(),
  findExistingCandidateByEmail: vi.fn(),
  mapCandidate: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: vi.fn(() => "mock-cuid")
}));

import { updateCandidateApplicationLifecycle } from "./jobs";

describe("updateCandidateApplicationLifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        candidateApplication: {
          findUnique: prismaMocks.txCandidateApplicationFindUnique,
          update: prismaMocks.txCandidateApplicationUpdate
        },
        candidate: {
          update: prismaMocks.txCandidateUpdate
        },
        departmentCandidacy: {
          upsert: prismaMocks.txDepartmentCandidacyUpsert
        }
      })
    );
    prismaMocks.txCandidateApplicationUpdate.mockResolvedValue({ id: "app-1" });
    prismaMocks.txCandidateUpdate.mockResolvedValue({ id: "cand-1" });
    prismaMocks.txDepartmentCandidacyUpsert.mockResolvedValue({ id: "cand-dept-1" });
  });

  it("promotes the application, reactivates the candidate, and creates an active candidacy", async () => {
    prismaMocks.txCandidateApplicationFindUnique
      .mockResolvedValueOnce({
        id: "app-1",
        candidateId: "cand-1"
      })
      .mockResolvedValueOnce({
        jobPostingId: "job-1",
        candidate: {
          departmentId: null,
          roleId: null
        },
        jobPosting: {
          departmentId: "dept-ops",
          roleId: "role-ops",
          role: {
            departmentId: null
          }
        }
      });

    const result = await updateCandidateApplicationLifecycle({
      applicationId: "app-1",
      action: "promote",
      hrOwner: "owner@example.com"
    });

    expect(result).toEqual({
      id: "app-1",
      candidateId: "cand-1"
    });
    expect(prismaMocks.txCandidateApplicationUpdate).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: {
        status: "moved_to_pipeline"
      }
    });
    expect(prismaMocks.txCandidateUpdate).toHaveBeenCalledWith({
      where: { id: "cand-1" },
      data: {
        hrOwner: "owner@example.com",
        stage: "pipeline",
        orgStatus: "active",
        finalizedAs: null,
        orgStage: "active",
        departmentId: "dept-ops"
      }
    });
    expect(prismaMocks.txDepartmentCandidacyUpsert).toHaveBeenCalledWith({
      where: {
        candidateId_departmentId: {
          candidateId: "cand-1",
          departmentId: "dept-ops"
        }
      },
      update: {
        status: "active",
        updatedAt: expect.any(Date)
      },
      create: {
        id: "mock-cuid",
        candidateId: "cand-1",
        departmentId: "dept-ops",
        roleId: "role-ops",
        status: "active",
        source: "job_application",
        jobPostingId: "job-1"
      }
    });
  });

  it("keeps an existing candidate department when promoting an application", async () => {
    prismaMocks.txCandidateApplicationFindUnique
      .mockResolvedValueOnce({
        id: "app-1",
        candidateId: "cand-1"
      })
      .mockResolvedValueOnce({
        jobPostingId: "job-1",
        candidate: {
          departmentId: "dept-eng",
          roleId: "role-eng"
        },
        jobPosting: {
          departmentId: "dept-ops",
          roleId: "role-ops",
          role: {
            departmentId: "dept-ops"
          }
        }
      });

    await updateCandidateApplicationLifecycle({
      applicationId: "app-1",
      action: "promote"
    });

    expect(prismaMocks.txCandidateUpdate).toHaveBeenCalledWith({
      where: { id: "cand-1" },
      data: {
        hrOwner: undefined,
        stage: "pipeline",
        orgStatus: "active",
        finalizedAs: null,
        orgStage: "active",
        departmentId: "dept-eng"
      }
    });
    expect(prismaMocks.txDepartmentCandidacyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          candidateId_departmentId: {
            candidateId: "cand-1",
            departmentId: "dept-eng"
          }
        }
      })
    );
  });
});

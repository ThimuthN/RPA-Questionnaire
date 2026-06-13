import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  departmentCandidacy: {
    findUnique: vi.fn()
  },
  user: {
    findUnique: vi.fn()
  },
  departmentCandidacyTeamAssignment: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  }
};

vi.mock("./prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(tx))
  }
}));

vi.mock("@/lib/auth/access-grants", () => ({
  listDepartmentTeamViaAccessGrant: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "new-assignment"
}));

import { replaceCandidacyTeamAssignments } from "./candidacy-team-assignments";
import { prisma } from "./prisma";

describe("candidacy-team-assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.departmentCandidacy.findUnique.mockResolvedValue({ departmentId: "dept-1" });
    tx.user.findUnique.mockResolvedValue({ id: "user-1", isActive: true });
    tx.departmentCandidacyTeamAssignment.updateMany.mockResolvedValue({ count: 1 });
  });

  it("reactivates an existing assignment instead of creating a duplicate row", async () => {
    tx.departmentCandidacyTeamAssignment.findUnique.mockResolvedValue({
      candidacyId: "cand-1",
      userId: "user-1",
      role: "owner",
      isActive: false
    });
    tx.departmentCandidacyTeamAssignment.update.mockResolvedValue({
      id: "existing-assignment",
      user: { id: "user-1", name: "Owner", email: "owner@example.com" }
    });

    const result = await replaceCandidacyTeamAssignments("cand-1", [
      {
        candidacyId: "cand-1",
        userId: "user-1",
        role: "owner",
        source: "template"
      }
    ]);

    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalledTimes(1);
    expect(tx.departmentCandidacyTeamAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          candidacyId_userId_role: {
            candidacyId: "cand-1",
            userId: "user-1",
            role: "owner"
          }
        }
      })
    );
    expect(tx.departmentCandidacyTeamAssignment.create).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: "existing-assignment",
        user: { id: "user-1", name: "Owner", email: "owner@example.com" }
      }
    ]);
  });
});

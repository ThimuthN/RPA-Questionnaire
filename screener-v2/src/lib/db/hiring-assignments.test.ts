import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn()
    },
    hiringAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn()
    },
    candidateApplication: {
      findUnique: vi.fn()
    },
    candidate: {
      update: vi.fn()
    }
  }
}));

import {
  validateUsers,
  setApplicationAssignments
} from "./hiring-assignments";
import { prisma } from "./prisma";

describe("hiring-assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateUsers", () => {
    it("returns valid when all users exist and are active", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1" },
        { id: "user-2" }
      ] as any);

      const result = await validateUsers(["user-1", "user-2"]);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("returns invalid and lists missing users", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1" }
      ] as any);

      const result = await validateUsers(["user-1", "user-2"]);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["user-2"]);
    });
  });

  describe("setApplicationAssignments", () => {
    it("throws when application not found", async () => {
      vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue(null);

      await expect(
        setApplicationAssignments("app-1", "add", [{ userId: "user-1", assignmentRole: "recruiter" }])
      ).rejects.toThrow("Application not found");
    });

    it("throws when user validation fails", async () => {
      vi.mocked(prisma.candidateApplication.findUnique).mockResolvedValue({
        id: "app-1",
        candidateId: "cand-1"
      } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await expect(
        setApplicationAssignments("app-1", "add", [{ userId: "invalid-user", assignmentRole: "recruiter" }])
      ).rejects.toThrow("Invalid user IDs");
    });

    it("only removes primary flag from other user when isPrimary is set", async () => {
      vi.mocked(prisma.candidateApplication.findUnique)
        .mockResolvedValueOnce({
          id: "app-1",
          candidateId: "cand-1"
        } as any)
        .mockResolvedValueOnce({
          candidateId: "cand-1",
          assignments: []
        } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1" },
        { id: "user-2" }
      ] as any);
      vi.mocked(prisma.hiringAssignment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.hiringAssignment.create).mockResolvedValue({
        id: "assign-1"
      } as any);
      vi.mocked(prisma.candidate.update).mockResolvedValue({ id: "cand-1" } as any);

      await setApplicationAssignments(
        "app-1",
        "add",
        [
          { userId: "user-1", assignmentRole: "recruiter", isPrimary: true },
          { userId: "user-2", assignmentRole: "hiring_manager" }
        ]
      );

      expect(vi.mocked(prisma.hiringAssignment.create).mock.calls.length).toBe(2);
    });
  });

});

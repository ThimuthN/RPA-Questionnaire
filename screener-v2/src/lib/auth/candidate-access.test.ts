import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requirePermission: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn()
    }
  }
}));

import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requirePermission, requirePermissionForDepartment } from "@/lib/auth/guards";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

describe("requireCandidatePermission", () => {
  const session: AppSession = {
    userId: "user-1",
    email: "user@example.com",
    name: "User",
    roleId: "role-1",
    departmentId: "dept-1",
    permissions: ["view_candidates", "manage_candidates"],
    exp: 9999999999
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the candidate is missing", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const result = await requireCandidatePermission(session, "cand-1", "view_candidates");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(404);
      await expect(result.response.json()).resolves.toEqual({ ok: false, message: "Candidate not found." });
    }
    expect(vi.mocked(requirePermissionForDepartment)).not.toHaveBeenCalled();
  });

  it("returns the permission failure response", async () => {
    const response = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-2", orgStage: "active" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response });

    const result = await requireCandidatePermission(session, "cand-1", "view_candidates");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("succeeds for matching department permission", async () => {
    const candidate = { id: "cand-1", departmentId: "dept-1", orgStage: "active" };
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(candidate as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true });

    const result = await requireCandidatePermission(session, "cand-1", "manage_candidates");

    expect(result).toEqual({ ok: true, candidate });
  });

  it("checks permission against candidate.departmentId", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-3", orgStage: "active" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true });

    await requireCandidatePermission(session, "cand-1", "view_candidates");

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(session, "view_candidates", "dept-3");
  });

  it("falls back to the active department candidacy when the candidate record is not directly assigned", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      id: "cand-1",
      departmentId: null,
      orgStage: "active",
      departmentCandidacies: [{ departmentId: "dept-9" }]
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true });

    const result = await requireCandidatePermission(session, "cand-1", "view_candidates");

    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(session, "view_candidates", "dept-9");
    expect(result).toEqual({
      ok: true,
      candidate: {
        id: "cand-1",
        departmentId: "dept-9",
        orgStage: "active"
      }
    });
  });

  it("does not use the plain global permission guard", async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({ id: "cand-1", departmentId: "dept-1", orgStage: "active" } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true });

    await requireCandidatePermission(session, "cand-1", "view_candidates");

    expect(vi.mocked(requirePermission)).not.toHaveBeenCalled();
  });
});

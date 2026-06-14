import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    candidateNote: {
      updateMany: vi.fn(),
    },
    candidateActivityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-123",
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: () => ({}),
  logRouteError: vi.fn(),
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

describe("POST /api/candidates/[id]/anonymize", () => {
  const mockSession = {
    userId: "user-1",
    name: "Test User",
    email: "test@example.com",
    permissions: ["delete_candidate"],
  };
  const mockCandidate = {
    id: "cand-1",
    stage: "pipeline",
    departmentId: "dept-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anonymizes candidate successfully", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: true,
    } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(
      mockCandidate as any
    );
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      ...mockCandidate,
      fullName: "Redacted",
      email: `redacted-cand-1@deleted.local`,
      phone: null,
      positionAppliedFor: null,
      resumeSource: null,
    } as any);
    vi.mocked(prisma.candidateNote.updateMany).mockResolvedValue({
      count: 2,
    } as any);
    vi.mocked(prisma.candidateActivityEvent.create).mockResolvedValue(
      {} as any
    );

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/anonymize", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);

    expect(vi.mocked(prisma.candidate.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cand-1" },
        data: expect.objectContaining({
          fullName: "Redacted",
          email: "redacted-cand-1@deleted.local",
          phone: null,
        }),
      })
    );
    expect(vi.mocked(prisma.candidateNote.updateMany)).toHaveBeenCalledWith({
      where: { candidateId: "cand-1" },
      data: { body: "[redacted]" },
    });
    expect(vi.mocked(prisma.candidateActivityEvent.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event: "candidate_profile_updated",
          detail: "Candidate data anonymized",
          actorId: "user-1",
        }),
      })
    );
    expect(vi.mocked(requirePermissionForDepartment)).toHaveBeenCalledWith(
      mockSession,
      "delete_candidate",
      "dept-1"
    );
  });

  it("returns 404 when candidate not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/anonymize", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.message).toContain("not found");
  });

  it("returns 400 when candidate is finalized", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: true,
    } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      ...mockCandidate,
      stage: "finalized",
    } as any);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/anonymize", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toContain("Cannot anonymize a finalized candidate");
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
  });

  it("returns 403 when permission check fails", async () => {
    const forbiddenResponse = NextResponse.json(
      { ok: false, message: "Permission denied" },
      { status: 403 }
    );
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: mockSession,
    } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(
      mockCandidate as any
    );
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: forbiddenResponse,
    } as any);

    const response = await POST(
      new Request("http://localhost/api/candidates/cand-1/anonymize", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(response.status).toBe(403);
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
  });
});

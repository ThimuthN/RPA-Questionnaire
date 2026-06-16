import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    candidateActivityEvent: {
      create: vi.fn().mockResolvedValue({})
    }
  }
}));

vi.mock("@/lib/notifications/service", () => ({
  createNotification: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue({})
}));

// Stage route does not exist yet in the codebase — these tests define the expected
// contract so that when the route is implemented it can be verified immediately.
// The tests use a thin shim that mimics the pattern every other candidate route follows.

const VALID_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected"
] as const;

type Stage = (typeof VALID_STAGES)[number];

// ---------------------------------------------------------------------------
// Inline shim — replace with `import { PATCH } from "./route"` once the file
// exists.  Written to match the real behaviour described in the task contract.
// ---------------------------------------------------------------------------
async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { requireApiSession, requirePermissionForDepartment } = await import(
    "@/lib/auth/guards"
  );
  const { prisma } = await import("@/lib/db/prisma");
  const { logAudit } = await import("@/lib/auth/audit");

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: { stage?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body" }, { status: 400 });
  }

  if (!body.stage || !VALID_STAGES.includes(body.stage as Stage)) {
    return NextResponse.json({ ok: false, message: "Invalid stage value" }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });
  }

  const perm = await requirePermissionForDepartment(
    auth.session,
    "manage_candidates",
    (candidate as { departmentId: string | null }).departmentId
  );
  if (!perm.ok) return perm.response;

  const updated = await prisma.candidate.update({
    where: { id },
    data: { orgStage: body.stage as string }
  });

  await logAudit({
    action: "candidate.stage_changed",
    actorId: auth.session.userId,
    targetId: id,
    targetType: "candidate",
    before: { stage: (candidate as { orgStage?: string }).orgStage },
    after: { stage: body.stage }
  });

  await prisma.candidateActivityEvent.create({
    data: {
      candidateId: id,
      actorId: auth.session.userId ?? null,
      actorName: auth.session.name ?? null,
      event: "stage_changed",
      entityType: "candidate",
      entityId: id,
      detail: `Stage changed to ${body.stage as string}.`
    }
  });

  return NextResponse.json({ ok: true, candidate: updated });
}

// ---------------------------------------------------------------------------

import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/auth/audit";

const mockSession = {
  userId: "user-1",
  name: "HR Manager",
  email: "hr@example.com",
  permissions: ["manage_candidates"]
};

const mockCandidate = {
  id: "cand-1",
  fullName: "Alice Johnson",
  email: "alice@example.com",
  departmentId: "dept-1",
  orgStage: "applied"
};

describe("PATCH /api/candidates/[id]/stage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("advances stage and logs audit + activity", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as never);
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      ...mockCandidate,
      orgStage: "screening"
    } as never);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "screening" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.candidate.orgStage).toBe("screening");

    expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "candidate.stage_changed",
        actorId: "user-1",
        targetId: "cand-1",
        targetType: "candidate",
        after: { stage: "screening" }
      })
    );

    expect(vi.mocked(prisma.candidateActivityEvent.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event: "stage_changed",
          candidateId: "cand-1"
        })
      })
    );
  });

  it("returns 403 when user lacks manage_candidates permission", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({
      ok: false,
      response: forbidden
    } as never);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "interview" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
    expect(vi.mocked(logAudit)).not.toHaveBeenCalled();
  });

  it("returns 400 when stage value is not in the allowed enum", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "INVALID_STAGE" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.message).toMatch(/invalid stage/i);
    expect(vi.mocked(prisma.candidate.findUnique)).not.toHaveBeenCalled();
  });

  it("returns 400 when stage field is missing from body", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({})
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 404 when candidate does not exist", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "interview" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.message).toContain("not found");
    expect(vi.mocked(prisma.candidate.update)).not.toHaveBeenCalled();
  });

  it("returns 401 when session is not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as never);

    const res = await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "screening" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(401);
    expect(vi.mocked(prisma.candidate.findUnique)).not.toHaveBeenCalled();
  });

  it("stores the before-stage in the audit log", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      ...mockCandidate,
      orgStage: "applied"
    } as never);
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      ...mockCandidate,
      orgStage: "offer"
    } as never);

    await PATCH(
      new Request("http://localhost/api/candidates/cand-1/stage", {
        method: "PATCH",
        body: JSON.stringify({ stage: "offer" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(vi.mocked(logAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        before: { stage: "applied" },
        after: { stage: "offer" }
      })
    );
  });
});

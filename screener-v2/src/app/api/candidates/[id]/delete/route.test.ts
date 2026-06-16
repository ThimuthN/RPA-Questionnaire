import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: { findUnique: vi.fn() }
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  deleteCandidate: vi.fn()
}));

import { POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { deleteCandidate } from "@/lib/db/candidates";

const mockSession = { userId: "user-1", name: "Admin", permissions: ["delete_candidate"] };

function makeCandidate(overrides = {}) {
  return {
    id: "cand-1",
    stage: "pipeline",
    departmentId: "dept-1",
    employee: null,
    offer: null,
    interviewPanels: [],
    milestones: [],
    ...overrides
  };
}

async function postDelete(candidateId = "cand-1", returnTo?: string) {
  const body = new FormData();
  if (returnTo) body.set("returnTo", returnTo);
  return POST(
    new Request(`http://localhost/api/candidates/${candidateId}/delete`, { method: "POST", body }),
    { params: Promise.resolve({ id: candidateId }) }
  );
}

describe("POST /api/candidates/[id]/delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a clean candidate and redirects", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate() as any);
    vi.mocked(deleteCandidate).mockResolvedValue(undefined as any);

    const res = await postDelete("cand-1", "/people/candidates");

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("deleted=1");
    expect(vi.mocked(deleteCandidate)).toHaveBeenCalledWith("cand-1");
  });

  it("ignores protocol-relative returnTo values and falls back to the local candidates page", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate() as any);
    vi.mocked(deleteCandidate).mockResolvedValue(undefined as any);

    const res = await postDelete("cand-1", "//evil.example/phish");

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/people/candidates?deleted=1");
  });

  it("blocks deletion of a finalized candidate", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate({ stage: "finalized" }) as any);

    const res = await postDelete();

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=");
    expect(res.headers.get("location")).toContain("finalized");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("blocks deletion when employee record exists", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate({ employee: { id: "emp-1" } }) as any);

    const res = await postDelete();

    expect(res.status).toBe(303);
    const loc = res.headers.get("location") ?? "";
    const errorParam = new URL(loc).searchParams.get("error") ?? "";
    expect(errorParam).toContain("employee record");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("blocks deletion when pending offer exists", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate({ offer: { id: "offer-1", status: "sent" } }) as any);

    const res = await postDelete();

    expect(res.status).toBe(303);
    const loc = res.headers.get("location") ?? "";
    const errorParam = new URL(loc).searchParams.get("error") ?? "";
    expect(errorParam).toContain("pending offer");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("blocks deletion when interview panels exist", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(
      makeCandidate({ interviewPanels: [{ id: "p-1" }] }) as any
    );

    const res = await postDelete();

    expect(res.status).toBe(303);
    const loc = res.headers.get("location") ?? "";
    expect(decodeURIComponent(loc)).toContain("interview");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("blocks deletion when active milestones exist", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(
      makeCandidate({ milestones: [{ id: "m-1" }] }) as any
    );

    const res = await postDelete();

    expect(res.status).toBe(303);
    const loc = res.headers.get("location") ?? "";
    expect(decodeURIComponent(loc)).toContain("milestone");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("returns 403 when missing delete_candidate permission", async () => {
    const forbidden = NextResponse.json({ ok: false }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(makeCandidate() as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbidden } as any);

    const res = await postDelete();

    expect(res.status).toBe(403);
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });

  it("redirects with error when candidate not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const res = await postDelete();

    expect(res.status).toBe(303);
    const loc = res.headers.get("location") ?? "";
    const errorParam = new URL(loc).searchParams.get("error") ?? "";
    expect(errorParam).toContain("not found");
    expect(vi.mocked(deleteCandidate)).not.toHaveBeenCalled();
  });
});

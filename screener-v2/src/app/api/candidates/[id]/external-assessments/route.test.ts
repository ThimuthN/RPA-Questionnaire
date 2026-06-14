import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidateExternalAssessment: vi.fn()
}));

import { POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { createCandidateExternalAssessment } from "@/lib/db/candidates";

const mockSession = { userId: "user-1", name: "HR User", permissions: ["manage_candidates"] };
const mockRecord = { id: "ea-1", candidateId: "cand-1", title: "HackerRank Test", status: "completed" };

describe("POST /api/candidates/[id]/external-assessments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an external assessment with valid payload", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as any);
    vi.mocked(createCandidateExternalAssessment).mockResolvedValue(mockRecord as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ title: "HackerRank Test", status: "completed", scorePercent: 85 })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("ea-1");
  });

  it("returns 400 when title is missing", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ status: "completed" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status value", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ title: "Test", status: "not_a_real_status" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when scorePercent is out of range", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ title: "Test", status: "completed", scorePercent: 150 })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("returns 403 when permission check fails", async () => {
    const forbidden = NextResponse.json({ ok: false }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: false, response: forbidden } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ title: "Test", status: "completed" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(createCandidateExternalAssessment)).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/external-assessments", {
        method: "POST",
        body: JSON.stringify({ title: "Test", status: "completed" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(401);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@vercel/blob", () => ({
  get: vi.fn()
}));

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/candidates/resume-storage", () => ({
  assertCandidateResumeCandidateExists: vi.fn(),
  resolveCandidateResumeRecord: vi.fn()
}));

import { get } from "@vercel/blob";
import { GET } from "./route";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requireApiSession } from "@/lib/auth/guards";
import { resolveCandidateResumeRecord } from "@/lib/candidates/resume-storage";

describe("GET /api/candidates/[id]/resume/file", () => {
  const session = { userId: "user-1", permissions: ["view_candidates"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not read Blob storage when candidate permission fails", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: false, response: forbidden } as any);

    const response = await GET(new Request("http://localhost/api/candidates/cand-1/resume/file"), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(requireCandidatePermission)).toHaveBeenCalledWith(session, "cand-1", "view_candidates");
    expect(vi.mocked(resolveCandidateResumeRecord)).not.toHaveBeenCalled();
    expect(vi.mocked(get)).not.toHaveBeenCalled();
  });
});

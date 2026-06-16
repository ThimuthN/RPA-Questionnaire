import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  addCandidateNote: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@/lib/candidates/types", () => ({
  candidateNoteTypeValues: ["screening", "interview", "technical", "decision", "general"] as const
}));

import { POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { addCandidateNote } from "@/lib/db/candidates";

const mockSession = {
  userId: "user-1",
  name: "HR Manager",
  email: "hr@example.com",
  permissions: ["manage_candidates"]
};

function makeFormRequest(
  url: string,
  fields: Record<string, string>,
  accept?: string
): Request {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  return new Request(url, {
    method: "POST",
    body: form,
    headers: accept ? { accept } : {}
  });
}

describe("POST /api/candidates/[id]/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a note and returns JSON when Accept: application/json is set", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "general", body: "Great communication skills." },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(vi.mocked(addCandidateNote)).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: "cand-1",
        type: "general",
        body: "Great communication skills.",
        createdById: "user-1"
      })
    );
  });

  it("redirects to candidate page when Accept header is not JSON", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest("http://localhost/api/candidates/cand-1/notes", {
        type: "interview",
        body: "Solid technical knowledge."
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    // 303 redirect with noteAdded param
    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toContain("/candidates/cand-1");
    expect(location).toContain("noteAdded=1");
  });

  it("returns 403 when the user lacks manage_candidates permission", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({
      ok: false,
      response: forbidden
    } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "general", body: "Some note." },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(addCandidateNote)).not.toHaveBeenCalled();
  });

  it("returns 401 when session is not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "general", body: "A note." },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(401);
    expect(vi.mocked(addCandidateNote)).not.toHaveBeenCalled();
  });

  it("returns 400 JSON when body text is too short (< 2 chars) and Accept is JSON", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "general", body: "x" },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.message).toBe("Invalid note.");
    expect(vi.mocked(addCandidateNote)).not.toHaveBeenCalled();
  });

  it("returns 400 JSON when body field is entirely missing", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "general" }, // body field omitted
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("returns 400 JSON when note type is invalid", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "UNKNOWN_TYPE", body: "Valid body text." },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(vi.mocked(addCandidateNote)).not.toHaveBeenCalled();
  });

  it("redirects with error param when validation fails without JSON Accept", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest("http://localhost/api/candidates/cand-1/notes", {
        type: "general",
        body: "x" // too short
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(303);
    const location = res.headers.get("location");
    expect(location).toContain("error=");
  });

  it("passes createdById as undefined when session has no userId", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      ok: true,
      session: { ...mockSession, userId: null }
    } as never);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true } as never);

    const res = await POST(
      makeFormRequest(
        "http://localhost/api/candidates/cand-1/notes",
        { type: "screening", body: "Looks promising." },
        "application/json"
      ),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    expect(vi.mocked(addCandidateNote)).toHaveBeenCalledWith(
      expect.objectContaining({ createdById: undefined })
    );
  });
});

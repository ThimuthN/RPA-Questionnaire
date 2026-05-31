import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/auth/candidate-access", () => ({
  requireCandidatePermission: vi.fn()
}));

vi.mock("@/lib/db/candidates", () => ({
  deleteCandidateNote: vi.fn(),
  updateCandidateNote: vi.fn()
}));

import { DELETE, PUT } from "./route";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requireApiSession } from "@/lib/auth/guards";
import { deleteCandidateNote, updateCandidateNote } from "@/lib/db/candidates";

describe("/api/candidates/[id]/notes/[noteId]", () => {
  const session = { userId: "user-1", email: "user@example.com", permissions: ["manage_candidates"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not update a note when candidate permission fails", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: false, response: forbidden } as any);

    const response = await PUT(new Request("http://localhost/api/candidates/cand-1/notes/note-1", {
      method: "PUT",
      body: JSON.stringify({ body: "Updated note" })
    }), {
      params: Promise.resolve({ id: "cand-1", noteId: "note-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(updateCandidateNote)).not.toHaveBeenCalled();
  });

  it("does not delete a note when candidate permission fails", async () => {
    const forbidden = NextResponse.json({ ok: false, message: "Permission denied" }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: false, response: forbidden } as any);

    const response = await DELETE(new Request("http://localhost/api/candidates/cand-1/notes/note-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "cand-1", noteId: "note-1" })
    });

    expect(response.status).toBe(403);
    expect(vi.mocked(deleteCandidateNote)).not.toHaveBeenCalled();
  });

  it("returns a generic update error", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session } as any);
    vi.mocked(requireCandidatePermission).mockResolvedValue({ ok: true, candidate: { id: "cand-1" } } as any);
    vi.mocked(updateCandidateNote).mockRejectedValue(new Error("internal note detail"));

    const response = await PUT(new Request("http://localhost/api/candidates/cand-1/notes/note-1", {
      method: "PUT",
      body: JSON.stringify({ body: "Updated note" })
    }), {
      params: Promise.resolve({ id: "cand-1", noteId: "note-1" })
    });

    await expect(response.json()).resolves.toEqual({ error: "Could not update note." });
  });
});

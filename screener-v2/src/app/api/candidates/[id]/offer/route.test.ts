import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    candidate: { findUnique: vi.fn() },
    candidateOffer: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock("@/lib/email", () => ({
  sendEmailSafe: vi.fn(),
  offerSentEmail: vi.fn().mockReturnValue({ subject: "Offer", html: "<p>Offer</p>" }),
  getOrgName: vi.fn().mockReturnValue("TestOrg")
}));

import { GET, POST } from "./route";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const mockSession = { userId: "user-1", name: "HR User", email: "hr@example.com", permissions: ["manage_candidates"] };
const mockCandidate = {
  id: "cand-1",
  fullName: "Jane Smith",
  email: "jane@example.com",
  departmentId: "dept-1",
  positionAppliedFor: "Engineer",
  departmentCandidacies: []
};
const mockOffer = {
  id: "offer-1",
  status: "draft",
  compensationType: "salary",
  compensationAmount: 80000,
  currency: "USD",
  targetStartDate: null,
  expiresAt: null,
  offerNotes: null,
  sentAt: null,
  respondedAt: null
};

describe("GET /api/candidates/[id]/offer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null offer when none exists", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/candidates/cand-1/offer"), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.offer).toBeNull();
  });

  it("returns mapped offer when one exists", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue(mockOffer as any);

    const res = await GET(new Request("http://localhost/api/candidates/cand-1/offer"), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.offer.id).toBe("offer-1");
    expect(json.offer.status).toBe("draft");
  });

  it("returns 401 when not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as any);

    const res = await GET(new Request("http://localhost/api/candidates/cand-1/offer"), {
      params: Promise.resolve({ id: "cand-1" })
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/candidates/[id]/offer — upsert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a draft offer", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidateOffer.upsert).mockResolvedValue(mockOffer as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "upsert", compensationType: "salary", compensationAmount: "80000", currency: "USD" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.offer.id).toBe("offer-1");
  });

  it("returns 404 when candidate not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "upsert" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(404);
  });

  it("returns 403 when permission check fails", async () => {
    const forbidden = NextResponse.json({ ok: false }, { status: 403 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: false, response: forbidden } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "upsert" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(403);
    expect(vi.mocked(prisma.candidateOffer.upsert)).not.toHaveBeenCalled();
  });
});

describe("POST /api/candidates/[id]/offer — send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks offer as sent and fires email", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue(mockOffer as any);
    vi.mocked(prisma.candidateOffer.update).mockResolvedValue({ ...mockOffer, status: "sent", sentAt: new Date() } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "send" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.offer.status).toBe("sent");
  });

  it("returns 400 when no offer exists to send", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "send" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("Create an offer before");
  });
});

describe("POST /api/candidates/[id]/offer — revoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes a sent offer back to draft", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue({ ...mockOffer, status: "sent" } as any);
    vi.mocked(prisma.candidateOffer.update).mockResolvedValue({ ...mockOffer, status: "draft", sentAt: null } as any);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "revoke" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.offer.status).toBe("draft");
    expect(json.offer.sentAt).toBeNull();
  });

  it("returns 400 when no offer exists to revoke", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as any);
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidateOffer.findUnique).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/candidates/cand-1/offer", {
        method: "POST",
        body: JSON.stringify({ action: "revoke" })
      }),
      { params: Promise.resolve({ id: "cand-1" }) }
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("No offer to revoke");
  });
});

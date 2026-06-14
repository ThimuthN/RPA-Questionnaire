import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn()
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    interviewFeedback: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    },
    interviewPanel: {
      findUnique: vi.fn()
    }
  }
}));

import { GET, POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const mockSession = { userId: "user-1", name: "Interviewer One", email: "i1@example.com", permissions: [] };
const mockPanel = { id: "panel-1", candidateId: "cand-1" };
const mockFeedback = {
  id: "fb-1",
  overallRating: 4,
  recommendation: "yes",
  strengths: "Strong communicator",
  concerns: null,
  privateNotes: null,
  submittedAt: new Date("2026-06-10T10:00:00Z"),
  interviewer: { name: "Interviewer One", email: "i1@example.com" }
};

describe("GET /api/interviews/[panelId]/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no feedback yet", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewFeedback.findUnique).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/api/interviews/panel-1/feedback"), {
      params: Promise.resolve({ panelId: "panel-1" })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.feedback).toBeNull();
  });

  it("returns feedback when it exists for the current user", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewFeedback.findUnique).mockResolvedValue(mockFeedback as any);

    const res = await GET(new Request("http://localhost/api/interviews/panel-1/feedback"), {
      params: Promise.resolve({ panelId: "panel-1" })
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.feedback.id).toBe("fb-1");
    expect(json.feedback.overallRating).toBe(4);
    expect(json.feedback.recommendation).toBe("yes");
    expect(json.feedback.interviewerName).toBe("Interviewer One");
  });

  it("returns 401 when not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as any);

    const res = await GET(new Request("http://localhost/api/interviews/panel-1/feedback"), {
      params: Promise.resolve({ panelId: "panel-1" })
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/interviews/[panelId]/feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates feedback for a valid panel", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue(mockPanel as any);
    vi.mocked(prisma.interviewFeedback.upsert).mockResolvedValue({ id: "fb-1" } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 4, recommendation: "yes", strengths: "Great candidate" })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.feedbackId).toBe("fb-1");
  });

  it("returns 404 when panel not found", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 3 })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.message).toContain("not found");
  });

  it("returns 401 when not authenticated", async () => {
    const unauth = NextResponse.json({ ok: false }, { status: 401 });
    vi.mocked(requireApiSession).mockResolvedValue({ ok: false, response: unauth } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 3 })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid rating value", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue(mockPanel as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 99 })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("returns 401 when userId is missing from session", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: { ...mockSession, userId: undefined } } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 3 })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(401);
  });
});

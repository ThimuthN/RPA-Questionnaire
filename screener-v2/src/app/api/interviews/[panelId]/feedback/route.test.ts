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

vi.mock("@/lib/db/interview-kits", () => ({
  getKitForPanel: vi.fn().mockResolvedValue(null)
}));

vi.mock("@/lib/notifications/service", () => ({
  createNotification: vi.fn().mockResolvedValue({})
}));

// Pass the real Zod schemas through so feedbackSchema validation works correctly.
// Only stub parseCompetencyJson for GET response shaping.
vi.mock("@/lib/jobs/json-schemas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/jobs/json-schemas")>();
  return {
    ...actual,
    parseCompetencyJson: vi.fn((v: unknown) => v ?? null)
  };
});

import { GET, POST } from "./route";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/service";

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

  it("notifies the HR owner when the submitter is a different user", async () => {
    const panelWithOwner = {
      id: "panel-1",
      candidateId: "cand-1",
      candidate: { fullName: "Alice Johnson", hrOwnerId: "owner-99" }
    };
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue(panelWithOwner as any);
    vi.mocked(prisma.interviewFeedback.upsert).mockResolvedValue({ id: "fb-new" } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 3, recommendation: "neutral" })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(200);
    // createNotification should have been called (possibly via void — allow micro-task flush)
    await Promise.resolve();
    expect(vi.mocked(createNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-99",
        type: "scorecard_submitted",
        entityId: "cand-1"
      })
    );
  });

  it("does NOT notify the HR owner when the submitter is the owner", async () => {
    // hrOwnerId matches auth.session.userId ("user-1")
    const panelSameOwner = {
      id: "panel-1",
      candidateId: "cand-1",
      candidate: { fullName: "Alice Johnson", hrOwnerId: "user-1" }
    };
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue(panelSameOwner as any);
    vi.mocked(prisma.interviewFeedback.upsert).mockResolvedValue({ id: "fb-self" } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 5, recommendation: "strong_yes" })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(200);
    await Promise.resolve();
    expect(vi.mocked(createNotification)).not.toHaveBeenCalled();
  });

  it("stores valid competencyJson entries in the upsert call", async () => {
    const competencies = [
      { id: "comp-1", name: "Problem Solving", rating: 4, notes: "Sharp" },
      { id: "comp-2", name: "Communication", rating: 3 }
    ];
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue({
      ...mockPanel,
      candidate: { fullName: "Bob", hrOwnerId: null }
    } as any);
    vi.mocked(prisma.interviewFeedback.upsert).mockResolvedValue({ id: "fb-comp" } as any);

    const res = await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 4, competencyJson: competencies })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(vi.mocked(prisma.interviewFeedback.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ competencyJson: competencies }),
        update: expect.objectContaining({ competencyJson: competencies })
      })
    );
  });

  it("omits competencyJson from upsert when array is empty", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as any);
    vi.mocked(prisma.interviewPanel.findUnique).mockResolvedValue({
      ...mockPanel,
      candidate: { fullName: "Carol", hrOwnerId: null }
    } as any);
    vi.mocked(prisma.interviewFeedback.upsert).mockResolvedValue({ id: "fb-empty" } as any);

    await POST(
      new Request("http://localhost/api/interviews/panel-1/feedback", {
        method: "POST",
        body: JSON.stringify({ overallRating: 2, competencyJson: [] })
      }),
      { params: Promise.resolve({ panelId: "panel-1" }) }
    );

    const upsertCall = vi.mocked(prisma.interviewFeedback.upsert).mock.calls[0]![0] as {
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    };
    expect(upsertCall.create).toHaveProperty("competencyJson", undefined);
    expect(upsertCall.update).not.toHaveProperty("competencyJson");
  });
});

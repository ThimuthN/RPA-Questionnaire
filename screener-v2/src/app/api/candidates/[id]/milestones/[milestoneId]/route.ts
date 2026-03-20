import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  candidateMilestoneModeValues,
  candidateMilestoneStatusValues
} from "@/lib/candidates/milestones";
import {
  attachExistingAssessmentToMilestone,
  quickUpdateCandidateMilestoneStatus,
  updateCandidateMilestone
} from "@/lib/db/candidates";

const saveMilestoneSchema = z.object({
  action: z.literal("save").default("save"),
  title: z.string().min(2),
  status: z.enum(candidateMilestoneStatusValues),
  mode: z.enum(candidateMilestoneModeValues).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  score: z.string().optional(),
  recommendation: z.string().optional()
});

const quickStatusSchema = z.object({
  action: z.literal("status"),
  status: z.enum(candidateMilestoneStatusValues)
});

const linkExistingSchema = z.object({
  action: z.literal("link_existing"),
  attemptId: z.string().optional(),
  inviteSlug: z.string().optional()
});

function redirectToCandidate(request: Request, candidateId: string, searchKey: string, value = "1") {
  const url = new URL(`/candidates/${candidateId}`, request.url);
  url.searchParams.set(searchKey, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const { id, milestoneId } = await params;

  try {
    const raw = Object.fromEntries((await request.formData()).entries());
    const action = typeof raw.action === "string" ? raw.action : "save";

    if (action === "status") {
      const body = quickStatusSchema.parse(raw);
      await quickUpdateCandidateMilestoneStatus(id, milestoneId, body.status);
      return redirectToCandidate(request, id, "updated");
    }

    if (action === "link_existing") {
      const body = linkExistingSchema.parse(raw);
      await attachExistingAssessmentToMilestone({
        candidateId: id,
        milestoneId,
        attemptId: body.attemptId,
        inviteSlug: body.inviteSlug,
        createdById: session.userId ?? undefined
      });
      return redirectToCandidate(request, id, "updated");
    }

    const body = saveMilestoneSchema.parse(raw);
    const parsedScore =
      typeof body.score === "string" && body.score.trim().length > 0 ? Number(body.score) : undefined;

    if (typeof parsedScore === "number" && !Number.isFinite(parsedScore)) {
      throw new Error("Score must be a number.");
    }

    await updateCandidateMilestone(id, milestoneId, {
      title: body.title,
      status: body.status,
      mode: body.mode,
      date: body.date,
      notes: body.notes,
      score: parsedScore,
      recommendation: body.recommendation
    });

    return redirectToCandidate(request, id, "updated");
  } catch (error) {
    return redirectToCandidate(
      request,
      id,
      "error",
      error instanceof Error ? error.message : "Could not update milestone."
    );
  }
}

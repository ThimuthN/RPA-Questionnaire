import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import {
  candidateMilestoneResultValues,
  candidateMilestoneModeValues,
  candidateMilestoneStatusValues,
  milestoneCheckDefs,
  checkTypeValues,
  type CheckType
} from "@/lib/candidates/milestones";
import {
  initOrUpdateMilestoneCheck,
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
  result: z.enum(candidateMilestoneResultValues).optional().or(z.literal("")),
  recommendation: z.string().optional()
});

const quickStatusSchema = z.object({
  action: z.literal("status"),
  status: z.enum(candidateMilestoneStatusValues)
});

const checkSchema = z.object({
  action: z.literal("check"),
  checkType: z.string().refine((val): val is CheckType => checkTypeValues.includes(val as CheckType)),
  status: z.string(),
  notes: z.string().optional()
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
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id, milestoneId } = await params;

  try {
    const raw = Object.fromEntries((await request.formData()).entries());
    const action = typeof raw.action === "string" ? raw.action : "save";

    if (action === "status") {
      const body = quickStatusSchema.parse(raw);
      await quickUpdateCandidateMilestoneStatus(id, milestoneId, body.status);
      return redirectToCandidate(request, id, "updated");
    }

    if (action === "check") {
      const body = checkSchema.parse(raw);
      await initOrUpdateMilestoneCheck(
        id,
        milestoneId,
        body.checkType,
        body.status,
        body.notes,
        session.userId ?? undefined,
        session.name ?? undefined
      );
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
      result: body.result || undefined,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id: candidateId, milestoneId } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const milestone = await tx.candidateMilestone.findUnique({
        where: { id: milestoneId },
        select: { title: true, mode: true, type: true }
      });

      if (!milestone) {
        throw new Error("Milestone not found");
      }

      await tx.candidateMilestone.delete({
        where: { id: milestoneId }
      });

      await tx.candidateActivityEvent.create({
        data: {
          id: cuidLike(),
          candidateId,
          actorId: session.userId ?? null,
          actorName: session.name ?? null,
          event: "milestone_deleted",
          entityType: "milestone",
          entityId: milestoneId,
          detail: `${milestone.title} (${milestone.mode || milestone.type})`,
          createdAt: new Date()
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete milestone." },
      { status: 400 }
    );
  }
}

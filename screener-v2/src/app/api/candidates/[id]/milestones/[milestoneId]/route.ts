import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import {
  candidateMilestoneResultValues,
  candidateMilestoneModeValues,
  candidateMilestoneStatusValues,
  checkTypeValues,
  type CheckType
} from "@/lib/candidates/milestones";
import {
  initOrUpdateMilestoneCheck,
  quickUpdateCandidateMilestoneStatus,
  upsertInterviewPanelForMilestone,
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
  recommendation: z.string().optional(),
  interviewScheduledAt: z.string().optional(),
  interviewDurationMin: z.string().optional(),
  interviewFormat: z.string().optional(),
  interviewerIdsJson: z.string().optional(),
  returnTo: z.string().optional()
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

function redirectToPath(
  request: Request,
  candidateId: string,
  returnTo: string | undefined,
  searchKey: string,
  value = "1"
) {
  const safePath = returnTo?.trim().startsWith("/") ? returnTo.trim() : `/people/candidates/${candidateId}`;
  const url = new URL(safePath, request.url);
  url.searchParams.set(searchKey, value);
  return NextResponse.redirect(url, 303);
}

class MilestoneNotFoundError extends Error {}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id, milestoneId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) {
    return permission.response;
  }

  const { session } = auth;
  let returnTo: string | undefined;

  try {
    const raw = Object.fromEntries((await request.formData()).entries());
    returnTo = typeof raw.returnTo === "string" ? raw.returnTo : undefined;
    const action = typeof raw.action === "string" ? raw.action : "save";

    if (action === "status") {
      const body = quickStatusSchema.parse(raw);
      await quickUpdateCandidateMilestoneStatus(id, milestoneId, body.status, session.userId ?? undefined, session.name || session.email || "System");
      return redirectToPath(request, id, returnTo, "updated");
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
      return redirectToPath(request, id, returnTo, "updated");
    }

    const body = saveMilestoneSchema.parse(raw);
    const parsedScore =
      typeof body.score === "string" && body.score.trim().length > 0 ? Number(body.score) : undefined;
    const parsedInterviewDuration =
      typeof body.interviewDurationMin === "string" && body.interviewDurationMin.trim().length > 0
        ? Number(body.interviewDurationMin)
        : undefined;

    if (typeof parsedScore === "number" && !Number.isFinite(parsedScore)) {
      throw new Error("Score must be a number.");
    }
    if (typeof parsedInterviewDuration === "number" && !Number.isFinite(parsedInterviewDuration)) {
      throw new Error("Interview duration must be a number.");
    }

    await updateCandidateMilestone(id, milestoneId, {
      title: body.title,
      status: body.status,
      mode: body.mode,
      date: body.date,
      notes: body.notes,
      score: parsedScore,
      result: body.result || undefined,
      recommendation: body.recommendation,
      actorId: session.userId ?? undefined,
      actorName: session.name || session.email || "System"
    });

    if (
      body.interviewScheduledAt !== undefined ||
      body.interviewDurationMin !== undefined ||
      body.interviewFormat !== undefined ||
      body.interviewerIdsJson !== undefined
    ) {
      const interviewerIds = typeof body.interviewerIdsJson === "string" && body.interviewerIdsJson.trim().length > 0
        ? JSON.parse(body.interviewerIdsJson)
        : [];

      if (!Array.isArray(interviewerIds) || interviewerIds.some((value) => typeof value !== "string")) {
        throw new Error("Interviewers are invalid.");
      }

      await upsertInterviewPanelForMilestone({
        candidateId: id,
        milestoneId,
        scheduledAt: body.interviewScheduledAt,
        durationMin: parsedInterviewDuration,
        format: body.interviewFormat,
        interviewerIds,
        actorId: session.userId ?? undefined,
        actorName: session.name || session.email || "System"
      });
    }

    return redirectToPath(request, id, returnTo, "updated");
  } catch (error) {
    return redirectToPath(
      request,
      id,
      returnTo,
      "error",
      error instanceof z.ZodError ? "Invalid milestone update." : "Could not update milestone."
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id: candidateId, milestoneId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireCandidatePermission(auth.session, candidateId, "manage_candidates");
  if (!permission.ok) {
    return permission.response;
  }

  const { session } = auth;

  try {
    await prisma.$transaction(async (tx) => {
      const milestone = await tx.candidateMilestone.findUnique({
        where: { id: milestoneId },
        select: { candidateId: true, title: true, mode: true, type: true }
      });

      if (!milestone) {
        throw new MilestoneNotFoundError();
      }

      if (milestone.candidateId !== candidateId) {
        throw new MilestoneNotFoundError();
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
    if (error instanceof MilestoneNotFoundError) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Could not delete milestone." },
      { status: 400 }
    );
  }
}

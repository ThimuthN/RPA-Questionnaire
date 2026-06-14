import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getKitForPanel } from "@/lib/db/interview-kits";
import { createNotification } from "@/lib/notifications/service";

const competencyRatingSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().optional(),
});

const feedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5).nullable().optional(),
  recommendation: z.enum(["strong_yes", "yes", "neutral", "no", "strong_no"]).nullable().optional(),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  privateNotes: z.string().optional(),
  competencyJson: z.array(competencyRatingSchema).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;

  const [feedback, kit] = await Promise.all([
    prisma.interviewFeedback.findUnique({
      where: { panelId_interviewerId: { panelId, interviewerId: auth.session.userId! } },
      select: {
        id: true,
        overallRating: true,
        recommendation: true,
        strengths: true,
        concerns: true,
        privateNotes: true,
        competencyJson: true,
        submittedAt: true,
        interviewer: { select: { name: true, email: true } },
      },
    }),
    getKitForPanel(panelId),
  ]);

  return NextResponse.json({
    feedback: feedback
      ? {
          id: feedback.id,
          overallRating: feedback.overallRating,
          recommendation: feedback.recommendation,
          strengths: feedback.strengths,
          concerns: feedback.concerns,
          privateNotes: feedback.privateNotes,
          competencyJson: feedback.competencyJson,
          submittedAt: feedback.submittedAt?.toISOString() ?? null,
          interviewerName: feedback.interviewer.name ?? feedback.interviewer.email,
        }
      : null,
    kitCompetencies: kit?.competencies ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  if (!auth.session.userId) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { panelId } = await params;
    const body = feedbackSchema.parse(await request.json());

    const panel = await prisma.interviewPanel.findUnique({
      where: { id: panelId },
      select: {
        id: true,
        candidateId: true,
        candidate: { select: { fullName: true, hrOwnerId: true } },
      },
    });
    if (!panel) {
      return NextResponse.json({ ok: false, message: "Interview panel not found" }, { status: 404 });
    }

    const competencyJson = body.competencyJson && body.competencyJson.length > 0
      ? body.competencyJson
      : undefined;

    const feedback = await prisma.interviewFeedback.upsert({
      where: { panelId_interviewerId: { panelId, interviewerId: auth.session.userId } },
      create: {
        panelId,
        interviewerId: auth.session.userId,
        overallRating: body.overallRating ?? null,
        recommendation: body.recommendation ?? null,
        strengths: body.strengths?.trim() || null,
        concerns: body.concerns?.trim() || null,
        privateNotes: body.privateNotes?.trim() || null,
        competencyJson: competencyJson ?? undefined,
        submittedAt: new Date(),
      },
      update: {
        overallRating: body.overallRating ?? null,
        recommendation: body.recommendation ?? null,
        strengths: body.strengths?.trim() || null,
        concerns: body.concerns?.trim() || null,
        privateNotes: body.privateNotes?.trim() || null,
        ...(competencyJson !== undefined ? { competencyJson } : {}),
        submittedAt: new Date(),
      },
    });

    // Notify the candidate's HR owner that a scorecard was submitted (skip if submitter is owner)
    const hrOwnerId = panel.candidate?.hrOwnerId ?? null;
    if (hrOwnerId && hrOwnerId !== auth.session.userId) {
      void createNotification({
        userId: hrOwnerId,
        type: "scorecard_submitted",
        title: `Scorecard submitted for ${panel.candidate?.fullName ?? "candidate"}`,
        body: `An interviewer submitted feedback for the panel interview.`,
        entityType: "candidate",
        entityId: panel.candidateId,
        entityHref: `/people/candidates/${panel.candidateId}`,
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, feedbackId: feedback.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save scorecard";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

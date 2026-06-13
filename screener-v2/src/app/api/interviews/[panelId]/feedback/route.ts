import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const feedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5).nullable().optional(),
  recommendation: z.enum(["strong_yes", "yes", "neutral", "no", "strong_no"]).nullable().optional(),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  privateNotes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ panelId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { panelId } = await params;

  const feedback = await prisma.interviewFeedback.findUnique({
    where: { panelId_interviewerId: { panelId, interviewerId: auth.session.userId! } },
    select: {
      id: true,
      overallRating: true,
      recommendation: true,
      strengths: true,
      concerns: true,
      privateNotes: true,
      submittedAt: true,
      interviewer: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    feedback: feedback
      ? {
          id: feedback.id,
          overallRating: feedback.overallRating,
          recommendation: feedback.recommendation,
          strengths: feedback.strengths,
          concerns: feedback.concerns,
          privateNotes: feedback.privateNotes,
          submittedAt: feedback.submittedAt?.toISOString() ?? null,
          interviewerName: feedback.interviewer.name ?? feedback.interviewer.email,
        }
      : null,
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
      select: { id: true, candidateId: true },
    });
    if (!panel) {
      return NextResponse.json({ ok: false, message: "Interview panel not found" }, { status: 404 });
    }

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
        submittedAt: new Date(),
      },
      update: {
        overallRating: body.overallRating ?? null,
        recommendation: body.recommendation ?? null,
        strengths: body.strengths?.trim() || null,
        concerns: body.concerns?.trim() || null,
        privateNotes: body.privateNotes?.trim() || null,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, feedbackId: feedback.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save scorecard";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

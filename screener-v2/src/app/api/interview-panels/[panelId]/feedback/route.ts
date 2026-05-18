import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { submitInterviewFeedback, getInterviewPanelWithConsensus } from '@/lib/interviews/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const SubmitFeedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5).nullable().optional(),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']).nullable().optional(),
  competencyJson: z.record(z.number().int().min(1).max(5)).nullable().optional(),
  strengths: z.string().max(2000).nullable().optional(),
  concerns: z.string().max(2000).nullable().optional(),
  privateNotes: z.string().max(2000).nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.feedback.submit');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = SubmitFeedbackSchema.parse(body);

    if (!auth.session.userId) {
      return NextResponse.json(
        { ok: false, message: 'User not authenticated', requestId: context.requestId },
        { status: 401 },
      );
    }

    await submitInterviewFeedback({
      panelId: panelId,
      interviewerId: auth.session.userId,
      overallRating: parsed.overallRating ?? null,
      recommendation: parsed.recommendation ?? null,
      competencyJson: parsed.competencyJson ?? null,
      strengths: parsed.strengths ?? null,
      concerns: parsed.concerns ?? null,
      privateNotes: parsed.privateNotes ?? null,
    });

    const panelWithConsensus = await getInterviewPanelWithConsensus(panelId);

    return NextResponse.json({ ok: true, panel: panelWithConsensus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_feedback_submit_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to submit feedback', requestId: context.requestId },
      { status: 500 },
    );
  }
}

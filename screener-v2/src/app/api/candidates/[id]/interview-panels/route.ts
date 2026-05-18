import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { createInterviewPanel, getInterviewPanelsForCandidate } from '@/lib/interviews/queries';
import { createRequestLogContext, logRouteError, messageFromError } from '@/lib/server/logger';

const CreateInterviewPanelSchema = z.object({
  roundName: z.string().min(1).max(100),
  format: z.enum(['in_person', 'video', 'phone', 'async']),
  scheduledAt: z.string().datetime().nullable().optional(),
  durationMin: z.number().int().min(15).max(480).optional(),
  milestoneId: z.string().nullable().optional(),
  memberIds: z.array(z.string()).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.interview_panels.list');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const panels = await getInterviewPanelsForCandidate(id);
    return NextResponse.json({ ok: true, panels });
  } catch (error) {
    logRouteError('interview_panels_list_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch interview panels', requestId: context.requestId },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.interview_panels.create');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = CreateInterviewPanelSchema.parse(body);

    const panel = await createInterviewPanel({
      candidateId: id,
      roundNumber: 1, // will be auto-incremented in the query
      roundName: parsed.roundName,
      format: parsed.format,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
      durationMin: parsed.durationMin,
      milestoneId: parsed.milestoneId,
      createdById: auth.session.userId || undefined,
      memberIds: parsed.memberIds,
    });

    return NextResponse.json({ ok: true, panel }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_panel_create_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to create interview panel', requestId: context.requestId },
      { status: 500 },
    );
  }
}

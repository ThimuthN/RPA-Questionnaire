import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { updateInterviewPanel, deleteInterviewPanel } from '@/lib/interviews/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const UpdateInterviewPanelSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = UpdateInterviewPanelSchema.parse(body);

    const panel = await updateInterviewPanel(panelId, {
      status: parsed.status,
      scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined,
    });

    return NextResponse.json({ ok: true, panel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_panel_update_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to update interview panel', requestId: context.requestId },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.delete');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    await deleteInterviewPanel(panelId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError('interview_panel_delete_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to delete interview panel', requestId: context.requestId },
      { status: 500 },
    );
  }
}

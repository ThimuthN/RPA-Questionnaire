import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { updateInterviewPanel, getInterviewPanelDetail } from '@/lib/interviews/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const UpdateStatusSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
});

export async function POST(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.status.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = UpdateStatusSchema.parse(body);

    await updateInterviewPanel(panelId, { status: parsed.status });
    const panel = await getInterviewPanelDetail(panelId);

    return NextResponse.json({ ok: true, panel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_panel_status_update_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to update status', requestId: context.requestId },
      { status: 500 },
    );
  }
}

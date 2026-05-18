import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { addInterviewPanelMember, removeInterviewPanelMember, getInterviewPanelDetail } from '@/lib/interviews/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['lead', 'interviewer', 'observer']).optional(),
});

const RemoveMemberSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.members.add');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = AddMemberSchema.parse(body);

    await addInterviewPanelMember(panelId, parsed.userId, parsed.role);
    const panel = await getInterviewPanelDetail(panelId);

    return NextResponse.json({ ok: true, panel }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_panel_member_add_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to add interviewer', requestId: context.requestId },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ panelId: string }> }) {
  const { panelId } = await params;
  const context = createRequestLogContext(request, 'api.interview_panels.members.remove');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = RemoveMemberSchema.parse(body);

    await removeInterviewPanelMember(panelId, parsed.userId);
    const panel = await getInterviewPanelDetail(panelId);

    return NextResponse.json({ ok: true, panel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('interview_panel_member_remove_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to remove interviewer', requestId: context.requestId },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { updateGoal, getGoalDetail, deleteGoal, UpdateGoalInput } from '@/lib/goals/queries';
import { z } from 'zod';

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: z.enum(['performance', 'growth', 'learning', 'team']).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'on_hold']).optional(),
  targetDate: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
  progress: z.number().min(0).max(100).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { goalId } = await params;
  const context = createRequestLogContext(request, 'api.goals.get');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const goal = await getGoalDetail(goalId);
    if (!goal) {
      return NextResponse.json({ ok: false, message: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    logRouteError('goals_get', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { goalId } = await params;
  const context = createRequestLogContext(request, 'api.goals.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = updateGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: UpdateGoalInput = {};
    if (parsed.data.title !== undefined) input.title = parsed.data.title;
    if (parsed.data.description !== undefined) input.description = parsed.data.description;
    if (parsed.data.category !== undefined) input.category = parsed.data.category;
    if (parsed.data.status !== undefined) input.status = parsed.data.status;
    if (parsed.data.targetDate !== undefined) input.targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
    if (parsed.data.progress !== undefined) input.progress = parsed.data.progress;

    const goal = await updateGoal(goalId, input);
    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    logRouteError('goals_update', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { goalId } = await params;
  const context = createRequestLogContext(request, 'api.goals.delete');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    await deleteGoal(goalId);
    return NextResponse.json({ ok: true, message: 'Goal deleted' });
  } catch (error) {
    logRouteError('goals_delete', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

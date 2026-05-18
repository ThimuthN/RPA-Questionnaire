import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { createCheckIn, CreateCheckInInput, updateGoal } from '@/lib/goals/queries';
import { z } from 'zod';

const createCheckInSchema = z.object({
  notes: z.string().min(1).max(1000),
  progressSnapshot: z.number().min(0).max(100),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { goalId } = await params;
  const context = createRequestLogContext(request, 'api.goals.checkin.create');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = createCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: CreateCheckInInput = {
      goalId,
      notes: parsed.data.notes,
      progressSnapshot: parsed.data.progressSnapshot,
      createdById: auth.session.userId,
    };

    // Create check-in
    const checkIn = await createCheckIn(input);

    // Update goal progress to match check-in progress
    await updateGoal(goalId, { progress: parsed.data.progressSnapshot });

    return NextResponse.json({ ok: true, checkIn }, { status: 201 });
  } catch (error) {
    logRouteError('goals_checkin_create', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

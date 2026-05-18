import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { listEmployeeGoals, createGoal, CreateGoalInput } from '@/lib/goals/queries';
import { z } from 'zod';

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  category: z.enum(['performance', 'growth', 'learning', 'team']).optional(),
  targetDate: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.goals.list');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const goals = await listEmployeeGoals(id);
    return NextResponse.json({ ok: true, goals });
  } catch (error) {
    logRouteError('goals_list', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.goals.create');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: CreateGoalInput = {
      employeeId: id,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      category: parsed.data.category,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
      createdById: auth.session.userId,
    };

    const goal = await createGoal(input);
    return NextResponse.json({ ok: true, goal }, { status: 201 });
  } catch (error) {
    logRouteError('goals_create', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

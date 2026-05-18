import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { listEmployeeReviews, createReview, CreateReviewInput } from '@/lib/reviews/queries';
import { z } from 'zod';

const createReviewSchema = z.object({
  period: z.string().min(1).max(100),
  type: z.enum(['quarterly', 'mid_year', 'annual', 'probation']).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.reviews.list');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const reviews = await listEmployeeReviews(id);
    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    logRouteError('reviews_list', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.reviews.create');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: CreateReviewInput = {
      employeeId: id,
      reviewerId: auth.session.userId || 'system',
      period: parsed.data.period,
      type: parsed.data.type,
      status: 'draft',
    };

    const review = await createReview(input);
    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (error) {
    logRouteError('reviews_create', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

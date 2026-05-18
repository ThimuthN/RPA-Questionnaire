import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { updateReview, getReviewDetail, deleteReview, UpdateReviewInput } from '@/lib/reviews/queries';
import { z } from 'zod';

const updateReviewSchema = z.object({
  overallRating: z.number().min(1).max(5).optional().nullable(),
  strengths: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  nextPeriodFocus: z.string().optional().nullable(),
  status: z.enum(['draft', 'submitted', 'acknowledged']).optional(),
  employeeAcknowledgedAt: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  const { reviewId } = await params;
  const context = createRequestLogContext(request, 'api.reviews.get');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const review = await getReviewDetail(reviewId);
    if (!review) {
      return NextResponse.json({ ok: false, message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    logRouteError('reviews_get', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  const { reviewId } = await params;
  const context = createRequestLogContext(request, 'api.reviews.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: UpdateReviewInput = {};
    if (parsed.data.overallRating !== undefined) input.overallRating = parsed.data.overallRating;
    if (parsed.data.strengths !== undefined) input.strengths = parsed.data.strengths;
    if (parsed.data.improvements !== undefined) input.improvements = parsed.data.improvements;
    if (parsed.data.nextPeriodFocus !== undefined) input.nextPeriodFocus = parsed.data.nextPeriodFocus;
    if (parsed.data.status !== undefined) input.status = parsed.data.status;
    if (parsed.data.employeeAcknowledgedAt !== undefined) {
      input.employeeAcknowledgedAt = parsed.data.employeeAcknowledgedAt ? new Date(parsed.data.employeeAcknowledgedAt) : null;
    }

    const review = await updateReview(reviewId, input);
    return NextResponse.json({ ok: true, review });
  } catch (error) {
    logRouteError('reviews_update', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  const { reviewId } = await params;
  const context = createRequestLogContext(request, 'api.reviews.delete');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    await deleteReview(reviewId);
    return NextResponse.json({ ok: true, message: 'Review deleted' });
  } catch (error) {
    logRouteError('reviews_delete', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

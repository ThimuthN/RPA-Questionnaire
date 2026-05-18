import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { getCandidateOffer, createOrUpdateOffer } from '@/lib/offers/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const OfferSchema = z.object({
  compensationType: z.enum(['salary', 'hourly', 'contract']),
  compensationAmount: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().min(3).max(3).default('USD'),
  targetStartDate: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  offerNotes: z.string().max(5000).nullable().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.offer.get');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const offer = await getCandidateOffer(id);
    return NextResponse.json({ ok: true, offer });
  } catch (error) {
    logRouteError('offer_get_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to fetch offer', requestId: context.requestId },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.offer.create_update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = OfferSchema.parse(body);

    const offer = await createOrUpdateOffer({
      candidateId: id,
      compensationType: parsed.compensationType,
      compensationAmount: parsed.compensationAmount ?? null,
      currency: parsed.currency,
      targetStartDate: parsed.targetStartDate ? new Date(parsed.targetStartDate) : null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      offerNotes: parsed.offerNotes ?? null,
      createdById: auth.session.userId,
    });

    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('offer_create_update_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to save offer', requestId: context.requestId },
      { status: 500 },
    );
  }
}

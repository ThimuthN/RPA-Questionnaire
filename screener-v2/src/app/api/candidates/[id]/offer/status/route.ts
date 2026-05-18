import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession } from '@/lib/auth/guards';
import { updateOfferStatus, getCandidateOffer } from '@/lib/offers/queries';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';

const UpdateStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired', 'rescinded']),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.offer.status.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = UpdateStatusSchema.parse(body);

    // Check if offer exists
    const existing = await getCandidateOffer(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, message: 'Offer not found', requestId: context.requestId },
        { status: 404 },
      );
    }

    const offer = await updateOfferStatus(id, parsed.status);

    return NextResponse.json({ ok: true, offer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid input', errors: error.errors, requestId: context.requestId },
        { status: 400 },
      );
    }
    logRouteError('offer_status_update_failed', context, error);
    return NextResponse.json(
      { ok: false, message: 'Failed to update offer status', requestId: context.requestId },
      { status: 500 },
    );
  }
}

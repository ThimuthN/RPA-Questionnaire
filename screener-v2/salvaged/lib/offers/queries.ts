import { prisma } from '@/lib/db/prisma';
import { OfferStatus, CompensationType, CandidateOfferRecord } from './types';

export async function getCandidateOffer(candidateId: string): Promise<CandidateOfferRecord | null> {
  const offer = await prisma.candidateOffer.findUnique({
    where: { candidateId },
  });
  return offer as CandidateOfferRecord | null;
}

export async function createOrUpdateOffer(input: {
  candidateId: string;
  compensationType: CompensationType;
  compensationAmount: number | null;
  currency: string;
  targetStartDate: Date | null;
  expiresAt: Date | null;
  offerNotes: string | null;
  createdById?: string | null;
}): Promise<CandidateOfferRecord> {
  const offer = await prisma.candidateOffer.upsert({
    where: { candidateId: input.candidateId },
    update: {
      compensationType: input.compensationType,
      compensationAmount: input.compensationAmount,
      currency: input.currency,
      targetStartDate: input.targetStartDate,
      expiresAt: input.expiresAt,
      offerNotes: input.offerNotes,
    },
    create: {
      candidateId: input.candidateId,
      status: 'draft',
      compensationType: input.compensationType,
      compensationAmount: input.compensationAmount,
      currency: input.currency,
      targetStartDate: input.targetStartDate,
      expiresAt: input.expiresAt,
      offerNotes: input.offerNotes,
      createdById: input.createdById,
    },
  });

  return offer as CandidateOfferRecord;
}

export async function updateOfferStatus(candidateId: string, newStatus: OfferStatus): Promise<CandidateOfferRecord> {
  const updateData: any = { status: newStatus };

  // Auto-set sentAt on status change to 'sent'
  if (newStatus === 'sent') {
    updateData.sentAt = new Date();
  }

  // Auto-set respondedAt and expiresAt logic on acceptance/decline
  if (newStatus === 'accepted' || newStatus === 'declined') {
    updateData.respondedAt = new Date();
  }

  const offer = await prisma.candidateOffer.update({
    where: { candidateId },
    data: updateData,
  });

  return offer as CandidateOfferRecord;
}

export async function deleteOffer(candidateId: string): Promise<void> {
  await prisma.candidateOffer.delete({
    where: { candidateId },
  });
}

export async function getOffersAboutToExpire(daysUntilExpiry: number = 7): Promise<CandidateOfferRecord[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

  const offers = await prisma.candidateOffer.findMany({
    where: {
      status: 'sent',
      expiresAt: {
        lte: thresholdDate,
        gt: now,
      },
    },
  });

  return offers as CandidateOfferRecord[];
}

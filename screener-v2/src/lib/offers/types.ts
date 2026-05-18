// Offer management types

export const OfferStatuses = ['draft', 'sent', 'accepted', 'declined', 'expired', 'rescinded'] as const;
export type OfferStatus = (typeof OfferStatuses)[number];

export const CompensationTypes = ['salary', 'hourly', 'contract'] as const;
export type CompensationType = (typeof CompensationTypes)[number];

export interface CandidateOfferRecord {
  id: string;
  candidateId: string;
  status: OfferStatus;
  compensationType: CompensationType;
  compensationAmount: number | null; // in cents
  currency: string;
  targetStartDate: Date | null;
  expiresAt: Date | null;
  offerNotes: string | null;
  sentAt: Date | null;
  respondedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const OfferStatusLabels: Record<OfferStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  rescinded: 'Rescinded',
};

export const OfferStatusTones: Record<OfferStatus, 'neutral' | 'blue' | 'emerald' | 'red' | 'amber'> = {
  draft: 'neutral',
  sent: 'blue',
  accepted: 'emerald',
  declined: 'red',
  expired: 'amber',
  rescinded: 'red',
};

export function formatCompensation(amount: number | null, type: CompensationType, currency: string): string {
  if (amount === null) return '—';
  const dollars = (amount / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const suffix = type === 'salary' ? '/year' : type === 'hourly' ? '/hour' : '';
  return `${currency} ${dollars}${suffix}`;
}

export function daysUntilExpiry(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

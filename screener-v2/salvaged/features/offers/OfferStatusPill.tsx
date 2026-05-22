'use client';

import { StatusPill } from '@/components/primitives/StatusPill';
import { OfferStatus, OfferStatusLabels, OfferStatusTones } from '@/lib/offers/types';

interface OfferStatusPillProps {
  status: string;
  className?: string;
}

export function OfferStatusPill({ status, className }: OfferStatusPillProps) {
  const tone = (OfferStatusTones[status as OfferStatus] || 'neutral') as any;
  const label = OfferStatusLabels[status as OfferStatus] || status;

  return <StatusPill label={label} tone={tone} className={className} />;
}

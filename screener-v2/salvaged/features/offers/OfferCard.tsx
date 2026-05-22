'use client';

import { CandidateOfferRecord } from '@/lib/offers/types';
import { formatCompensation, daysUntilExpiry } from '@/lib/offers/types';
import { OfferStatusPill } from './OfferStatusPill';
import { StatusPill } from '@/components/primitives/StatusPill';
import { Button } from '@/components/primitives/Button';

interface OfferCardProps {
  offer: CandidateOfferRecord;
  onEdit?: () => void;
  onSend?: () => void;
  onMarkAccepted?: () => void;
  onMarkDeclined?: () => void;
  onRescind?: () => void;
  canEdit?: boolean;
}

export function OfferCard({
  offer,
  onEdit,
  onSend,
  onMarkAccepted,
  onMarkDeclined,
  onRescind,
  canEdit = true,
}: OfferCardProps) {
  const daysLeft = daysUntilExpiry(offer.expiresAt);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && offer.status === 'sent';

  return (
    <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-[color:var(--app-heading)]">
            {formatCompensation(offer.compensationAmount, offer.compensationType, offer.currency)}
          </span>
          <span className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.12em]">
            {offer.compensationType}
          </span>
        </div>
        <OfferStatusPill status={offer.status} />
      </div>

      {/* Details row */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
            Start date
          </p>
          <p className="text-[color:var(--app-text)] font-medium">
            {offer.targetStartDate ? new Date(offer.targetStartDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) : 'TBD'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
            Expiry
          </p>
          <p className="text-[color:var(--app-text)] font-medium">
            {offer.expiresAt ? (
              <>
                {new Date(offer.expiresAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                {isExpiringSoon && daysLeft !== null && (
                  <span className="text-[color:var(--app-danger)] text-xs font-semibold">
                    ({daysLeft}d left)
                  </span>
                )}
              </>
            ) : (
              'N/A'
            )}
          </p>
        </div>
      </div>

      {/* Expiry warning */}
      {isExpiringSoon && (
        <div className="mb-4 rounded-[16px] border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-3 py-2">
          <p className="text-xs font-medium text-[color:var(--pill-amber-text)]">
            ⚠️ Expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </p>
        </div>
      )}

      {/* Notes preview */}
      {offer.offerNotes && (
        <div className="mb-4">
          <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-2">
            Notes
          </p>
          <p className="text-sm text-[color:var(--app-text)] line-clamp-2">{offer.offerNotes}</p>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          {offer.status === 'draft' && (
            <>
              {onEdit && (
                <Button variant="secondary" onClick={onEdit} className="text-xs flex-1">
                  Edit
                </Button>
              )}
              {onSend && (
                <Button variant="primary" onClick={onSend} className="text-xs flex-1">
                  Send Offer
                </Button>
              )}
            </>
          )}

          {offer.status === 'sent' && (
            <>
              {onMarkAccepted && (
                <Button variant="primary" onClick={onMarkAccepted} className="text-xs flex-1">
                  Mark Accepted
                </Button>
              )}
              {onMarkDeclined && (
                <Button variant="secondary" onClick={onMarkDeclined} className="text-xs flex-1">
                  Declined
                </Button>
              )}
              {onRescind && (
                <Button variant="ghost" onClick={onRescind} className="text-xs">
                  Rescind
                </Button>
              )}
            </>
          )}

          {offer.status === 'accepted' && onEdit && (
            <Button variant="secondary" onClick={onEdit} className="text-xs flex-1">
              Edit Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

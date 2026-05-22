'use client';

import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { CandidateOfferRecord } from '@/lib/offers/types';
import { formatCompensation } from '@/lib/offers/types';

interface HireConfirmModalProps {
  isOpen: boolean;
  candidateName: string;
  offer: CandidateOfferRecord;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function HireConfirmModal({
  isOpen,
  candidateName,
  offer,
  onConfirm,
  onCancel,
}: HireConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="🎉 Confirm Hire" onClose={onCancel} maxWidth="max-w-sm">
      <div className="grid gap-5">
        <div>
          <p className="text-sm text-[color:var(--app-text)] mb-3">
            You&apos;re about to move <strong>{candidateName}</strong> from candidate to hired.
          </p>
          <div className="rounded-[18px] bg-[color:var(--app-surface-soft)] p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em]">
                Compensation
              </span>
              <span className="text-sm font-semibold text-[color:var(--app-brand)]">
                {formatCompensation(offer.compensationAmount, offer.compensationType, offer.currency)}
              </span>
            </div>
            {offer.targetStartDate && (
              <div className="flex justify-between">
                <span className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em]">
                  Start Date
                </span>
                <span className="text-sm font-semibold text-[color:var(--app-text)]">
                  {new Date(offer.targetStartDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[16px] border border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] px-3 py-2">
          <p className="text-xs text-[color:var(--pill-blue-text)]">
            ℹ️ In Phase 3, this will create an employee record automatically. For now, the candidate status will be marked as closed.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-6 py-2 text-sm font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={isLoading}
          className="px-6"
        >
          {isLoading ? 'Confirming...' : 'Confirm Hire'}
        </Button>
      </div>
    </Modal>
  );
}

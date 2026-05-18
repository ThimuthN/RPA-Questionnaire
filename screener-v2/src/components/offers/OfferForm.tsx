'use client';

import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { ChoicePills } from '@/components/primitives/ChoicePills';
import { CandidateOfferRecord } from '@/lib/offers/types';

interface OfferFormProps {
  isOpen: boolean;
  initialOffer?: CandidateOfferRecord | null;
  onClose: () => void;
  onSubmit: (data: {
    compensationType: 'salary' | 'hourly' | 'contract';
    compensationAmount: number | null;
    currency: string;
    targetStartDate: Date | null;
    expiresAt: Date | null;
    offerNotes: string | null;
  }) => Promise<void>;
}

export function OfferForm({ isOpen, initialOffer, onClose, onSubmit }: OfferFormProps) {
  const [compensationType, setCompensationType] = useState<'salary' | 'hourly' | 'contract'>(
    initialOffer?.compensationType as any || 'salary',
  );
  const [amount, setAmount] = useState<string>(initialOffer?.compensationAmount ? String(initialOffer.compensationAmount / 100) : '');
  const [currency, setCurrency] = useState(initialOffer?.currency || 'USD');
  const [startDate, setStartDate] = useState(
    initialOffer?.targetStartDate ? new Date(initialOffer.targetStartDate).toISOString().split('T')[0] : '',
  );
  const [expiryDate, setExpiryDate] = useState(
    initialOffer?.expiresAt ? new Date(initialOffer.expiresAt).toISOString().split('T')[0] : '',
  );
  const [notes, setNotes] = useState(initialOffer?.offerNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        compensationType,
        compensationAmount: amount ? Math.round(parseFloat(amount) * 100) : null,
        currency,
        targetStartDate: startDate ? new Date(startDate) : null,
        expiresAt: expiryDate ? new Date(expiryDate) : null,
        offerNotes: notes || null,
      });
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCompensationType('salary');
    setAmount('');
    setCurrency('USD');
    setStartDate('');
    setExpiryDate('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Offer Details" onClose={handleClose} maxWidth="max-w-xl">
      <div className="grid gap-5">
        {/* Compensation Type */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Compensation type</label>
          <ChoicePills
            name="type"
            options={[
              { value: 'salary', label: 'Salary' },
              { value: 'hourly', label: 'Hourly' },
              { value: 'contract', label: 'Contract' },
            ]}
            value={compensationType}
            onChange={(val) => setCompensationType(val as any)}
            idPrefix="comp-type"
          />
        </div>

        {/* Amount and Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 grid gap-2">
            <label className="text-sm font-medium text-[color:var(--app-text)]">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 150000"
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[color:var(--app-text)]">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Target start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
        </div>

        {/* Expiry Date */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Offer expires</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">Leave blank for no expiry</p>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Includes 3 weeks PTO, work from anywhere..."
            rows={3}
            maxLength={5000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{notes.length} / 5000</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-6 py-2 text-sm font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition-colors"
        >
          Cancel
        </button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!amount.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? 'Saving...' : 'Save Offer'}
        </Button>
      </div>
    </Modal>
  );
}

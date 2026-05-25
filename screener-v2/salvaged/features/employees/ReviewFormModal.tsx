'use client';

import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { Star } from 'lucide-react';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    overallRating: number;
    strengths: string;
    improvements: string;
    nextPeriodFocus: string;
  }) => Promise<void>;
}

export function ReviewFormModal({ isOpen, onClose, onSubmit }: ReviewFormModalProps) {
  const [rating, setRating] = useState(5);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextPeriodFocus, setNextPeriodFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!strengths.trim() || !improvements.trim()) return;

    try {
      setIsLoading(true);
      await onSubmit({
        overallRating: rating,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        nextPeriodFocus: nextPeriodFocus.trim(),
      });
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setStrengths('');
    setImprovements('');
    setNextPeriodFocus('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Complete Performance Review" onClose={handleClose} maxWidth="max-w-2xl">
      <div className="grid gap-5">
        {/* Rating selector */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Overall Rating</label>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                className="p-1 transition hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    i < rating
                      ? 'fill-[color:var(--app-brand)] text-[color:var(--app-brand)]'
                      : 'text-[color:var(--app-border)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Strengths</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="What are this employee's key strengths?"
            rows={3}
            maxLength={2000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{strengths.length} / 2000</p>
        </div>

        {/* Improvements */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Areas for Improvement</label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            placeholder="What areas should this employee focus on improving?"
            rows={3}
            maxLength={2000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{improvements.length} / 2000</p>
        </div>

        {/* Next period focus */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Next Period Focus</label>
          <textarea
            value={nextPeriodFocus}
            onChange={(e) => setNextPeriodFocus(e.target.value)}
            placeholder="What should be the focus for the next review period?"
            rows={3}
            maxLength={2000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{nextPeriodFocus.length} / 2000</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-6 py-2 text-sm font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!strengths.trim() || !improvements.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </Modal>
  );
}

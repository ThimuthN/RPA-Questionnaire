'use client';

import { PerformanceReviewRecord } from '@/lib/reviews/types';
import { ReviewTypeLabels, ReviewStatusLabels, ReviewStatusTones } from '@/lib/reviews/types';
import { StatusPill } from '@/components/primitives/StatusPill';
import { Star } from 'lucide-react';

interface PerformanceReviewCardProps {
  review: PerformanceReviewRecord;
  isReviewer?: boolean;
  isEmployee?: boolean;
  onEditClick?: () => void;
  onAcknowledgeClick?: () => void;
}

export function PerformanceReviewCard({
  review,
  isReviewer = false,
  isEmployee = false,
  onEditClick,
  onAcknowledgeClick,
}: PerformanceReviewCardProps) {
  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-[color:var(--app-heading)]">
            {review.period}
          </h3>
          <p className="text-xs text-[color:var(--app-muted)] mt-1">
            {ReviewTypeLabels[review.type]}
          </p>
        </div>
        <StatusPill
          label={ReviewStatusLabels[review.status]}
          tone={ReviewStatusTones[review.status] as any}
        />
      </div>

      {/* Rating display */}
      {review.overallRating && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.overallRating!
                    ? 'fill-[color:var(--app-brand)] text-[color:var(--app-brand)]'
                    : 'text-[color:var(--app-border)]'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-[color:var(--app-text)]">
            {review.overallRating}.0 / 5.0
          </span>
        </div>
      )}

      {/* Content sections */}
      <div className="space-y-3">
        {review.strengths && (
          <div>
            <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
              Strengths
            </p>
            <p className="text-sm text-[color:var(--app-text)] line-clamp-3">{review.strengths}</p>
          </div>
        )}

        {review.improvements && (
          <div>
            <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
              Areas for Improvement
            </p>
            <p className="text-sm text-[color:var(--app-text)] line-clamp-3">{review.improvements}</p>
          </div>
        )}

        {review.nextPeriodFocus && (
          <div>
            <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
              Next Period Focus
            </p>
            <p className="text-sm text-[color:var(--app-text)] line-clamp-3">
              {review.nextPeriodFocus}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[color:var(--app-border)]">
        {isReviewer && review.status === 'draft' && onEditClick && (
          <button
            onClick={onEditClick}
            className="flex-1 py-2 px-3 rounded-[12px] bg-[color:var(--app-brand)] text-white text-xs font-medium hover:opacity-90 transition"
          >
            Complete Review
          </button>
        )}

        {isEmployee && review.status === 'submitted' && !review.employeeAcknowledgedAt && onAcknowledgeClick && (
          <button
            onClick={onAcknowledgeClick}
            className="flex-1 py-2 px-3 rounded-[12px] bg-[color:var(--app-brand)] text-white text-xs font-medium hover:opacity-90 transition"
          >
            Acknowledge
          </button>
        )}

        {review.employeeAcknowledgedAt && (
          <div className="flex-1 py-2 px-3 rounded-[12px] bg-[color:var(--pill-emerald-bg)] text-[color:var(--pill-emerald-text)] text-xs font-medium text-center">
            ✓ Acknowledged
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { InterviewPanelDetail, RecommendationLabels, RecommendationTones } from '@/lib/interviews/types';
import { InterviewStatusPill } from './InterviewStatusPill';
import { deriveInterviewConsensus } from '@/lib/interviews/consensus';
import { StatusPill } from '@/components/primitives/StatusPill';
import { Button } from '@/components/primitives/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface InterviewRoundCardProps {
  panel: InterviewPanelDetail;
  currentUserId: string;
  onRequestFeedback?: (panelId: string) => void;
  onEdit?: (panelId: string) => void;
  onCancel?: (panelId: string) => void;
  canEdit?: boolean;
}

export function InterviewRoundCard({
  panel,
  currentUserId,
  onRequestFeedback,
  onEdit,
  onCancel,
  canEdit = true,
}: InterviewRoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const consensus = deriveInterviewConsensus(panel.feedbacks);
  const hasPendingFeedback = panel.members.some((m) => m.userId === currentUserId) &&
    !panel.feedbacks.some((f) => f.interviewerId === currentUserId && f.submittedAt);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      layout
      className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5 backdrop-blur-sm hover:-translate-y-[2px] transition-transform"
    >
      {/* Header (always visible) */}
      <div className="flex items-center gap-4">
        {/* Round number badge */}
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[color:var(--app-brand)] text-white text-sm font-semibold">
          R{panel.roundNumber}
        </div>

        {/* Title and format */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">{panel.roundName}</h3>
          <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em]">
            {panel.format.split('_').join(' ')} • {formatDate(panel.scheduledAt)}
          </p>
        </div>

        {/* Status and consensus */}
        <div className="flex items-center gap-3">
          <InterviewStatusPill status={panel.status} />
          {consensus.submittedFeedbacks > 0 && (
            <StatusPill
              label={`${consensus.submittedFeedbacks}/${consensus.totalFeedbacks}`}
              tone="teal"
            />
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-[color:var(--app-surface-muted)] transition-colors"
          aria-expanded={isExpanded}
        >
          <ChevronDown
            className="h-5 w-5 text-[color:var(--app-text)] transition-transform"
            style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}
          />
        </button>
      </div>

      {/* Pending feedback banner */}
      {hasPendingFeedback && (
        <div className="mt-4 rounded-[16px] border border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[color:var(--pill-amber-text)]">
            You have feedback to submit
          </p>
          {onRequestFeedback && (
            <button
              onClick={() => onRequestFeedback(panel.id)}
              className="text-xs font-semibold text-[color:var(--pill-amber-text)] hover:opacity-70"
            >
              Submit →
            </button>
          )}
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="mt-4 grid gap-4 overflow-hidden"
          >
            {/* Interviewers */}
            <div>
              <p className="text-xs font-semibold text-[color:var(--app-muted)] uppercase tracking-[0.12em] mb-2">
                Interviewers
              </p>
              <div className="flex flex-wrap gap-2">
                {panel.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-[12px] bg-[color:var(--app-surface-soft)] px-3 py-2"
                  >
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--app-brand)] text-white text-xs font-semibold">
                      {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-[color:var(--app-text)]">{member.user.name || 'Unknown'}</div>
                      <div className="text-xs text-[color:var(--app-muted)]">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consensus summary */}
            {consensus.submittedFeedbacks > 0 && (
              <div>
                <p className="text-xs font-semibold text-[color:var(--app-muted)] uppercase tracking-[0.12em] mb-2">
                  Consensus
                </p>
                <div className="grid gap-2">
                  {consensus.averageRating !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[color:var(--app-text)]">Avg rating:</span>
                      <span className="text-sm font-semibold text-[color:var(--app-brand)]">
                        {consensus.averageRating.toFixed(1)} / 5
                      </span>
                    </div>
                  )}
                  {consensus.aggregatedRecommendation && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[color:var(--app-text)]">Recommendation:</span>
                      <StatusPill
                        label={RecommendationLabels[consensus.aggregatedRecommendation]}
                        tone={RecommendationTones[consensus.aggregatedRecommendation] as any}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Individual feedbacks */}
            {panel.feedbacks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[color:var(--app-muted)] uppercase tracking-[0.12em] mb-2">
                  Feedback
                </p>
                <div className="grid gap-3">
                  {panel.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="rounded-[16px] bg-[color:var(--app-surface-muted)] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--app-heading)]">
                            {feedback.interviewer.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-[color:var(--app-muted)]">{feedback.interviewer.email}</p>
                        </div>
                        {feedback.submittedAt && (
                          <StatusPill label="Submitted" tone="emerald" />
                        )}
                      </div>

                      {feedback.submittedAt && (
                        <div className="grid gap-2 text-sm">
                          {feedback.overallRating && (
                            <div>
                              <span className="text-xs font-medium text-[color:var(--app-muted)]">Rating:</span>
                              <span className="ml-2 font-semibold text-[color:var(--app-brand)]">
                                {feedback.overallRating} / 5
                              </span>
                            </div>
                          )}
                          {feedback.recommendation && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[color:var(--app-muted)]">Recommendation:</span>
                              <StatusPill
                                label={RecommendationLabels[feedback.recommendation]}
                                tone={RecommendationTones[feedback.recommendation] as any}
                              />
                            </div>
                          )}
                          {feedback.strengths && (
                            <div>
                              <p className="text-xs font-medium text-[color:var(--app-muted)]">Strengths</p>
                              <p className="text-sm text-[color:var(--app-text)]">{feedback.strengths}</p>
                            </div>
                          )}
                          {feedback.concerns && (
                            <div>
                              <p className="text-xs font-medium text-[color:var(--app-muted)]">Concerns</p>
                              <p className="text-sm text-[color:var(--app-text)]">{feedback.concerns}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2 pt-2">
                {onRequestFeedback && hasPendingFeedback && (
                  <Button
                    variant="primary"
                    onClick={() => onRequestFeedback(panel.id)}
                    className="flex-1 text-xs"
                  >
                    Submit Feedback
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="secondary"
                    onClick={() => onEdit(panel.id)}
                    className="flex-1 text-xs"
                  >
                    Edit
                  </Button>
                )}
                {onCancel && panel.status === 'scheduled' && (
                  <Button
                    variant="danger"
                    onClick={() => onCancel(panel.id)}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { ChoicePills } from '@/components/primitives/ChoicePills';
import { InterviewRecommendation, InterviewRecommendations, CompetencyCategories } from '@/lib/interviews/types';

interface InterviewFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    overallRating?: number | null;
    recommendation?: InterviewRecommendation | null;
    competencyJson?: Record<string, number> | null;
    strengths?: string | null;
    concerns?: string | null;
    privateNotes?: string | null;
  }) => Promise<void>;
  showCompetencies?: boolean;
  showPrivateNotes?: boolean;
}

export function InterviewFeedbackForm({
  isOpen,
  onClose,
  onSubmit,
  showCompetencies = true,
  showPrivateNotes = true,
}: InterviewFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<InterviewRecommendation | null>(null);
  const [competencies, setCompetencies] = useState<Record<string, number>>({
    communication: 3,
    technical: 3,
    culture_fit: 3,
    problem_solving: 3,
  });
  const [strengths, setStrengths] = useState('');
  const [concerns, setConcerns] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateNotesField, setShowPrivateNotesField] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit({
        overallRating: overallRating || null,
        recommendation: recommendation || null,
        competencyJson: showCompetencies ? competencies : null,
        strengths: strengths || null,
        concerns: concerns || null,
        privateNotes: showPrivateNotes && privateNotes ? privateNotes : null,
      });
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOverallRating(null);
    setRecommendation(null);
    setCompetencies({ communication: 3, technical: 3, culture_fit: 3, problem_solving: 3 });
    setStrengths('');
    setConcerns('');
    setPrivateNotes('');
    setShowPrivateNotesField(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Submit Interview Feedback" onClose={handleClose} maxWidth="max-w-2xl">
      <div className="grid gap-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Overall Rating (5 stars) */}
        <div className="grid gap-3">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Overall rating</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setOverallRating(star)}
                className="text-3xl transition-transform hover:scale-110"
              >
                {star <= (overallRating || 0) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Recommendation</label>
          <ChoicePills
            name="recommendation"
            options={InterviewRecommendations.map((rec) => ({
              value: rec,
              label: rec.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            }))}
            value={recommendation || ''}
            onChange={(val) => setRecommendation(val as InterviewRecommendation)}
            idPrefix="interview-recommendation"
          />
        </div>

        {/* Competencies (if enabled) */}
        {showCompetencies && (
          <div className="grid gap-3">
            <label className="text-sm font-medium text-[color:var(--app-text)]">Competency ratings</label>
            {CompetencyCategories.map((category) => (
              <div key={category} className="flex items-center gap-4">
                <label className="w-32 text-xs font-medium text-[color:var(--app-text)] uppercase tracking-[0.08em]">
                  {category.split('_').join(' ')}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={competencies[category] || 3}
                  onChange={(e) =>
                    setCompetencies({ ...competencies, [category]: parseInt(e.target.value) })
                  }
                  className="flex-1 h-2 rounded-full accent-[color:var(--app-brand)]"
                />
                <span className="w-8 text-center text-sm font-mono font-medium text-[color:var(--app-brand)]">
                  {competencies[category] || 3}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Strengths</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="What did the candidate do well?"
            rows={3}
            maxLength={2000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{strengths.length} / 2000</p>
        </div>

        {/* Concerns */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Concerns</label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Any areas for improvement?"
            rows={3}
            maxLength={2000}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
          <p className="text-xs text-[color:var(--app-muted)]">{concerns.length} / 2000</p>
        </div>

        {/* Private Notes (if enabled and toggled) */}
        {showPrivateNotes && (
          <div className="grid gap-2">
            <button
              onClick={() => setShowPrivateNotesField(!showPrivateNotesField)}
              className="flex items-center gap-2 text-sm font-medium text-[color:var(--app-text)] hover:text-[color:var(--app-brand)] transition-colors"
            >
              {showPrivateNotesField ? '🔒 Hide' : '🔒 Add'} private notes
            </button>
            {showPrivateNotesField && (
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="For hiring manager only. Not shared with candidate."
                rows={2}
                maxLength={2000}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm resize-none focus:border-[color:var(--app-brand)]/50 focus:outline-none"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={handleClose}
          className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-6 py-2 text-sm font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition-colors"
        >
          Cancel
        </button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading} className="px-6">
          {isLoading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { ChoicePills } from '@/components/primitives/ChoicePills';
import { InterviewFormat, InterviewFormats } from '@/lib/interviews/types';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  candidateId: string;
  onClose: () => void;
  onSubmit: (data: {
    roundName: string;
    format: InterviewFormat;
    scheduledAt: Date | null;
    durationMin: number;
    memberIds: string[];
  }) => Promise<void>;
  interviewers: Array<{ id: string; name: string | null; email: string }>;
}

const RoundPresets = ['Technical Screen', 'Culture Fit', 'Final Round', 'Panel'];
const DurationOptions = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '90 min', value: 90 },
];

export function InterviewScheduleModal({
  isOpen,
  candidateId,
  onClose,
  onSubmit,
  interviewers,
}: InterviewScheduleModalProps) {
  const [roundName, setRoundName] = useState('');
  const [format, setFormat] = useState<InterviewFormat>('in_person');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!roundName.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        roundName,
        format,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        durationMin,
        memberIds: selectedInterviewers,
      });
      resetForm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRoundName('');
    setFormat('in_person');
    setScheduledAt('');
    setDurationMin(60);
    setSelectedInterviewers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Schedule Interview" onClose={handleClose} maxWidth="max-w-xl">
      <div className="grid gap-5">
        {/* Round name with presets */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Round name</label>
          <div className="grid gap-2">
            <input
              type="text"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="e.g., Technical Screen"
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {RoundPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setRoundName(preset)}
                  className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1 text-xs font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-soft)] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Format */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Format</label>
          <ChoicePills
            name="format"
            options={InterviewFormats.map((f) => ({
              value: f,
              label: f.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            }))}
            value={format}
            onChange={(val) => setFormat(val as InterviewFormat)}
            idPrefix="interview-format"
          />
        </div>

        {/* Scheduled date/time */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Scheduled date & time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          />
        </div>

        {/* Duration */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Duration</label>
          <select
            value={durationMin}
            onChange={(e) => setDurationMin(parseInt(e.target.value))}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm focus:border-[color:var(--app-brand)]/50 focus:outline-none"
          >
            {DurationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Interviewers */}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[color:var(--app-text)]">Interviewers</label>
          <div className="max-h-48 overflow-y-auto rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-2">
            {interviewers.length === 0 ? (
              <p className="p-2 text-xs text-[color:var(--app-muted)]">No interviewers available</p>
            ) : (
              interviewers.map((interviewer) => (
                <label
                  key={interviewer.id}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-2 hover:bg-[color:var(--app-surface)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedInterviewers.includes(interviewer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInterviewers([...selectedInterviewers, interviewer.id]);
                      } else {
                        setSelectedInterviewers(selectedInterviewers.filter((id) => id !== interviewer.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-[color:var(--app-border)] accent-[color:var(--app-brand)]"
                  />
                  <div className="min-w-0 text-sm">
                    <div className="font-medium text-[color:var(--app-text)]">{interviewer.name || 'Unknown'}</div>
                    <div className="text-[color:var(--app-muted)]">{interviewer.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedInterviewers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInterviewers.map((id) => {
                const interviewer = interviewers.find((i) => i.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-full bg-[color:var(--app-brand-soft)] px-3 py-1 text-xs text-[color:var(--app-brand)]"
                  >
                    {interviewer?.name || interviewer?.email}
                    <button
                      onClick={() => setSelectedInterviewers(selectedInterviewers.filter((rid) => rid !== id))}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
          disabled={!roundName.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? 'Scheduling...' : 'Schedule Interview'}
        </Button>
      </div>
    </Modal>
  );
}

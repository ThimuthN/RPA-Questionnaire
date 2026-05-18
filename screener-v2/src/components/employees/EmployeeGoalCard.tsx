'use client';

import { useState } from 'react';
import { EmployeeGoalDetail } from '@/lib/goals/types';
import { GoalCategoryColors, GoalCategoryLabels, GoalStatusLabels, GoalStatusTones } from '@/lib/goals/types';
import { StatusPill } from '@/components/primitives/StatusPill';
import { GoalProgressRing } from './GoalProgressRing';
import { ChevronDown } from 'lucide-react';

interface EmployeeGoalCardProps {
  goal: EmployeeGoalDetail;
  onUpdate?: (goalId: string, progress: number, status?: string) => void;
}

export function EmployeeGoalCard({ goal, onUpdate }: EmployeeGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingCheckIn, setIsAddingCheckIn] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInProgress, setCheckInProgress] = useState(goal.progress);

  const handleAddCheckIn = async () => {
    if (!checkInNotes.trim()) return;

    try {
      // In a real implementation, this would call the API
      // For now, we'll just update local state
      setCheckInNotes('');
      setCheckInProgress(goal.progress);
      setIsAddingCheckIn(false);
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
  };

  const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && goal.status === 'active';

  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-4 space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between gap-3 hover:opacity-80 transition"
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold`}
            style={{ backgroundColor: `var(--pill-${GoalCategoryColors[goal.category]}-bg)` }}
          >
            {GoalCategoryLabels[goal.category]?.charAt(0) || 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-[color:var(--app-heading)] truncate">
              {goal.title}
            </h4>
            <p className="text-xs text-[color:var(--app-muted)] mt-0.5">
              {GoalCategoryLabels[goal.category]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GoalProgressRing progress={goal.progress} size={40} strokeWidth={2} />
          <ChevronDown
            className={`w-4 h-4 text-[color:var(--app-muted)] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Status and deadline pills */}
      <div className="flex gap-2 flex-wrap">
        <StatusPill
          label={GoalStatusLabels[goal.status]}
          tone={GoalStatusTones[goal.status] as any}
        />
        {goal.targetDate && (
          <StatusPill
            label={
              isOverdue
                ? `Overdue`
                : `Due ${new Date(goal.targetDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}`
            }
            tone={isOverdue ? 'red' : 'neutral'}
          />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[color:var(--app-border)] pt-3 space-y-3">
          {goal.description && (
            <p className="text-sm text-[color:var(--app-text)]">{goal.description}</p>
          )}

          {/* Check-ins history */}
          {goal.checkIns && goal.checkIns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em]">
                Recent Check-ins
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {goal.checkIns.slice(0, 3).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="rounded-[12px] bg-[color:var(--app-surface)] p-2 text-xs"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-[color:var(--app-text)]">
                        {checkIn.progressSnapshot}%
                      </span>
                      <span className="text-[color:var(--app-muted)]">
                        {new Date(checkIn.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-[color:var(--app-text)] line-clamp-2">{checkIn.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add check-in form */}
          {!isAddingCheckIn && goal.status === 'active' && (
            <button
              onClick={() => setIsAddingCheckIn(true)}
              className="w-full py-2 px-3 rounded-[12px] border border-[color:var(--app-border)] text-xs font-medium text-[color:var(--app-brand)] hover:bg-[color:var(--app-surface)] transition"
            >
              + Add Check-in
            </button>
          )}

          {isAddingCheckIn && (
            <div className="space-y-2 border-t border-[color:var(--app-border)] pt-3">
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                placeholder="Add notes about progress..."
                className="w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs focus:outline-none focus:border-[color:var(--app-brand)]"
                rows={2}
              />
              <div className="space-y-1">
                <label className="text-xs text-[color:var(--app-muted)] font-medium">
                  Progress: {checkInProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={checkInProgress}
                  onChange={(e) => setCheckInProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCheckIn}
                  disabled={!checkInNotes.trim()}
                  className="flex-1 py-1.5 px-3 rounded-[10px] bg-[color:var(--app-brand)] text-white text-xs font-medium disabled:opacity-50 hover:opacity-90 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAddingCheckIn(false);
                    setCheckInNotes('');
                    setCheckInProgress(goal.progress);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-[10px] border border-[color:var(--app-border)] text-xs font-medium hover:bg-[color:var(--app-surface)] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

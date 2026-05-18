'use client';

import { StatusPill } from '@/components/primitives/StatusPill';
import { InterviewPanelStatus } from '@/lib/interviews/types';

const StatusToneMap: Record<InterviewPanelStatus, 'teal' | 'blue' | 'amber' | 'red' | 'neutral'> = {
  scheduled: 'teal',
  completed: 'teal',
  cancelled: 'red',
  no_show: 'amber',
};

const StatusLabelMap: Record<InterviewPanelStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

interface InterviewStatusPillProps {
  status: string;
  className?: string;
}

export function InterviewStatusPill({ status, className }: InterviewStatusPillProps) {
  const tone = (StatusToneMap[status as InterviewPanelStatus] || 'neutral') as any;
  const label = StatusLabelMap[status as InterviewPanelStatus] || status;

  return <StatusPill label={label} tone={tone} className={className} />;
}

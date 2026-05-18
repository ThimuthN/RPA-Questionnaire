export enum ReviewType {
  Quarterly = 'quarterly',
  MidYear = 'mid_year',
  Annual = 'annual',
  Probation = 'probation',
}

export enum ReviewStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Acknowledged = 'acknowledged',
}

export interface PerformanceReviewRecord {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  type: string;
  status: string;
  overallRating: number | null;
  strengths: string | null;
  improvements: string | null;
  nextPeriodFocus: string | null;
  employeeAcknowledgedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReviewDetail extends PerformanceReviewRecord {
  reviewer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export const ReviewTypeLabels: Record<string, string> = {
  quarterly: 'Quarterly',
  mid_year: 'Mid-Year',
  annual: 'Annual',
  probation: 'Probation',
};

export const ReviewStatusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
};

export const ReviewStatusTones: Record<string, string> = {
  draft: 'neutral',
  submitted: 'blue',
  acknowledged: 'emerald',
};

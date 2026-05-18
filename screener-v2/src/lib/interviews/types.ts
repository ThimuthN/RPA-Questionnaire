// Interview panel and feedback types

export const InterviewFormats = ['in_person', 'video', 'phone', 'async'] as const;
export type InterviewFormat = (typeof InterviewFormats)[number];

export const InterviewPanelStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;
export type InterviewPanelStatus = (typeof InterviewPanelStatuses)[number];

export const InterviewMemberRoles = ['lead', 'interviewer', 'observer'] as const;
export type InterviewMemberRole = (typeof InterviewMemberRoles)[number];

export const InterviewRecommendations = ['strong_yes', 'yes', 'maybe', 'no', 'strong_no'] as const;
export type InterviewRecommendation = (typeof InterviewRecommendations)[number];

export const CompetencyCategories = ['communication', 'technical', 'culture_fit', 'problem_solving'] as const;
export type CompetencyCategory = (typeof CompetencyCategories)[number];

export interface CompetencyScores {
  [key: string]: number; // 1-5 rating
}

export interface InterviewPanelRecord {
  id: string;
  candidateId: string;
  milestoneId: string | null;
  roundNumber: number;
  roundName: string;
  format: InterviewFormat;
  scheduledAt: Date | null;
  durationMin: number;
  status: InterviewPanelStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewPanelMemberRecord {
  id: string;
  panelId: string;
  userId: string;
  role: InterviewMemberRole;
  createdAt: Date;
}

export interface InterviewFeedbackRecord {
  id: string;
  panelId: string;
  interviewerId: string;
  overallRating: number | null;
  recommendation: InterviewRecommendation | null;
  competencyJson: CompetencyScores | null;
  strengths: string | null;
  concerns: string | null;
  privateNotes: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewPanelDetail extends InterviewPanelRecord {
  members: (InterviewPanelMemberRecord & { user: { id: string; name: string | null; email: string } })[];
  feedbacks: (InterviewFeedbackRecord & {
    interviewer: { id: string; name: string | null; email: string };
  })[];
}

export interface InterviewConsensus {
  totalFeedbacks: number;
  submittedFeedbacks: number;
  averageRating: number | null;
  recommendations: {
    strong_yes: number;
    yes: number;
    maybe: number;
    no: number;
    strong_no: number;
  };
  aggregatedRecommendation: InterviewRecommendation | null;
}

export const RecommendationLevels: Record<InterviewRecommendation, number> = {
  strong_yes: 5,
  yes: 4,
  maybe: 3,
  no: 2,
  strong_no: 1,
};

export const RecommendationLabels: Record<InterviewRecommendation, string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
  strong_no: 'Strong No',
};

export const RecommendationTones: Record<InterviewRecommendation, 'emerald' | 'teal' | 'amber' | 'red'> = {
  strong_yes: 'emerald',
  yes: 'teal',
  maybe: 'amber',
  no: 'red',
  strong_no: 'red',
};

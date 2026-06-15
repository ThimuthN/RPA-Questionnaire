import type {
  ExamDefinitionId,
  ExamQuestion
} from "@/lib/assessment-engine/types";

export const candidateApplicationStatusValues = [
  "submitted",
  "under_review",
  "moved_to_pipeline",
  "closed"
] as const;

export type CandidateApplicationStatus = (typeof candidateApplicationStatusValues)[number];

export const candidateApplicationStatusLabels: Record<CandidateApplicationStatus, string> = {
  submitted: "Applied",
  under_review: "Under review",
  moved_to_pipeline: "In pipeline",
  closed: "Archived"
};

export function isCandidateApplicationStatus(value: string): value is CandidateApplicationStatus {
  return (candidateApplicationStatusValues as readonly string[]).includes(value);
}

export type JobPostingListItem = {
  id: string;
  slug: string;
  title: string;
  departmentId?: string;
  roleId?: string;
  roleLabel?: string;
  roleDepartment?: string;
  screenerPresetId?: string;
  screenerPresetLabel?: string;
  summary: string;
  description: string;
  isPublished: boolean;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  applicantCount: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  teamSize?: number;
  techStack?: string;
  remotePolicy?: string;
};

export type JobPostingDetail = JobPostingListItem & {
  recentApplications: CandidateApplicationListItem[];
};

export type AssignmentSummaryEntry = {
  name: string;
  role: string;
};

export type CandidateApplicationListItem = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateOwner?: string;
  hasResume: boolean;
  jobPostingId: string;
  jobSlug: string;
  jobTitle: string;
  roleLabel?: string;
  coverNote?: string;
  source?: string;
  referredBy?: string;
  appliedAt: string;
  updatedAt: string;
  status: CandidateApplicationStatus;
  teamAssignments?: AssignmentSummaryEntry[];
};

export type ApplicationScreeningStatus = "passed" | "failed" | "needs_review";

export type ApplicationScreeningQuestion = ExamQuestion & {
  sortOrder: number;
};

export type ApplicationScreeningAddon = {
  key: string;
  addonId?: string;
  addonSlug: string;
  addonLabel: string;
  assessmentTypeId: ExamDefinitionId;
  configSummary: string;
  durationMinutes: number;
  requiredPercent: number;
  weight: number;
  isMandatory: boolean;
  inlineSupported: boolean;
  inlineSupportReason?: string;
  sortOrder: number;
  questions: ApplicationScreeningQuestion[];
};

export type ApplicationScreeningPackage = {
  presetId: string;
  presetLabel: string;
  addons: ApplicationScreeningAddon[];
};

export type ApplicationScreeningResponseItem = {
  addonLabel: string;
  questionKey: string;
  questionLabel: string;
  formatLabel: string;
  answerText: string | null;
  pointsEarned: number;
  pointsPossible: number;
  sortOrder: number;
};

export type ApplicationScreeningAddonResultItem = {
  addonId?: string;
  addonLabel: string;
  requiredPercent: number;
  weight: number;
  isMandatory: boolean;
  inlineSupported: boolean;
  status: ApplicationScreeningStatus;
  applicantPercent: number | null;
  pointsEarned: number;
  pointsPossible: number;
  responses: ApplicationScreeningResponseItem[];
};

export function isActiveApplicationStatus(status: CandidateApplicationStatus) {
  return status === "submitted" || status === "under_review";
}

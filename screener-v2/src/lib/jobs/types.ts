export const candidateApplicationStatusValues = [
  "submitted",
  "under_review",
  "moved_to_pipeline",
  "closed"
] as const;

export type CandidateApplicationStatus = (typeof candidateApplicationStatusValues)[number];

export const candidateApplicationStatusLabels: Record<CandidateApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  moved_to_pipeline: "Moved to pipeline",
  closed: "Closed"
};

export function isCandidateApplicationStatus(value: string): value is CandidateApplicationStatus {
  return (candidateApplicationStatusValues as readonly string[]).includes(value);
}

export type JobPostingListItem = {
  id: string;
  slug: string;
  title: string;
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
  teamSize?: number;
  techStack?: string;
  remotePolicy?: string;
};

export type JobPostingDetail = JobPostingListItem & {
  recentApplications: CandidateApplicationListItem[];
};

export type CandidateApplicationListItem = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateOwner?: string;
  candidateIntakeBucket: "pipeline" | "applicant";
  hasResume: boolean;
  jobPostingId: string;
  jobSlug: string;
  jobTitle: string;
  roleLabel?: string;
  coverNote?: string;
  appliedAt: string;
  updatedAt: string;
  status: CandidateApplicationStatus;
};

export function isActiveApplicationStatus(status: CandidateApplicationStatus) {
  return status === "submitted" || status === "under_review";
}

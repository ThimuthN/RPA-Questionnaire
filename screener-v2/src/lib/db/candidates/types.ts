import type {
  CandidateAssessmentStatus,
  CandidateNextAction,
  CandidateNoteType,
  CandidateScreeningStatus,
  CandidateStage
} from "@/lib/candidates/types";
import type {
  CheckType,
  CandidateMilestoneMode,
  CandidateMilestoneResult,
  CandidateMilestoneStatus,
  CandidateMilestoneType
} from "@/lib/candidates/milestones";
import type {
  CandidateListSort,
  CandidateOpenWorkSummary,
  CandidateWorkspaceItem
} from "@/lib/candidates/workspace";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";

export interface CandidateRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId?: string;
  roleLabel?: string;
  roleDepartment?: string;
  departmentId?: string;
  departmentName?: string;
  positionAppliedFor?: string;
  batchId?: string;
  resumeSource?: string;
  hrOwner?: string;
  hrOwnerId?: string;
  stage: CandidateStage;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  orgStatus?: "active" | "talent_pool" | "org_rejected";
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  candidateFolderUrl?: string;
  notesSummary?: string;
  linkedInUrl?: string;
  location?: string;
  currentTitle?: string;
  salaryExpectation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateResumeRecord {
  id: string;
  candidateId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
  uploadedAt: string;
}

export interface CandidateNoteRecord {
  id: string;
  candidateId: string;
  type: CandidateNoteType;
  body: string;
  createdAt: string;
  deletedAt?: string;
  createdById?: string;
  createdByName?: string;
  createdByEmail?: string;
}

export interface CandidateAssessmentRecord {
  id: string;
  inviteId: string;
  inviteSlug: string;
  entryUrl?: string;
  attemptId?: string;
  createdAt: string;
  createdById?: string;
  status: CandidateAssessmentStatus;
  startedAt?: string;
  submittedAt?: string;
  finalPercent?: number;
  pass?: boolean;
  borderline?: boolean;
}

export interface CandidateApplicationRecord {
  id: string;
  candidateId: string;
  jobPostingId: string;
  jobSlug: string;
  jobTitle: string;
  roleLabel?: string;
  roleDepartment?: string;
  status: CandidateApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateMilestoneCheckRecord {
  id: string;
  type: CheckType;
  status: string;
  notes?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateInterviewPanelRecord {
  id: string;
  candidateId: string;
  milestoneId?: string;
  roundNumber: number;
  roundName: string;
  format: string;
  scheduledAt?: string;
  durationMin: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export interface CandidateMilestoneRecord {
  id: string;
  candidateId: string;
  type: CandidateMilestoneType;
  title: string;
  status: CandidateMilestoneStatus;
  sortOrder: number;
  mode: CandidateMilestoneMode;
  date?: string;
  notes?: string;
  score?: number;
  result?: CandidateMilestoneResult;
  recommendation?: string;
  candidateAssessmentId?: string;
  createdAt: string;
  updatedAt: string;
  assessment?: CandidateAssessmentRecord | null;
  interviewPanel?: CandidateInterviewPanelRecord | null;
  checks?: CandidateMilestoneCheckRecord[];
}

export interface CandidateListItem extends CandidateRecord {
  hasResume: boolean;
  latestResumeStorageKey?: string;
  currentFocus?: string;
  latestAssessment: CandidateAssessmentRecord | null;
  teamOwnerSummary?: string;
  teamOwnerId?: string;
  teamMemberCount?: number;
}

export interface CandidateActivityEventRecord {
  id: string;
  actorId?: string;
  actorName?: string;
  event: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
  createdAt: string;
}

export interface DepartmentCandidacyDetail {
  id: string;
  candidateId: string;
  departmentId: string;
  roleId?: string;
  hrOwnerId?: string;
  status: "active" | "talent_pool" | "dept_rejected" | "transferred_out";
  source: "manual" | "job_application" | "nominated";
  nominatedBy?: string;
  nominationNote?: string;
  jobPostingId?: string;
  department: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    label: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CandidateDetail extends CandidateRecord {
  resumes: CandidateResumeRecord[];
  notes: CandidateNoteRecord[];
  assessments: CandidateAssessmentRecord[];
  applications: CandidateApplicationRecord[];
  milestones: CandidateMilestoneRecord[];
  departmentCandidacies?: DepartmentCandidacyDetail[];
  activityEvents: CandidateActivityEventRecord[];
  currentFocus?: string;
}

export interface CandidateWorkspaceFilters {
  q?: string;
  roleId?: string;
  jobId?: string;
  stage?: CandidateStage;
  stageValues?: string[];
  departmentId?: string;
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  owner?: string;
  assessmentStatus?: CandidateAssessmentStatus;
  sort?: CandidateListSort;
  page?: number;
  pageSize?: number;
}

export interface CandidateWorkspacePage {
  rows: CandidateWorkspaceItem[];
  total: number;
  page: number;
  pageSize: number;
  roleOptions: Array<{ id: string; label: string; departmentId?: string }>;
  ownerOptions: Array<{ id: string; label: string }>;
  summary: CandidateOpenWorkSummary;
}

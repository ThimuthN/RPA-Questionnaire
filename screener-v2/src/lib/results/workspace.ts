import type {
  AssessmentContextType,
  ResultReviewState,
  ResultSummary
} from "@/lib/assessment-engine/types";
import type {
  CandidateNextAction,
  CandidateStage
} from "@/lib/candidates/types";
import { getIntegrityRiskLevel, getIntegrityRiskScore, getResultStatus, type IntegrityRiskLevel, type ResultStatusFilter } from "@/lib/results/triage";

export type ResultListSort = "newest" | "score_desc" | "score_asc" | "risk_desc" | "stale_desc";
export type ResultScoreBand = "high" | "mid" | "low";

export interface WorkspaceResultRow extends ResultSummary {
  contextType: AssessmentContextType;
  reviewState: ResultReviewState;
  submittedAt: string;
  candidateId?: string;
  candidateOwner?: string;
  candidateRoleId?: string;
  candidateRoleLabel?: string;
  candidateStage?: CandidateStage;
  candidateNextAction?: CandidateNextAction;
  candidateLatestActivityAt?: string;
  candidateStaleDays?: number;
  candidateNotesSummary?: string;
  integrityRisk: IntegrityRiskLevel;
  resultStatus: ResultStatusFilter;
}

export interface ResultsWorkspaceFilters {
  q?: string;
  status?: ResultStatusFilter;
  reviewState?: ResultReviewState;
  contextType?: AssessmentContextType;
  integrity?: IntegrityRiskLevel;
  role?: string;
  owner?: string;
  stage?: CandidateStage;
  scoreBand?: ResultScoreBand;
  sort?: ResultListSort;
}

type WorkspaceResultExtras = {
  contextType?: AssessmentContextType;
  reviewState?: ResultReviewState;
  submittedAt?: string;
  candidateId?: string;
  candidateRoleId?: string;
  candidateRoleLabel?: string;
  candidateOwner?: string;
  candidateStage?: CandidateStage;
  candidateNextAction?: CandidateNextAction;
  candidateLatestActivityAt?: string;
  candidateStaleDays?: number;
  candidateNotesSummary?: string;
};

export function scoreBandForResult(finalPercent: number): ResultScoreBand {
  if (finalPercent >= 75) return "high";
  if (finalPercent >= 50) return "mid";
  return "low";
}

export function filterResultWorkspaceRows(rows: WorkspaceResultRow[], filters: ResultsWorkspaceFilters) {
  const query = filters.q?.trim().toLowerCase() ?? "";
  const filtered = rows.filter((row) => {
    if (query) {
      const haystack = [
        row.candidateName ?? "",
        row.candidateEmail ?? "",
        row.candidateRoleLabel ?? "",
        row.candidateOwner ?? "",
        row.candidateNotesSummary ?? ""
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.status && row.resultStatus !== filters.status) return false;
    if (filters.reviewState && row.reviewState !== filters.reviewState) return false;
    if (filters.contextType && row.contextType !== filters.contextType) return false;
    if (filters.integrity && row.integrityRisk !== filters.integrity) return false;
    if (filters.role && row.candidateRoleId !== filters.role) return false;
    if (filters.owner && (row.candidateOwner || "") !== filters.owner) return false;
    if (filters.stage && row.candidateStage !== filters.stage) return false;
    if (filters.scoreBand && scoreBandForResult(row.finalPercent) !== filters.scoreBand) return false;
    return true;
  });

  const sort = filters.sort ?? "newest";
  return [...filtered].sort((left, right) => {
    if (sort === "score_desc") return right.finalPercent - left.finalPercent;
    if (sort === "score_asc") return left.finalPercent - right.finalPercent;
    if (sort === "risk_desc") return getIntegrityRiskScore(right) - getIntegrityRiskScore(left);
    if (sort === "stale_desc") return Number(right.candidateStaleDays ?? 0) - Number(left.candidateStaleDays ?? 0);
    return Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
  });
}

export function toWorkspaceResultRow(
  row: ResultSummary,
  extras?: WorkspaceResultExtras
): WorkspaceResultRow {
  return {
    ...row,
    contextType: extras?.contextType ?? row.contextType ?? "general",
    reviewState: extras?.reviewState ?? row.reviewState ?? "unreviewed",
    submittedAt: extras?.submittedAt ?? new Date().toISOString(),
    candidateId: extras?.candidateId,
    candidateRoleId: extras?.candidateRoleId,
    candidateRoleLabel: extras?.candidateRoleLabel,
    candidateOwner: extras?.candidateOwner,
    candidateStage: extras?.candidateStage,
    candidateNextAction: extras?.candidateNextAction,
    candidateLatestActivityAt: extras?.candidateLatestActivityAt,
    candidateStaleDays: extras?.candidateStaleDays,
    candidateNotesSummary: extras?.candidateNotesSummary,
    integrityRisk: getIntegrityRiskLevel(row),
    resultStatus: getResultStatus(row)
  };
}

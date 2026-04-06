import {
  assessmentContextTypeValues,
  resultReviewStateValues,
  type AssessmentContextType,
  type ResultReviewState
} from "@/lib/assessment-engine/types";
import { candidateStageValues, type CandidateStage } from "@/lib/candidates/types";
import type { IntegrityRiskLevel, ResultStatusFilter } from "@/lib/results/triage";
import type { ResultListSort, ResultsWorkspaceFilters, ResultScoreBand } from "@/lib/results/workspace";

export const resultStatusFilterValues = ["pass", "review", "fail"] as const;
export const integrityRiskLevelValues = ["clean", "watch", "review"] as const;
export const resultListSortValues = ["newest", "score_desc", "score_asc", "risk_desc", "stale_desc"] as const;
export const resultScoreBandValues = ["high", "mid", "low"] as const;

export type ResultsWorkspaceQuery = ResultsWorkspaceFilters & {
  page?: number;
  pageSize?: number;
};

type ResultsWorkspacePaginationOverrides = Pick<ResultsWorkspaceQuery, "page" | "pageSize">;
type ResultsWorkspaceQuerySource = URLSearchParams | Readonly<Record<string, string | undefined>>;

function getOptionalString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getOptionalEnum<T extends string>(value: string | null | undefined, options: readonly T[]) {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

function getPositiveInteger(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function toResultsWorkspaceSearchParams(values: Readonly<Record<string, string | undefined>>) {
  return new URLSearchParams(
    Object.entries(values).filter(([, value]) => typeof value === "string" && value.length > 0) as [string, string][]
  );
}

export function parseResultsWorkspaceQuery(
  source: ResultsWorkspaceQuerySource,
  overrides: ResultsWorkspacePaginationOverrides = {}
): ResultsWorkspaceQuery {
  const searchParams = source instanceof URLSearchParams ? source : toResultsWorkspaceSearchParams(source);

  return {
    q: getOptionalString(searchParams.get("q")),
    status: getOptionalEnum<ResultStatusFilter>(searchParams.get("status"), resultStatusFilterValues),
    reviewState: getOptionalEnum<ResultReviewState>(searchParams.get("reviewState"), resultReviewStateValues),
    contextType: getOptionalEnum<AssessmentContextType>(searchParams.get("contextType"), assessmentContextTypeValues),
    integrity: getOptionalEnum<IntegrityRiskLevel>(searchParams.get("integrity"), integrityRiskLevelValues),
    role: getOptionalString(searchParams.get("role")),
    owner: getOptionalString(searchParams.get("owner")),
    stage: getOptionalEnum<CandidateStage>(searchParams.get("stage"), candidateStageValues),
    scoreBand: getOptionalEnum<ResultScoreBand>(searchParams.get("scoreBand"), resultScoreBandValues),
    sort: getOptionalEnum<ResultListSort>(searchParams.get("sort"), resultListSortValues),
    page: overrides.page ?? getPositiveInteger(searchParams.get("page"), 1),
    pageSize: overrides.pageSize ?? getPositiveInteger(searchParams.get("pageSize"), 12)
  };
}

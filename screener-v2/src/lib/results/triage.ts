import type { ResultSummary } from "@/lib/assessment-engine/types";

export type IntegrityRiskLevel = "clean" | "watch" | "review";
export type ResultStatusFilter = "pass" | "review" | "fail";
export type ResultSortKey = "newest" | "score_desc" | "score_asc" | "risk_desc";

export interface ResultsFilters {
  q?: string;
  status?: ResultStatusFilter;
  integrity?: IntegrityRiskLevel;
  role?: ResultSummary["roleId"];
  sort?: ResultSortKey;
}

export function getIntegrityRiskScore(row: Pick<ResultSummary, "integrity">) {
  return row.integrity.tabHiddenCount * 2 + row.integrity.copyCount + row.integrity.pasteCount;
}

export function getIntegrityRiskLevel(row: Pick<ResultSummary, "integrity">): IntegrityRiskLevel {
  const score = getIntegrityRiskScore(row);
  if (score >= 6) return "review";
  if (score >= 2) return "watch";
  return "clean";
}

export function getResultStatus(row: Pick<ResultSummary, "pass" | "borderline">): ResultStatusFilter {
  if (row.pass) return "pass";
  if (row.borderline) return "review";
  return "fail";
}

export function filterAndSortResults(rows: ResultSummary[], filters: ResultsFilters) {
  const query = filters.q?.trim().toLowerCase() ?? "";
  const filtered = rows.filter((row) => {
    if (query) {
      const haystack = [row.candidateName ?? "", row.candidateEmail ?? ""].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.status && getResultStatus(row) !== filters.status) return false;
    if (filters.integrity && getIntegrityRiskLevel(row) !== filters.integrity) return false;
    if (filters.role && row.roleId !== filters.role) return false;
    return true;
  });

  const sort = filters.sort ?? "newest";
  return [...filtered].sort((left, right) => {
    if (sort === "score_desc") return right.finalPercent - left.finalPercent;
    if (sort === "score_asc") return left.finalPercent - right.finalPercent;
    if (sort === "risk_desc") return getIntegrityRiskScore(right) - getIntegrityRiskScore(left);
    return 0;
  });
}

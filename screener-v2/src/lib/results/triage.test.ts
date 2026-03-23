import { describe, expect, it } from "vitest";
import {
  filterAndSortResults,
  getIntegrityRiskLevel,
  getIntegrityRiskScore
} from "@/lib/results/triage";

const rows = [
  {
    attemptId: "attempt-1",
    candidateName: "Alex Perera",
    candidateEmail: "alex@example.com",
    roleId: "Associate",
    pass: true,
    borderline: false,
    finalPercent: 82,
    integrity: { tabHiddenCount: 0, copyCount: 0, pasteCount: 0 }
  },
  {
    attemptId: "attempt-2",
    candidateName: "Sam Fernando",
    candidateEmail: "sam@example.com",
    roleId: "SE",
    pass: false,
    borderline: true,
    finalPercent: 58,
    integrity: { tabHiddenCount: 1, copyCount: 0, pasteCount: 0 }
  },
  {
    attemptId: "attempt-3",
    candidateName: "Dana Silva",
    candidateEmail: "dana@example.com",
    roleId: "Associate",
    pass: false,
    borderline: false,
    finalPercent: 42,
    integrity: { tabHiddenCount: 2, copyCount: 1, pasteCount: 1 }
  }
] as const;

describe("results triage helpers", () => {
  it("calculates integrity risk buckets from the shared scoring rule", () => {
    expect(getIntegrityRiskScore(rows[0] as never)).toBe(0);
    expect(getIntegrityRiskLevel(rows[0] as never)).toBe("clean");
    expect(getIntegrityRiskLevel(rows[1] as never)).toBe("watch");
    expect(getIntegrityRiskLevel(rows[2] as never)).toBe("review");
  });

  it("filters and sorts queue rows using URL-backed filters", () => {
    const filtered = filterAndSortResults(rows as never, {
      q: "example.com",
      status: "fail",
      integrity: "review",
      role: "Associate",
      sort: "score_asc"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].attemptId).toBe("attempt-3");
  });
});

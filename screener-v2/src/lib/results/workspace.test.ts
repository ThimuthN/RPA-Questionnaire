import { describe, expect, it } from "vitest";
import { filterResultWorkspaceRows, toWorkspaceResultRow } from "@/lib/results/workspace";
import type { ResultSummary } from "@/lib/assessment-engine/types";

function result(overrides: Partial<ResultSummary>): ResultSummary {
  return {
    attemptId: "attempt-1",
    candidateName: "Jane Doe",
    candidateEmail: "jane@example.com",
    contextType: "general",
    reviewState: "unreviewed",
    roleId: "Associate",
    stacks: ["UiPath"],
    sections: ["core", "practical"],
    exams: [],
    corePercent: 70,
    practicalPercent: 72,
    finalPercent: 71,
    passPercent: 60,
    practicalMinPercent: 50,
    pass: true,
    borderline: false,
    integrity: { tabHiddenCount: 0, copyCount: 0, pasteCount: 0 },
    sectionBreakdown: {},
    examBreakdown: {},
    breakdownByCategory: {},
    ...overrides
  };
}

describe("result workspace filters", () => {
  it("filters by owner, score band, context, and review state", () => {
    const rows = [
      toWorkspaceResultRow(result({ attemptId: "a1", finalPercent: 82 }), {
        submittedAt: "2026-03-23T00:00:00.000Z",
        candidateOwner: "Alex",
        contextType: "training",
        reviewState: "reviewed"
      }),
      toWorkspaceResultRow(result({ attemptId: "a2", finalPercent: 48, pass: false }), {
        submittedAt: "2026-03-23T00:00:00.000Z",
        candidateOwner: "Jamie",
        contextType: "hiring",
        reviewState: "flagged"
      })
    ];

    const filtered = filterResultWorkspaceRows(rows, {
      owner: "Alex",
      scoreBand: "high",
      contextType: "training",
      reviewState: "reviewed"
    });
    expect(filtered.map((row) => row.attemptId)).toEqual(["a1"]);
  });
});

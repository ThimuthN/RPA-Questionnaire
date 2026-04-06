import { describe, expect, it } from "vitest";
import { buildCandidateOpenWorkSummary, sortCandidateWorkspaceItems, toCandidateWorkspaceItem } from "@/lib/candidates/workspace";
import type { CandidateListItem } from "@/lib/db/candidates";

function candidate(overrides: Partial<CandidateListItem>): CandidateListItem {
  return {
    id: "cand-1",
    fullName: "Jane Doe",
    email: "jane@example.com",
    stage: "screening",
    finalDecision: "in_process",
    nextAction: "follow_up",
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
    hasResume: true,
    currentFocus: "Screener",
    latestAssessment: null,
    ...overrides
  };
}

describe("candidate workspace", () => {
  it("derives open-work buckets", () => {
    const rows = [
      toCandidateWorkspaceItem(candidate({ hasResume: false })),
      toCandidateWorkspaceItem(
        candidate({
          latestAssessment: {
            id: "assessment-1",
            inviteId: "invite-1",
            inviteSlug: "abc123",
            createdAt: "2026-03-22T00:00:00.000Z",
            status: "review",
            finalPercent: 68,
            borderline: true
          }
        })
      )
    ];

    const summary = buildCandidateOpenWorkSummary(rows);
    expect(summary.needsResume).toBe(1);
    expect(summary.readyForReview).toBe(1);
  });

  it("prioritizes review items in inbox sort", () => {
    const reviewCandidate = toCandidateWorkspaceItem(
      candidate({
        id: "review",
        latestAssessment: {
          id: "assessment-2",
          inviteId: "invite-2",
          inviteSlug: "review",
          createdAt: "2026-03-22T00:00:00.000Z",
          status: "passed",
          finalPercent: 82,
          pass: true
        }
      })
    );
    const emptyCandidate = toCandidateWorkspaceItem(candidate({ id: "empty", hasResume: false }));

    const sorted = sortCandidateWorkspaceItems([emptyCandidate, reviewCandidate], "inbox");
    expect(sorted[0]?.id).toBe("review");
  });

  it("uses the newest assessment timestamp as latest activity", () => {
    const row = toCandidateWorkspaceItem(
      candidate({
        updatedAt: "2026-03-20T00:00:00.000Z",
        latestAssessment: {
          id: "assessment-3",
          inviteId: "invite-3",
          inviteSlug: "latest",
          createdAt: "2026-03-21T00:00:00.000Z",
          startedAt: "2026-03-22T00:00:00.000Z",
          submittedAt: "2026-03-23T00:00:00.000Z",
          status: "review"
        }
      })
    );

    expect(row.latestActivityAt).toBe("2026-03-23T00:00:00.000Z");
  });
});

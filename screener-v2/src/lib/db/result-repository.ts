import { prisma } from "@/lib/db/prisma";
import { buildReviewSections, toResultSummary } from "@/lib/db/result-projections";
import {
  mapAttempt,
  mapParticipant
} from "@/lib/db/runtime-repository";
import { attachExistingAssessmentToMilestone } from "@/lib/db/candidates";
import { bulkUpdateCandidates } from "@/lib/db/candidates";
import { syncCandidateAssessmentLatestAttemptInTx } from "@/lib/db/candidate-assessment-links";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import type {
  CandidateAssessmentStatus,
  CandidateFinalDecision,
  CandidateNoteType,
  CandidateNextAction,
  CandidateScreeningStatus,
  CandidateStage,
  CandidateUiStatus
} from "@/lib/candidates/types";
import type {
  DetailedResultSummary,
  ResultReviewState,
  ResultSummary
} from "@/lib/assessment-engine/types";
import type { ResultsWorkspaceFilters, WorkspaceResultRow } from "@/lib/results/workspace";
import { filterResultWorkspaceRows, toWorkspaceResultRow } from "@/lib/results/workspace";
import { listRoleCatalog } from "@/lib/roles/catalog";

export interface ResultWorkspacePage {
  rows: WorkspaceResultRow[];
  total: number;
  page: number;
  pageSize: number;
  roleOptions: Array<{ id: string; label: string }>;
  ownerOptions: string[];
  statusCounts: {
    pass: number;
    review: number;
    fail: number;
  };
}

export interface ResultCandidateLinkTarget {
  milestoneId: string;
  milestoneTitle: string;
  milestoneType: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateOwner?: string;
  candidateRoleLabel?: string;
  matchesParticipantEmail: boolean;
  matchesParticipantName: boolean;
}

export interface ResultCandidateLinkOptions {
  canLink: boolean;
  reason?: string;
  targets: ResultCandidateLinkTarget[];
}

type ResultWorkspaceQuery = ResultsWorkspaceFilters & {
  page?: number;
  pageSize?: number;
  attemptIds?: string[];
};

function compareLinkTargets(
  left: ResultCandidateLinkTarget,
  right: ResultCandidateLinkTarget
) {
  if (left.matchesParticipantEmail !== right.matchesParticipantEmail) {
    return left.matchesParticipantEmail ? -1 : 1;
  }
  if (left.matchesParticipantName !== right.matchesParticipantName) {
    return left.matchesParticipantName ? -1 : 1;
  }
  if (left.candidateName !== right.candidateName) {
    return left.candidateName.localeCompare(right.candidateName);
  }
  if (left.milestoneTitle !== right.milestoneTitle) {
    return left.milestoneTitle.localeCompare(right.milestoneTitle);
  }
  return left.milestoneId.localeCompare(right.milestoneId);
}

export async function listResults() {
  const resultRows = await prisma.result.findMany({
    orderBy: { createdAt: "desc" }
  });
  const attemptIds = resultRows.map((row) => row.attemptId);
  if (attemptIds.length === 0) return [];

  const attemptRows = await prisma.attempt.findMany({
    where: { id: { in: attemptIds } }
  });
  const attemptsById = new Map(attemptRows.map((row) => [row.id, mapAttempt(row)]));
  const participantIds = [...new Set(attemptRows.map((row) => row.participantId))];
  const participantRows =
    participantIds.length > 0
      ? await prisma.participant.findMany({
          where: { id: { in: participantIds } }
        })
      : [];
  const participantsById = new Map(participantRows.map((row) => [row.id, mapParticipant(row)]));

  return resultRows
    .map((row) => {
      const attempt = attemptsById.get(row.attemptId) ?? null;
      const participant = attempt ? participantsById.get(attempt.participantId) ?? null : null;
      return {
        summary: toResultSummary(row, attempt, participant),
        submittedAt: attempt?.submittedAt ?? attempt?.startedAt ?? ""
      };
    })
    .filter((row): row is { summary: ResultSummary; submittedAt: string } => Boolean(row.summary))
    .sort(
      (a, b) =>
        Date.parse(b.submittedAt || "1970-01-01T00:00:00.000Z") -
        Date.parse(a.submittedAt || "1970-01-01T00:00:00.000Z")
    )
    .map((row) => row.summary);
}

async function listWorkspaceResultRows(attemptIdFilter?: string[]) {
  const resultRows = await prisma.result.findMany({
    where: attemptIdFilter?.length
      ? {
          attemptId: {
            in: attemptIdFilter
          }
        }
      : undefined,
    orderBy: { createdAt: "desc" }
  });
  const attemptIds = resultRows.map((row) => row.attemptId);
  if (attemptIds.length === 0) return [];

  const attemptRows = await prisma.attempt.findMany({
    where: { id: { in: attemptIds } }
  });
  const attemptsById = new Map(attemptRows.map((row) => [row.id, mapAttempt(row)]));
  const participantIds = [...new Set(attemptRows.map((row) => row.participantId))];
  const participantRows =
    participantIds.length > 0
      ? await prisma.participant.findMany({
          where: { id: { in: participantIds } }
        })
      : [];
  const participantsById = new Map(participantRows.map((row) => [row.id, mapParticipant(row)]));
  const candidateAssessmentRows = await prisma.candidateAssessmentAttempt.findMany({
    where: {
      attemptId: {
        in: attemptIds
      }
    },
    include: {
      candidateAssessment: {
        include: {
          candidate: {
            select: {
              id: true,
              roleId: true,
              positionAppliedFor: true,
              hrOwner: true,
              stage: true,
              nextAction: true,
              finalDecision: true,
              screeningStatus: true,
              notesSummary: true,
              updatedAt: true,
              role: {
                select: {
                  label: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [{ linkedAt: "desc" }, { id: "desc" }]
  });
  const candidateByAttemptId = new Map<
    string,
    (typeof candidateAssessmentRows)[number]["candidateAssessment"]["candidate"]
  >();
  for (const row of candidateAssessmentRows) {
    if (!candidateByAttemptId.has(row.attemptId)) {
      candidateByAttemptId.set(row.attemptId, row.candidateAssessment.candidate);
    }
  }

  return resultRows
    .map((row) => {
      const attempt = attemptsById.get(row.attemptId) ?? null;
      const participant = attempt ? participantsById.get(attempt.participantId) ?? null : null;
      const candidate = candidateByAttemptId.get(row.attemptId);
      const summary = toResultSummary(row, attempt, participant, candidate ?? null);
      if (!summary || !attempt) return null;
      const resultStatus: CandidateAssessmentStatus = row.pass
        ? "passed"
        : row.borderline
          ? "review"
          : "failed";
      const uiStatus: CandidateUiStatus | undefined = candidate
        ? getCandidateUiStatus({
            stage: candidate.stage as CandidateStage,
            finalDecision: candidate.finalDecision as CandidateFinalDecision,
            nextAction: candidate.nextAction as CandidateNextAction,
            screeningStatus:
              (candidate.screeningStatus as CandidateScreeningStatus | null) ?? undefined,
            latestAssessmentStatus: resultStatus
          })
        : undefined;
      const submittedAt = attempt.submittedAt ?? attempt.startedAt ?? row.createdAt.toISOString();
      const latestActivityAt = candidate?.updatedAt?.toISOString() ?? submittedAt;
      const staleDays = Math.max(
        0,
        Math.floor((Date.now() - Date.parse(latestActivityAt)) / (1000 * 60 * 60 * 24))
      );

      return toWorkspaceResultRow(summary, {
        contextType: summary.contextType,
        reviewState: summary.reviewState,
        submittedAt,
        candidateId: candidate?.id,
        candidateRoleId: candidate?.roleId ?? undefined,
        candidateRoleLabel: candidate?.role?.label ?? candidate?.positionAppliedFor ?? undefined,
        candidateOwner: candidate?.hrOwner ?? undefined,
        candidateStage: candidate?.stage as CandidateStage | undefined,
        candidateNextAction: candidate?.nextAction as CandidateNextAction | undefined,
        candidateUiStatus: uiStatus,
        candidateLatestActivityAt: latestActivityAt,
        candidateStaleDays: staleDays,
        candidateNotesSummary: candidate?.notesSummary ?? undefined
      });
    })
    .filter((row): row is WorkspaceResultRow => Boolean(row));
}

export async function listAllResultWorkspaceRows(
  filters: Omit<ResultWorkspaceQuery, "page" | "pageSize"> = {}
) {
  return filterResultWorkspaceRows(await listWorkspaceResultRows(filters.attemptIds), filters);
}

export async function listResultWorkspacePage(
  filters: ResultWorkspaceQuery = {}
): Promise<ResultWorkspacePage> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));
  const rows = await listAllResultWorkspaceRows(filters);
  const start = (page - 1) * pageSize;
  const roleOptions = (await listRoleCatalog()).map((role) => ({
    id: role.id,
    label: role.label
  }));
  const ownerOptions = [...new Set(rows.map((row) => row.candidateOwner).filter(Boolean))].sort() as string[];

  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    roleOptions,
    ownerOptions,
    statusCounts: {
      pass: rows.filter((row) => row.resultStatus === "pass").length,
      review: rows.filter((row) => row.resultStatus === "review").length,
      fail: rows.filter((row) => row.resultStatus === "fail").length
    }
  };
}

export async function bulkUpdateResults(input: {
  attemptIds: string[];
  action: "set_review_state" | "assign_owner" | "set_ui_status" | "add_note";
  reviewState?: ResultReviewState;
  owner?: string;
  status?: CandidateUiStatus;
  noteBody?: string;
  noteType?: CandidateNoteType;
  createdById?: string;
}) {
  const attemptIds = [...new Set(input.attemptIds.filter(Boolean))];
  if (attemptIds.length === 0) {
    throw new Error("Select at least one result.");
  }

  if (input.action === "set_review_state") {
    if (!input.reviewState) {
      throw new Error("Choose a review state.");
    }

    const updated = await prisma.result.updateMany({
      where: {
        attemptId: {
          in: attemptIds
        }
      },
      data: {
        reviewState: input.reviewState
      }
    });

    return { updatedCount: updated.count };
  }

  const rows = await prisma.candidateAssessmentAttempt.findMany({
    where: {
      attemptId: {
        in: attemptIds
      }
    },
    select: {
      candidateAssessment: {
        select: {
          candidateId: true
        }
      }
    },
    orderBy: [{ linkedAt: "desc" }, { id: "desc" }]
  });
  const candidateIds = [...new Set(rows.map((row) => row.candidateAssessment.candidateId))];

  if (candidateIds.length === 0) {
    throw new Error("Selected results do not have linked workflow records yet.");
  }

  return bulkUpdateCandidates({
    candidateIds,
    action: input.action,
    owner: input.owner,
    status: input.status,
    noteBody: input.noteBody,
    noteType: input.noteType,
    createdById: input.createdById
  });
}

export async function getResult(attemptId: string) {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });
  const participantRow = attemptRow
    ? await prisma.participant.findUnique({
        where: { id: attemptRow.participantId }
      })
    : null;

  return toResultSummary(
    resultRow,
    attemptRow ? mapAttempt(attemptRow) : null,
    participantRow ? mapParticipant(participantRow) : null
  );
}

export async function getDetailedResult(
  attemptId: string
): Promise<DetailedResultSummary | null> {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });
  if (!attemptRow) return null;

  const participantRow = await prisma.participant.findUnique({
    where: { id: attemptRow.participantId }
  });
  const attempt = mapAttempt(attemptRow);
  const link = await prisma.candidateAssessmentAttempt.findUnique({
    where: { attemptId },
    include: {
      candidateAssessment: {
        include: {
          candidate: {
            select: {
              id: true,
              roleId: true,
              positionAppliedFor: true,
              hrOwner: true,
              stage: true,
              nextAction: true,
              finalDecision: true,
              screeningStatus: true,
              notesSummary: true,
              updatedAt: true,
              role: {
                select: {
                  label: true
                }
              }
            }
          }
        }
      }
    }
  });
  const candidate = link?.candidateAssessment.candidate;
  const resultStatus: CandidateAssessmentStatus = resultRow.pass
    ? "passed"
    : resultRow.borderline
      ? "review"
      : "failed";
  const baseWithCandidate = toResultSummary(
    resultRow,
    attempt,
    participantRow ? mapParticipant(participantRow) : null,
    candidate ?? null
  );
  if (!baseWithCandidate) return null;
  const summary = toWorkspaceResultRow(baseWithCandidate, {
    contextType: baseWithCandidate.contextType,
    reviewState: baseWithCandidate.reviewState,
    submittedAt: attempt.submittedAt ?? attempt.startedAt ?? new Date().toISOString(),
    candidateId: candidate?.id,
    candidateRoleId: candidate?.roleId ?? undefined,
    candidateRoleLabel: candidate?.role?.label ?? candidate?.positionAppliedFor ?? undefined,
    candidateOwner: candidate?.hrOwner ?? undefined,
    candidateStage: candidate?.stage as CandidateStage | undefined,
    candidateNextAction: candidate?.nextAction as CandidateNextAction | undefined,
    candidateUiStatus: candidate
      ? getCandidateUiStatus({
          stage: candidate.stage as CandidateStage,
          finalDecision: candidate.finalDecision as CandidateFinalDecision,
          nextAction: candidate.nextAction as CandidateNextAction,
          screeningStatus:
            (candidate.screeningStatus as CandidateScreeningStatus | null) ?? undefined,
          latestAssessmentStatus: resultStatus
        })
      : undefined,
    candidateLatestActivityAt: candidate?.updatedAt?.toISOString(),
    candidateStaleDays: candidate?.updatedAt
      ? Math.max(0, Math.floor((Date.now() - candidate.updatedAt.getTime()) / (1000 * 60 * 60 * 24)))
      : undefined,
    candidateNotesSummary: candidate?.notesSummary ?? undefined
  });

  return {
    summary,
    reviewSections: buildReviewSections(attempt)
  };
}

export async function getResultCandidateLinkOptions(
  attemptId: string
): Promise<ResultCandidateLinkOptions> {
  const [attempt, existingLink] = await Promise.all([
    prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        inviteId: true,
        participant: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    }),
    prisma.candidateAssessmentAttempt.findUnique({
      where: { attemptId },
      select: { attemptId: true }
    })
  ]);

  if (!attempt) {
    return {
      canLink: false,
      reason: "Result attempt not found.",
      targets: []
    };
  }

  if (existingLink) {
    return {
      canLink: false,
      reason: "This result is already linked to a candidate workflow record.",
      targets: []
    };
  }

  if (!attempt.inviteId) {
    return {
      canLink: false,
      reason: "Only invite-backed assessments can be linked to candidate workflow records.",
      targets: []
    };
  }

  const participantEmail = attempt.participant.email.trim().toLowerCase();
  const participantName = attempt.participant.fullName.trim().toLowerCase();
  const milestones = await prisma.candidateMilestone.findMany({
    where: {
      mode: "platform",
      OR: [
        { candidateAssessmentId: null },
        {
          candidateAssessment: {
            OR: [
              { attemptId },
              {
                attemptHistory: {
                  some: {
                    attemptId
                  }
                }
              }
            ]
          }
        }
      ]
    },
    select: {
      id: true,
      title: true,
      type: true,
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          hrOwner: true,
          role: {
            select: {
              label: true
            }
          }
        }
      }
    }
  });

  const targets = milestones
    .map((milestone) => {
      const candidateEmail = milestone.candidate.email.trim().toLowerCase();
      const candidateName = milestone.candidate.fullName.trim().toLowerCase();

      return {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        milestoneType: milestone.type,
        candidateId: milestone.candidate.id,
        candidateName: milestone.candidate.fullName,
        candidateEmail: milestone.candidate.email,
        candidateOwner: milestone.candidate.hrOwner ?? undefined,
        candidateRoleLabel: milestone.candidate.role?.label ?? undefined,
        matchesParticipantEmail: candidateEmail.length > 0 && candidateEmail === participantEmail,
        matchesParticipantName: candidateName.length > 0 && candidateName === participantName
      } satisfies ResultCandidateLinkTarget;
    })
    .sort(compareLinkTargets);

  return {
    canLink: true,
    reason: targets.length === 0 ? "No open platform milestones are available for linking." : undefined,
    targets
  };
}

export async function linkResultToCandidateMilestone(input: {
  attemptId: string;
  milestoneId: string;
  createdById?: string;
}) {
  const existingLink = await prisma.candidateAssessmentAttempt.findUnique({
    where: { attemptId: input.attemptId },
    select: { attemptId: true }
  });

  if (existingLink) {
    throw new Error("This result is already linked to a candidate workflow record.");
  }

  const milestone = await prisma.candidateMilestone.findUnique({
    where: { id: input.milestoneId },
    select: {
      id: true,
      candidateId: true,
      mode: true
    }
  });

  if (!milestone) {
    throw new Error("Candidate milestone not found.");
  }

  if (milestone.mode !== "platform") {
    throw new Error("Only platform milestones can be linked to assessment results.");
  }

  await attachExistingAssessmentToMilestone({
    candidateId: milestone.candidateId,
    milestoneId: milestone.id,
    attemptId: input.attemptId,
    createdById: input.createdById
  });
}

export async function getScoreContextForAttempt(
  attemptId: string,
  finalPercent: number
): Promise<{ roleAverage: number | null; percentile: number | null; label: string }> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { roleId: true }
  });
  const roleId = attempt?.roleId;
  if (!roleId) return { roleAverage: null, percentile: null, label: "" };

  const sameRole = await prisma.attempt.findMany({
    where: { roleId, status: "submitted" },
    select: { id: true }
  });
  if (sameRole.length < 2) return { roleAverage: null, percentile: null, label: "" };

  const ids = sameRole.map((a) => a.id);
  const results = await prisma.result.findMany({
    where: { attemptId: { in: ids } },
    select: { finalPercent: true }
  });
  if (results.length < 2) return { roleAverage: null, percentile: null, label: "" };

  const scores = results.map((r) => r.finalPercent);
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const below = scores.filter((s) => s < finalPercent).length;
  const percentile = Math.round((below / scores.length) * 100);
  const diff = finalPercent - avg;
  const label =
    diff > 8
      ? `Top performer - ${percentile}th percentile for this role`
      : diff > 0
        ? `Above average - ${percentile}th percentile for this role`
        : diff > -8
          ? `Near average - ${percentile}th percentile for this role`
          : `Below average - ${percentile}th percentile for this role`;

  return { roleAverage: Math.round(avg * 10) / 10, percentile, label };
}

export async function getNextUnreviewedAttemptId(
  currentAttemptId: string
): Promise<string | null> {
  const rows = await prisma.result.findMany({
    orderBy: { createdAt: "desc" },
    select: { attemptId: true, reviewState: true }
  });
  const ids = rows.filter((r) => r.reviewState === "unreviewed").map((r) => r.attemptId);
  const idx = ids.indexOf(currentAttemptId);
  if (idx === -1) return ids[0] ?? null;
  return ids[idx + 1] ?? null;
}

export async function deleteResultAttempt(attemptId: string) {
  const [attempt, result] = await Promise.all([
    prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        inviteId: true,
        participantId: true
      }
    }),
    prisma.result.findUnique({
      where: { attemptId },
      select: {
        attemptId: true
      }
    })
  ]);

  if (!attempt && !result) {
    throw new Error("Result not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.result.deleteMany({
      where: { attemptId }
    });

    if (!attempt) {
      return;
    }

    if (attempt.inviteId) {
      const linkedAssessments = await tx.candidateAssessmentAttempt.findMany({
        where: { attemptId },
        select: {
          candidateAssessmentId: true
        }
      });

      await tx.candidateAssessmentAttempt.deleteMany({
        where: { attemptId }
      });

      for (const link of linkedAssessments) {
        await syncCandidateAssessmentLatestAttemptInTx({
          tx,
          candidateAssessmentId: link.candidateAssessmentId
        });
      }
    }

    await tx.attempt.delete({
      where: { id: attempt.id }
    });

    const remainingAttempts = await tx.attempt.count({
      where: { participantId: attempt.participantId }
    });

    if (remainingAttempts === 0) {
      await tx.participant.delete({
        where: { id: attempt.participantId }
      });
    }
  });
}

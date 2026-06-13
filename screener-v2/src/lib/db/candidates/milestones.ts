import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  deriveMilestoneStatus,
  milestoneCheckDefs,
  type CheckType,
  type CandidateMilestoneMode,
  type CandidateMilestoneResult,
  type CandidateMilestoneStatus,
  type CandidateMilestoneType
} from "@/lib/candidates/milestones";
import { linkCandidateAssessmentAttemptInTx } from "@/lib/db/candidate-assessment-links";
import { cuidLike } from "@/lib/tokens/token-service";
import { mapMilestone } from "./mappers";
import { logActivityEvent } from "./activity";

// ─── Stage / milestone sync ───────────────────────────────────────────────────
// candidate.stage is always *derived* from the milestone set — never assigned
// per-transition. This eliminates edge-case bugs and keeps both sources of
// truth permanently in sync regardless of how a milestone was updated.

function stageFromSortOrder(sortOrder: number): string {
  if (sortOrder < 20) return "pipeline";
  if (sortOrder < 30) return "screening";
  if (sortOrder < 40) return "interview";
  if (sortOrder < 9999) return "advanced_review";
  return "finalized";
}

export function deriveStageFromMilestones(
  milestones: ReadonlyArray<{ sortOrder: number; status: string }>
): string {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);

  // Finalized milestone done → candidate decision recorded
  const finalStep = sorted.find((m) => m.sortOrder >= 9999);
  if (finalStep?.status === "done") return "finalized";

  // In-progress step drives the current stage
  const active = sorted.find((m) => m.status === "in_progress");
  if (active) return stageFromSortOrder(active.sortOrder);

  // No active step — next pending step is the upcoming stage
  const nextPending = sorted.find(
    (m) => m.status === "not_started" && m.sortOrder < 9999
  );
  if (nextPending) return stageFromSortOrder(nextPending.sortOrder);

  // Everything before finalized is done/skipped — hold at last completed level
  const lastCompleted = [...sorted]
    .reverse()
    .find((m) => m.status === "done" && m.sortOrder < 9999);
  if (lastCompleted) return stageFromSortOrder(lastCompleted.sortOrder);

  return "pipeline";
}

export async function syncCandidateStageFromMilestones(
  candidateId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const milestones = await tx.candidateMilestone.findMany({
    where: { candidateId },
    select: { sortOrder: true, status: true }
  });
  await tx.candidate.update({
    where: { id: candidateId },
    data: { stage: deriveStageFromMilestones(milestones) }
  });
}

async function applyMilestoneCascade(
  candidateId: string,
  savedMilestoneId: string,
  newStatus: CandidateMilestoneStatus,
  tx: Prisma.TransactionClient
): Promise<void> {
  const allMilestones = await tx.candidateMilestone.findMany({
    where: { candidateId },
    select: { id: true, sortOrder: true, status: true },
    orderBy: { sortOrder: "asc" }
  });

  const savedIndex = allMilestones.findIndex((m) => m.id === savedMilestoneId);
  if (savedIndex === -1) return;

  // Skip any not_started steps before the saved one (handles forward jumps and
  // re-activating a previously skipped step)
  const earlierNotStartedIds = allMilestones
    .slice(0, savedIndex)
    .filter((m) => m.status === "not_started")
    .map((m) => m.id);

  if (earlierNotStartedIds.length > 0) {
    await tx.candidateMilestone.updateMany({
      where: { id: { in: earlierNotStartedIds } },
      data: { status: "skipped" }
    });
  }

  // Completing a step auto-advances the next pending one to in_progress
  if (newStatus === "done") {
    const nextPending = allMilestones
      .slice(savedIndex + 1)
      .find((m) => m.status === "not_started" && m.sortOrder < 9999);

    if (nextPending) {
      await tx.candidateMilestone.update({
        where: { id: nextPending.id },
        data: { status: "in_progress" }
      });
    }
  }

  // Derive stage from the full (now-updated) milestone set — no per-transition
  // stage logic, no null-return edge cases, always converges to the correct value
  await syncCandidateStageFromMilestones(candidateId, tx);
}

export async function updateCandidateMilestone(
  candidateId: string,
  milestoneId: string,
  input: {
    title?: string;
    status?: CandidateMilestoneStatus;
    mode?: CandidateMilestoneMode;
    date?: string;
    notes?: string;
    score?: number;
    result?: CandidateMilestoneResult;
    recommendation?: string;
    actorId?: string;
    actorName?: string;
  }
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true, type: true, title: true, status: true, score: true, result: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  let statusToApply = input.status;
  if (milestone.type === "decision" && input.result && ["accept", "decline"].includes(input.result)) {
    statusToApply = "done";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.candidateMilestone.update({
      where: { id: milestoneId },
      data: {
        title: input.title?.trim(),
        status: statusToApply,
        mode: input.mode,
        date: input.date ? new Date(input.date) : input.date === "" ? null : undefined,
        notes: typeof input.notes === "string" ? input.notes.trim() || null : undefined,
        score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : input.score === null ? null : undefined,
        result: input.result ?? undefined,
        recommendation:
          typeof input.recommendation === "string" ? input.recommendation.trim() || null : undefined
      }
    });

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    const changedFields: string[] = [];
    if (input.title !== undefined && milestone.title !== input.title?.trim()) changedFields.push("title");
    if (input.status !== undefined && milestone.status !== statusToApply) changedFields.push(`status: ${statusToApply}`);
    if (input.score !== undefined && milestone.score !== input.score) changedFields.push("score");
    if (input.result !== undefined && milestone.result !== input.result) changedFields.push("result");

    if (changedFields.length > 0) {
      await logActivityEvent(tx, {
        candidateId,
        event: "milestone_updated",
        entityType: "milestone",
        entityId: milestoneId,
        detail: `${milestone.title}: ${changedFields.join(", ")}`,
        actorId: input.actorId,
        actorName: input.actorName
      });
    }

    if (statusToApply) {
      await applyMilestoneCascade(candidateId, milestoneId, statusToApply, tx);
    }

    return upd;
  });

  return mapMilestone(updated);
}

export async function quickUpdateCandidateMilestoneStatus(
  candidateId: string,
  milestoneId: string,
  status: CandidateMilestoneStatus,
  actorId?: string,
  actorName?: string
) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: milestoneId,
      candidateId
    },
    select: { id: true, title: true, status: true }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const upd = await tx.candidateMilestone.update({
      where: { id: milestoneId },
      data: {
        status
      }
    });

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    if (milestone.status !== status) {
      await logActivityEvent(tx, {
        candidateId,
        event: "milestone_status_changed",
        entityType: "milestone",
        entityId: milestoneId,
        detail: `${milestone.title}: ${milestone.status} → ${status}`,
        actorId,
        actorName
      });
    }

    await applyMilestoneCascade(candidateId, milestoneId, status, tx);

    return upd;
  });

  return mapMilestone(updated);
}

export async function initOrUpdateMilestoneCheck(
  candidateId: string,
  milestoneId: string,
  checkType: CheckType,
  status: string,
  notes?: string,
  actorId?: string,
  actorName?: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    const milestone = await tx.candidateMilestone.findFirst({
      where: {
        id: milestoneId,
        candidateId
      },
      select: {
        id: true,
        type: true,
        status: true
      }
    });

    if (!milestone) {
      throw new Error("Milestone not found.");
    }

    await tx.candidateMilestoneCheck.upsert({
      where: {
        milestoneId_type: {
          milestoneId,
          type: checkType
        }
      },
      update: {
        status,
        notes: notes?.trim() || null,
        actorId: actorId || null,
        actorName: actorName || null,
        updatedAt: new Date()
      },
      create: {
        id: cuidLike(),
        milestoneId,
        type: checkType,
        status,
        notes: notes?.trim() || null,
        actorId: actorId || null,
        actorName: actorName || null
      }
    });

    const allChecks = await tx.candidateMilestoneCheck.findMany({
      where: { milestoneId },
      select: { type: true, status: true }
    });

    const defs = milestoneCheckDefs[milestone.type as CandidateMilestoneType] ?? [];
    const newStatus = deriveMilestoneStatus(allChecks as Array<{ type?: CheckType; status: string }>, defs);
    const oldStatus = milestone.status;

    let upd = milestone;
    if (newStatus !== oldStatus) {
      upd = await tx.candidateMilestone.update({
        where: { id: milestoneId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      await applyMilestoneCascade(candidateId, milestoneId, newStatus, tx);
    }

    await tx.candidate.update({
      where: { id: candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId,
        actorId: actorId || null,
        actorName: actorName || null,
        event: "check_updated",
        entityType: "check",
        detail: `${checkType}: ${status}${notes ? ` - ${notes}` : ""}`,
        createdAt: new Date()
      }
    });

    return upd;
  });

  return updated;
}

export async function upsertInterviewPanelForMilestone(input: {
  candidateId: string;
  milestoneId: string;
  scheduledAt?: string;
  durationMin?: number;
  format?: string;
  meetingUrl?: string;
  interviewerIds?: string[];
  actorId?: string;
  actorName?: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    },
    select: {
      id: true,
      title: true,
      sortOrder: true,
      type: true
    }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  if (milestone.type !== "interview") {
    throw new Error("Interview panels can only be attached to interview milestones.");
  }

  const interviewerIds = Array.from(
    new Set((input.interviewerIds ?? []).map((value) => value.trim()).filter(Boolean))
  );
  if (interviewerIds.length > 0) {
    const users = await prisma.user.findMany({
      where: {
        id: { in: interviewerIds },
        isActive: true
      },
      select: { id: true }
    });

    if (users.length !== interviewerIds.length) {
      throw new Error("One or more selected interviewers could not be found.");
    }
  }

  const scheduledAt =
    typeof input.scheduledAt === "string" && input.scheduledAt.trim().length > 0
      ? new Date(input.scheduledAt)
      : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Interview date is invalid.");
  }

  const durationMin =
    typeof input.durationMin === "number" && Number.isFinite(input.durationMin)
      ? Math.max(15, Math.round(input.durationMin))
      : 60;
  const format = input.format?.trim() || "video";
  const meetingUrl =
    typeof input.meetingUrl === "string" && input.meetingUrl.trim().length > 0
      ? input.meetingUrl.trim()
      : null;
  const status = scheduledAt ? "scheduled" : interviewerIds.length > 0 ? "draft" : "pending";

  return prisma.$transaction(async (tx) => {
    const existing = await tx.interviewPanel.findUnique({
      where: { milestoneId: input.milestoneId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    const roundNumber =
      existing?.roundNumber ??
      (await tx.interviewPanel.count({
        where: { candidateId: input.candidateId }
      })) + 1;

    const panel = existing
      ? await tx.interviewPanel.update({
          where: { id: existing.id },
          data: {
            roundName: milestone.title,
            scheduledAt,
            durationMin,
            format,
            meetingUrl,
            status
          },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        })
      : await tx.interviewPanel.create({
          data: {
            id: cuidLike(),
            candidateId: input.candidateId,
            milestoneId: input.milestoneId,
            roundNumber,
            roundName: milestone.title,
            scheduledAt,
            durationMin,
            format,
            meetingUrl,
            status,
            createdById: input.actorId ?? null
          },
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        });

    await tx.interviewPanelMember.deleteMany({
      where: { panelId: panel.id }
    });

    if (interviewerIds.length > 0) {
      await tx.interviewPanelMember.createMany({
        data: interviewerIds.map((userId) => ({
          id: cuidLike(),
          panelId: panel.id,
          userId,
          role: "interviewer"
        }))
      });
    }

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    await logActivityEvent(tx, {
      candidateId: input.candidateId,
      event: scheduledAt ? "interview_panel_scheduled" : "interview_panel_updated",
      entityType: "interview_panel",
      entityId: panel.id,
      detail: `${milestone.title}${scheduledAt ? ` scheduled for ${scheduledAt.toLocaleString()}` : " updated"}`,
      actorId: input.actorId,
      actorName: input.actorName
    });

    return tx.interviewPanel.findUniqueOrThrow({
      where: { id: panel.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  });
}

export async function linkCandidateAssessmentToMilestone(input: {
  candidateId: string;
  milestoneId: string;
  candidateAssessmentId: string;
  actorId?: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    },
    select: {
      id: true,
      title: true
    }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidateMilestone.updateMany({
      where: {
        candidateId: input.candidateId,
        candidateAssessmentId: input.candidateAssessmentId,
        NOT: {
          id: input.milestoneId
        }
      },
      data: {
        candidateAssessmentId: null
      }
    });

    await tx.candidateMilestone.update({
      where: { id: input.milestoneId },
      data: {
        candidateAssessmentId: input.candidateAssessmentId,
        status: "in_progress",
        mode: "platform"
      }
    });

    await tx.candidateMilestoneCheck.upsert({
      where: {
        milestoneId_type: {
          milestoneId: input.milestoneId,
          type: "screener_test"
        }
      },
      update: {
        status: "in_progress",
        updatedAt: new Date()
      },
      create: {
        id: `check_${Date.now()}`,
        milestoneId: input.milestoneId,
        type: "screener_test",
        status: "in_progress",
        updatedAt: new Date()
      }
    });

    await logActivityEvent(tx, {
      candidateId: input.candidateId,
      event: "assessment_linked",
      entityType: "milestone",
      entityId: input.milestoneId,
      detail: `Assessment linked to ${milestone.title}`,
      actorId: input.actorId
    });

    await tx.candidate.update({
      where: { id: input.candidateId },
      data: {
        updatedAt: new Date()
      }
    });

    await applyMilestoneCascade(input.candidateId, input.milestoneId, "in_progress", tx);
  });
}

export async function unlinkAssessmentFromMilestone(
  candidateId: string,
  milestoneId: string,
  actorId?: string
) {
  await prisma.$transaction(async (tx) => {
    // Remove the screener_test check so status is re-derived without it
    await tx.candidateMilestoneCheck.deleteMany({
      where: { milestoneId, type: "screener_test" }
    });

    // Re-derive status from remaining checks
    const remainingChecks = await tx.candidateMilestoneCheck.findMany({
      where: { milestoneId },
      select: { type: true, status: true }
    });

    const ms = await tx.candidateMilestone.findUniqueOrThrow({
      where: { id: milestoneId },
      select: { type: true }
    });

    const defs = milestoneCheckDefs[ms.type as CandidateMilestoneType] ?? [];
    const newStatus = deriveMilestoneStatus(
      remainingChecks as Array<{ type: CheckType; status: string }>,
      defs
    );

    await tx.candidateMilestone.update({
      where: { id: milestoneId },
      data: {
        candidateAssessmentId: null,
        mode: "manual",
        status: newStatus
      }
    });

    await logActivityEvent(tx, {
      candidateId,
      event: "assessment_unlinked",
      entityType: "milestone",
      entityId: milestoneId,
      detail: "Assessment unlinked from screening step",
      actorId
    });

    await syncCandidateStageFromMilestones(candidateId, tx);
  });
}

export async function attachExistingAssessmentToMilestone(input: {
  candidateId: string;
  milestoneId: string;
  attemptId?: string;
  inviteSlug?: string;
  createdById?: string;
}) {
  const milestone = await prisma.candidateMilestone.findFirst({
    where: {
      id: input.milestoneId,
      candidateId: input.candidateId
    }
  });

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  const inviteSlug = input.inviteSlug?.trim().toLowerCase();
  const attemptId = input.attemptId?.trim();
  if (!inviteSlug && !attemptId) {
    throw new Error("Enter an attempt ID or invite slug.");
  }

  const resolved = attemptId
    ? await prisma.attempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          inviteId: true
        }
      })
    : null;
  const inviteIdFromAttempt = resolved?.inviteId ?? null;
  const invite = inviteSlug
    ? await prisma.invite.findUnique({
        where: { slug: inviteSlug },
        select: { id: true }
      })
    : inviteIdFromAttempt
      ? await prisma.invite.findUnique({
          where: { id: inviteIdFromAttempt },
          select: { id: true }
        })
      : null;

  if (!invite?.id) {
    throw new Error("Screener not found.");
  }

  const existing = await prisma.candidateAssessment.findFirst({
    where: {
      OR: [
        { inviteId: invite.id },
        ...(resolved?.id
          ? [
              { attemptId: resolved.id },
              {
                attemptHistory: {
                  some: {
                    attemptId: resolved.id
                  }
                }
              }
            ]
          : [])
      ]
    }
  });

  let candidateAssessmentId: string;

  if (existing) {
    if (existing.candidateId !== input.candidateId) {
      throw new Error("That screener is already linked to another candidate.");
    }

    candidateAssessmentId = existing.id;
  } else {
    candidateAssessmentId = (
      await prisma.candidateAssessment.create({
        data: {
          id: cuidLike(),
          candidateId: input.candidateId,
          inviteId: invite.id,
          attemptId: resolved?.id ?? null,
          createdById: input.createdById ?? null
        }
      })
    ).id;
  }

  if (resolved?.id) {
    await prisma.$transaction(async (tx) => {
      await linkCandidateAssessmentAttemptInTx({
        tx,
        candidateAssessmentId,
        attemptId: resolved.id
      });
    });
  }

  await linkCandidateAssessmentToMilestone({
    candidateId: input.candidateId,
    milestoneId: input.milestoneId,
    candidateAssessmentId
  });

  return candidateAssessmentId;
}

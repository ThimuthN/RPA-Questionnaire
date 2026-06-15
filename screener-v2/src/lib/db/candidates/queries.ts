import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { listRoleCatalog } from "@/lib/roles/catalog";
import type { CandidateAssessmentStatus, CandidateStage } from "@/lib/candidates/types";
import {
  buildCandidateOpenWorkSummary,
  sortCandidateWorkspaceItems,
  toCandidateWorkspaceItem
} from "@/lib/candidates/workspace";
import {
  mapCandidate,
  mapApplication,
  mapResume,
  mapNote,
  mapAssessment,
  mapCandidateExternalAssessment,
  mapMilestone,
  mapInterviewPanel,
  sortCandidateAssessmentsByLatestActivity,
  currentFocusFromMilestones,
  loadResultsByAttemptId,
  loadUsersById
} from "./mappers";
import {
  deriveApplicationScreeningStatus,
  mapApplicationScreeningAddonResult
} from "@/lib/jobs/screening-results";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import type {
  CandidateDetail,
  CandidateListItem,
  CandidateWorkspaceFilters,
  CandidateWorkspacePage
} from "./types";

export type CandidateStageCounts = {
  applicant: number;
  pipeline: number;
  screening: number;
  interview: number;
  advanced_review: number;
  finalized: number;
  pool: number;
};

type TeamAssignmentRow = {
  role: string;
  isPrimary: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type DepartmentCandidacyTeamRow = {
  departmentId: string;
  teamAssignments: TeamAssignmentRow[];
};

function summarizeCandidacyTeam(
  candidacies: DepartmentCandidacyTeamRow[] | undefined,
  preferredDepartmentId?: string
) {
  if (!candidacies?.length) {
    return {
      teamOwnerSummary: undefined,
      teamOwnerId: undefined,
      teamMemberCount: 0
    };
  }

  const candidacy =
    (preferredDepartmentId && candidacies.find((item) => item.departmentId === preferredDepartmentId)) ??
    candidacies[0];

  if (!candidacy) {
    return {
      teamOwnerSummary: undefined,
      teamOwnerId: undefined,
      teamMemberCount: 0
    };
  }

  const uniqueUsers = new Map<string, { id: string; name: string | null; email: string }>();
  candidacy.teamAssignments.forEach((assignment) => {
    uniqueUsers.set(assignment.user.id, assignment.user);
  });

  const primaryOwner =
    candidacy.teamAssignments.find((assignment) => assignment.role === "owner" && assignment.isPrimary) ??
    candidacy.teamAssignments.find((assignment) => assignment.role === "owner");

  if (!primaryOwner) {
    return {
      teamOwnerSummary: undefined,
      teamOwnerId: undefined,
      teamMemberCount: uniqueUsers.size
    };
  }

  const ownerLabel = primaryOwner.user.name || primaryOwner.user.email;
  const extraMembers = Math.max(0, uniqueUsers.size - 1);

  return {
    teamOwnerSummary: extraMembers > 0 ? `${ownerLabel} + ${extraMembers}` : ownerLabel,
    teamOwnerId: primaryOwner.user.id,
    teamMemberCount: uniqueUsers.size
  };
}

function buildCandidateWhere(filters?: {
  roleId?: string;
  stage?: CandidateStage;
  stageValues?: string[];
  departmentId?: string;
  orgStage?: "active" | "finalized";
  finalizedAs?: "hired" | "rejected";
  q?: string;
  owner?: string;
}): Prisma.CandidateWhereInput {
  const where: Prisma.CandidateWhereInput = {};

  if (filters?.roleId) {
    where.roleId = filters.roleId;
  }
  if (filters?.stageValues?.length) {
    where.stage = { in: filters.stageValues };
  } else if (filters?.stage) {
    where.stage = filters.stage;
  }
  if (filters?.departmentId) {
    where.departmentId = filters.departmentId;
  }
  if (filters?.orgStage) {
    where.orgStage = filters.orgStage;
  }
  if (filters?.finalizedAs) {
    where.finalizedAs = filters.finalizedAs;
  }
  if (filters?.owner) {
    where.hrOwnerId = filters.owner;
  }
  const searchQuery = filters?.q?.trim();
  if (searchQuery) {
    where.OR = [
      { fullName: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
      { hrOwner: { contains: searchQuery, mode: "insensitive" } },
      { hrOwnerUser: { name: { contains: searchQuery, mode: "insensitive" } } },
      { hrOwnerUser: { email: { contains: searchQuery, mode: "insensitive" } } }
    ];
  }

  return where;
}

export async function listCandidates(filters?: {
  roleId?: string;
  stage?: CandidateStage;
  assessmentStatus?: CandidateAssessmentStatus;
}) {
  const rows = await prisma.candidate.findMany({
    where: buildCandidateWhere({
      roleId: filters?.roleId,
      stage: filters?.stage
    }),
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          resumes: true
        }
      },
      resumes: {
        orderBy: { uploadedAt: "desc" },
        take: 1,
        select: {
          storageKey: true
        }
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        include: {
          invite: {
            select: {
              slug: true,
              mode: true
            }
          },
          attempt: {
            select: {
              status: true,
              startedAt: true,
              submittedAt: true
            }
          }
        }
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          candidateId: true,
          type: true,
          title: true,
          status: true,
          sortOrder: true,
          mode: true,
          date: true,
          notes: true,
          score: true,
          result: true,
          recommendation: true,
          candidateAssessmentId: true,
          createdAt: true,
          updatedAt: true
        }
      },
      role: {
        select: {
          label: true,
          department: true
        }
      },
      departmentCandidacies: {
        where: { status: "active" },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          departmentId: true,
          teamAssignments: {
            where: { isActive: true },
            select: {
              role: true,
              isPrimary: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  const attemptIds = rows.flatMap((row) =>
    row.assessments
      .map((assessment) => assessment.attemptId)
      .filter((value): value is string => Boolean(value))
  );
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  const mapped = rows.map((row) => {
    const base = mapCandidate(row);
    const teamSummary = summarizeCandidacyTeam(row.departmentCandidacies);
    const assessments = sortCandidateAssessmentsByLatestActivity(
      row.assessments.map((assessment) =>
        mapAssessment(
          assessment,
          assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
        )
      )
    );
    const latest = assessments[0] ?? null;

    return {
      ...base,
      hasResume: row._count.resumes > 0,
      latestResumeStorageKey: row.resumes[0]?.storageKey ?? undefined,
      currentFocus: currentFocusFromMilestones(row.milestones.map((milestone) => mapMilestone(milestone))),
      latestAssessment: latest,
      ...teamSummary
    } satisfies CandidateListItem;
  });

  return mapped.filter((row) => {
    if (filters?.assessmentStatus) {
      const status = row.latestAssessment?.status ?? "none";
      if (status !== filters.assessmentStatus) return false;
    }
    return true;
  });
}

export async function listCandidateWorkspacePage(
  filters: CandidateWorkspaceFilters = {}
): Promise<CandidateWorkspacePage> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));
  const skip = (page - 1) * pageSize;

  const where = buildCandidateWhere({
    roleId: filters.roleId,
    stage: filters.stage,
    stageValues: filters.stageValues,
    departmentId: filters.departmentId,
    orgStage: filters.orgStage,
    finalizedAs: filters.finalizedAs,
    owner: filters.owner,
    q: filters.q
  });

  const [dbCandidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip,
      include: {
        _count: {
          select: { resumes: true }
        },
        resumes: {
          orderBy: { uploadedAt: "desc" },
          take: 1,
          select: { storageKey: true }
        },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            invite: {
              select: { slug: true, mode: true }
            },
            attempt: {
              select: {
                status: true,
                startedAt: true,
                submittedAt: true
              }
            }
          }
        },
        milestones: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            candidateId: true,
            type: true,
            title: true,
            status: true,
            sortOrder: true,
            mode: true,
            date: true,
            notes: true,
            score: true,
            result: true,
            recommendation: true,
            candidateAssessmentId: true,
            createdAt: true,
            updatedAt: true
          }
        },
        role: {
          select: { label: true, department: true }
        },
        department: {
          select: { id: true, name: true }
        },
        departmentCandidacies: {
          where: {
            status: "active",
            ...(filters.departmentId ? { departmentId: filters.departmentId } : {})
          },
          orderBy: { updatedAt: "desc" },
          take: filters.departmentId ? 1 : 3,
          select: {
            departmentId: true,
            teamAssignments: {
              where: { isActive: true },
              select: {
                role: true,
                isPrimary: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.candidate.count({ where })
  ]);

  const attemptIds = dbCandidates.flatMap((row) =>
    row.assessments
      .map((assessment) => assessment.attemptId)
      .filter((value): value is string => Boolean(value))
  );
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);

  const candidates = dbCandidates.map((row) => {
    const base = mapCandidate(row);
    const teamSummary = summarizeCandidacyTeam(row.departmentCandidacies, filters.departmentId);
    const assessments = sortCandidateAssessmentsByLatestActivity(
      row.assessments.map((assessment) =>
        mapAssessment(
          assessment,
          assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
        )
      )
    );
    const latest = assessments[0] ?? null;

    return {
      ...base,
      hasResume: row._count.resumes > 0,
      latestResumeStorageKey: row.resumes[0]?.storageKey ?? undefined,
      currentFocus: currentFocusFromMilestones(row.milestones.map((milestone) => mapMilestone(milestone))),
      latestAssessment: latest,
      ...teamSummary
    } satisfies CandidateListItem;
  });

  const workspaceRows = candidates.map(toCandidateWorkspaceItem).filter((row) => {
    if (filters.assessmentStatus) {
      const status = row.latestAssessment?.status ?? "none";
      if (status !== filters.assessmentStatus) return false;
    }
    return true;
  });

  const sorted = sortCandidateWorkspaceItems(workspaceRows, filters.sort ?? "updated_desc");
  const roleOptions = (await listRoleCatalog()).map((role) => ({
    id: role.id,
    label: role.label,
    departmentId: role.departmentId
  }));

  const ownerUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  const ownerOptions = ownerUsers.map((user) => ({
    id: user.id,
    label: user.name ?? user.id
  }));

  return {
    rows: sorted,
    total,
    page,
    pageSize,
    roleOptions,
    ownerOptions,
    summary: buildCandidateOpenWorkSummary(sorted)
  };
}

export async function getCandidateStageCounts(departmentId?: string): Promise<CandidateStageCounts> {
  const activeWhere = {
    orgStage: "active" as const,
    ...(departmentId ? { departmentId } : {})
  };
  const finalizedWhere = {
    orgStage: "finalized" as const,
    ...(departmentId ? { departmentId } : {})
  };

  const poolWhere = {
    orgStatus: "talent_pool" as const,
    ...(departmentId ? { departmentId } : {})
  };

  const [stageCounts, finalizedCount, poolCount] = await Promise.all([
    prisma.candidate.groupBy({
      by: ["stage"],
      where: activeWhere,
      _count: true
    }),
    prisma.candidate.count({ where: finalizedWhere }),
    prisma.candidate.count({ where: poolWhere })
  ]);

  const counts: CandidateStageCounts = {
    applicant: 0,
    pipeline: 0,
    screening: 0,
    interview: 0,
    advanced_review: 0,
    finalized: finalizedCount,
    pool: poolCount
  };

  for (const group of stageCounts) {
    if (group.stage === "new") {
      counts.pipeline += group._count;
    } else if (group.stage === "finalized") {
      // Candidates with stage="finalized" but orgStage="active" are a data inconsistency;
      // add to the separately-computed finalizedCount instead of overwriting it.
      counts.finalized += group._count;
    } else if (group.stage in counts) {
      counts[group.stage as keyof CandidateStageCounts] = group._count;
    }
  }

  return counts;
}

export async function listTalentPool(departmentId?: string) {
  const where = {
    orgStatus: "talent_pool" as const,
    ...(departmentId ? { departmentId } : {})
  };
  const rows = await prisma.candidate.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      stage: true,
      positionAppliedFor: true,
      updatedAt: true,
      hrOwner: true,
      hrOwnerId: true,
    }
  });
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    stage: r.stage,
    positionAppliedFor: r.positionAppliedFor,
    updatedAt: r.updatedAt.toISOString(),
    hrOwner: r.hrOwner,
    hrOwnerId: r.hrOwnerId,
  }));
}

export async function getCandidateDetail(candidateId: string): Promise<CandidateDetail | null> {
  const row = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resumes: {
        orderBy: { uploadedAt: "desc" }
      },
      notes: {
        orderBy: { createdAt: "desc" }
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          jobPosting: {
            include: {
              role: {
                select: {
                  label: true,
                  department: true
                }
              },
              screenerPreset: {
                select: {
                  label: true
                }
              }
            }
          },
          screeningAddonResults: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              responses: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                select: {
                  questionKey: true,
                  questionLabel: true,
                  formatLabel: true,
                  answerText: true,
                  pointsEarned: true,
                  pointsPossible: true,
                  sortOrder: true
                }
              }
            }
          }
        }
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        include: {
          invite: {
            select: {
              slug: true,
              mode: true
            }
          },
          attempt: {
            select: {
              status: true,
              startedAt: true,
              submittedAt: true
            }
          }
        }
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          checks: {
            orderBy: { createdAt: "desc" }
          },
          candidateAssessment: {
            include: {
              invite: {
                select: {
                  slug: true,
                  mode: true
                }
              },
              attempt: {
                select: {
                  status: true,
                  startedAt: true,
                  submittedAt: true
                }
              }
            }
          }
        }
      },
      interviewPanels: {
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      },
      role: {
        select: {
          label: true,
          department: true
        }
      },
      departmentCandidacies: {
        orderBy: { updatedAt: "desc" },
        include: {
          department: {
            select: { id: true, name: true }
          },
          role: {
            select: { id: true, label: true }
          }
        }
      },
      externalAssessments: {
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        include: {
          attachments: {
            orderBy: { uploadedAt: "desc" }
          }
        }
      },
      activityEvents: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!row) {
    return null;
  }

  const attemptIds = row.assessments
    .map((assessment) => assessment.attemptId)
    .filter((value): value is string => Boolean(value));
  for (const milestone of row.milestones) {
    if (milestone.candidateAssessment?.attemptId) {
      attemptIds.push(milestone.candidateAssessment.attemptId);
    }
  }
  const resultsByAttemptId = await loadResultsByAttemptId(attemptIds);
  const authorIds = row.notes
    .map((note) => note.createdById)
    .filter((value): value is string => Boolean(value));
  const authorsById = await loadUsersById(authorIds);
  const interviewPanelsByMilestoneId = new Map(
    row.interviewPanels
      .filter((panel) => Boolean(panel.milestoneId))
      .map((panel) => [panel.milestoneId as string, mapInterviewPanel(panel)])
  );
  const milestones = row.milestones.map((milestone) =>
    mapMilestone(
      milestone,
      milestone.candidateAssessment
        ? mapAssessment(
            milestone.candidateAssessment,
            milestone.candidateAssessment.attemptId
              ? resultsByAttemptId.get(milestone.candidateAssessment.attemptId) ?? null
              : null
          )
        : null,
      interviewPanelsByMilestoneId.get(milestone.id) ?? null
    )
  );
  const assessments = sortCandidateAssessmentsByLatestActivity(
    row.assessments.map((assessment) =>
      mapAssessment(
        assessment,
        assessment.attemptId ? resultsByAttemptId.get(assessment.attemptId) ?? null : null
      )
    )
  );
  const applicationAssessments = row.applications
    .filter((application) => application.screeningAddonResults.length > 0)
    .map((application) => ({
      id: application.id,
      candidateId: application.candidateId,
      jobPostingId: application.jobPostingId,
      jobSlug: application.jobPosting.slug,
      jobTitle: application.jobPosting.title,
      roleLabel: application.jobPosting.role?.label ?? undefined,
      roleDepartment: application.jobPosting.role?.department ?? undefined,
      status: application.status as CandidateApplicationStatus,
      screenerPresetLabel: application.jobPosting.screenerPreset?.label ?? undefined,
      screeningStatus: deriveApplicationScreeningStatus(application.screeningAddonResults),
      screeningAddonResults: application.screeningAddonResults.map(
        mapApplicationScreeningAddonResult
      ),
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString()
    }));

  return {
    ...mapCandidate(row),
    resumes: row.resumes.map(mapResume),
    notes: row.notes.map((note) => mapNote(note, note.createdById ? authorsById.get(note.createdById) ?? null : null)),
    assessments,
    applications: row.applications.map(mapApplication),
    applicationAssessments,
    milestones,
    departmentCandidacies: row.departmentCandidacies?.map((dc) => ({
      id: dc.id,
      candidateId: dc.candidateId,
      departmentId: dc.departmentId,
      roleId: dc.roleId ?? undefined,
      hrOwnerId: dc.hrOwnerId ?? undefined,
      status: dc.status as "active" | "talent_pool" | "dept_rejected",
      source: dc.source as "manual" | "job_application" | "nominated",
      nominatedBy: dc.nominatedBy ?? undefined,
      nominationNote: dc.nominationNote ?? undefined,
      jobPostingId: dc.jobPostingId ?? undefined,
      department: {
        id: dc.department.id,
        name: dc.department.name
      },
      role: dc.role ? {
        id: dc.role.id,
        label: dc.role.label
      } : undefined,
      createdAt: dc.createdAt.toISOString(),
      updatedAt: dc.updatedAt.toISOString()
    })) ?? undefined,
    externalAssessments: row.externalAssessments.map(mapCandidateExternalAssessment),
    activityEvents: row.activityEvents.map((event) => ({
      id: event.id,
      actorId: event.actorId ?? undefined,
      actorName: event.actorName ?? undefined,
      event: event.event,
      entityType: event.entityType ?? undefined,
      entityId: event.entityId ?? undefined,
      detail: event.detail ?? undefined,
      createdAt: event.createdAt.toISOString()
    })),
    currentFocus: currentFocusFromMilestones(milestones),
    possibleDuplicates: await findPhoneDuplicates(candidateId, row.phone)
  };
}

async function findPhoneDuplicates(
  excludeId: string,
  phone: string | null
): Promise<Array<{ id: string; fullName: string; email: string }>> {
  if (!phone) return [];
  const normalized = phone.replace(/\D/g, "").slice(-10);
  if (normalized.length < 7) return [];
  const matches = await prisma.candidate.findMany({
    where: {
      id: { not: excludeId },
      phone: { endsWith: normalized.slice(-7) }
    },
    select: { id: true, fullName: true, email: true },
    take: 3
  });
  return matches;
}

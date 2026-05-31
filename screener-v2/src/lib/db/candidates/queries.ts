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
  mapMilestone,
  sortCandidateAssessmentsByLatestActivity,
  currentFocusFromMilestones,
  loadResultsByAttemptId,
  loadUsersById
} from "./mappers";
import type {
  CandidateDetail,
  CandidateListItem,
  CandidateWorkspaceFilters,
  CandidateWorkspacePage
} from "./types";

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
      latestAssessment: latest
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
      latestAssessment: latest
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
        : null
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

  return {
    ...mapCandidate(row),
    resumes: row.resumes.map(mapResume),
    notes: row.notes.map((note) => mapNote(note, note.createdById ? authorsById.get(note.createdById) ?? null : null)),
    assessments,
    applications: row.applications.map(mapApplication),
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
    currentFocus: currentFocusFromMilestones(milestones)
  };
}

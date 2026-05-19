import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

export type DepartmentCandidacyStatus = "active" | "talent_pool" | "dept_rejected";
export type CandidateOrgStatus = "active" | "talent_pool" | "org_rejected";

export interface DepartmentCandidacyRecord {
  id: string;
  candidateId: string;
  departmentId: string;
  roleId?: string;
  hrOwnerId?: string;
  status: DepartmentCandidacyStatus;
  source: "manual" | "job_application" | "nominated";
  nominatedBy?: string;
  nominationNote?: string;
  jobPostingId?: string;
  candidateName?: string;
  candidateEmail?: string;
  departmentName?: string;
  roleName?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrUpdateCandidacyInput {
  candidateId: string;
  departmentId: string;
  roleId?: string;
  hrOwnerId?: string;
  status?: DepartmentCandidacyStatus;
  source?: "manual" | "job_application" | "nominated";
  nominatedBy?: string;
  nominationNote?: string;
  jobPostingId?: string;
}

/**
 * Create or update a department candidacy for a candidate.
 * Uses upsert on the unique constraint (candidateId, departmentId).
 * Efficient: single database round-trip.
 */
export async function createOrUpdateDepartmentCandidacy(input: CreateOrUpdateCandidacyInput) {
  const candidacy = await prisma.departmentCandidacy.upsert({
    where: {
      candidateId_departmentId: {
        candidateId: input.candidateId,
        departmentId: input.departmentId
      }
    },
    update: {
      status: input.status ?? "active",
      ...(input.roleId && { roleId: input.roleId }),
      ...(input.hrOwnerId && { hrOwnerId: input.hrOwnerId }),
      ...(input.nominatedBy && { nominatedBy: input.nominatedBy }),
      ...(input.nominationNote && { nominationNote: input.nominationNote }),
      updatedAt: new Date()
    },
    create: {
      id: cuidLike(),
      candidateId: input.candidateId,
      departmentId: input.departmentId,
      roleId: input.roleId ?? undefined,
      hrOwnerId: input.hrOwnerId ?? undefined,
      status: input.status ?? "active",
      source: input.source ?? "manual",
      nominatedBy: input.nominatedBy ?? undefined,
      nominationNote: input.nominationNote ?? undefined,
      jobPostingId: input.jobPostingId ?? undefined
    },
    include: {
      candidate: {
        select: {
          fullName: true,
          email: true
        }
      },
      department: {
        select: {
          name: true
        }
      },
      role: {
        select: {
          label: true
        }
      }
    }
  });

  return {
    id: candidacy.id,
    candidateId: candidacy.candidateId,
    departmentId: candidacy.departmentId,
    roleId: candidacy.roleId ?? undefined,
    hrOwnerId: candidacy.hrOwnerId ?? undefined,
    status: candidacy.status as DepartmentCandidacyStatus,
    source: candidacy.source,
    nominatedBy: candidacy.nominatedBy ?? undefined,
    nominationNote: candidacy.nominationNote ?? undefined,
    jobPostingId: candidacy.jobPostingId ?? undefined,
    candidateName: candidacy.candidate.fullName,
    candidateEmail: candidacy.candidate.email,
    departmentName: candidacy.department.name,
    roleName: candidacy.role?.label ?? undefined,
    createdAt: candidacy.createdAt.toISOString(),
    updatedAt: candidacy.updatedAt.toISOString()
  };
}

interface ListCandidaciesForDepartmentFilters {
  departmentId: string;
  status?: DepartmentCandidacyStatus;
  q?: string; // Search in candidate name/email
  page?: number;
  pageSize?: number;
}

/**
 * List candidacies for a department with pagination.
 * Uses index: (departmentId, status, updatedAt)
 * Search is done in-memory after filtering (safe for <500 matches per filter).
 */
export async function listCandidaciesForDepartment(filters: ListCandidaciesForDepartmentFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

  const where = {
    departmentId: filters.departmentId,
    ...(filters.status && { status: filters.status })
  };

  // Fetch total count and paginated results in parallel
  const [total, rows] = await Promise.all([
    prisma.departmentCandidacy.count({ where }),
    prisma.departmentCandidacy.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            stage: true
          }
        },
        department: {
          select: { name: true }
        },
        role: {
          select: { label: true }
        }
      }
    })
  ]);

  // Apply search filter in-memory if provided (query-efficient since we're paginating anyway)
  let filtered = rows;
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    filtered = rows.filter(
      (r) =>
        r.candidate.fullName.toLowerCase().includes(q) ||
        r.candidate.email.toLowerCase().includes(q) ||
        r.candidate.phone?.toLowerCase().includes(q)
    );
  }

  return {
    rows: filtered.map((r) => ({
      id: r.id,
      candidateId: r.candidateId,
      departmentId: r.departmentId,
      roleId: r.roleId ?? undefined,
      hrOwnerId: r.hrOwnerId ?? undefined,
      status: r.status as DepartmentCandidacyStatus,
      source: r.source,
      nominatedBy: r.nominatedBy ?? undefined,
      nominationNote: r.nominationNote ?? undefined,
      jobPostingId: r.jobPostingId ?? undefined,
      candidateName: r.candidate.fullName,
      candidateEmail: r.candidate.email,
      candidatePhone: r.candidate.phone ?? undefined,
      candidateStage: r.candidate.stage,
      departmentName: r.department.name,
      roleName: r.role?.label ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    })),
    total,
    page,
    pageSize
  };
}

/**
 * List all candidacies for a candidate across all departments.
 * Shows which departments are actively considering this candidate.
 */
export async function listCandidaciesForCandidate(candidateId: string) {
  const candidacies = await prisma.departmentCandidacy.findMany({
    where: { candidateId },
    orderBy: { updatedAt: "desc" },
    include: {
      department: {
        select: { id: true, name: true }
      },
      role: {
        select: { id: true, label: true }
      }
    }
  });

  return candidacies.map((c) => ({
    id: c.id,
    candidateId: c.candidateId,
    departmentId: c.departmentId,
    roleId: c.roleId ?? undefined,
    hrOwnerId: c.hrOwnerId ?? undefined,
    status: c.status as DepartmentCandidacyStatus,
    source: c.source,
    nominatedBy: c.nominatedBy ?? undefined,
    nominationNote: c.nominationNote ?? undefined,
    jobPostingId: c.jobPostingId ?? undefined,
    departmentName: c.department.name,
    roleName: c.role?.label ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  }));
}

/**
 * Update a department candidacy status.
 * Also logs activity event on the candidate.
 */
export async function updateDepartmentCandidacyStatus(
  candidacyId: string,
  status: DepartmentCandidacyStatus,
  actorId?: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    const candidacy = await tx.departmentCandidacy.update({
      where: { id: candidacyId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        department: { select: { name: true } }
      }
    });

    // Log activity event on candidate
    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: candidacy.candidateId,
        actorId,
        event: "candidacy_status_changed",
        entityType: "candidacy",
        detail: `${candidacy.department.name}: ${status}`,
        createdAt: new Date()
      }
    });

    return candidacy;
  });

  return {
    id: updated.id,
    candidateId: updated.candidateId,
    departmentId: updated.departmentId,
    status: updated.status as DepartmentCandidacyStatus,
    departmentName: updated.department.name,
    updatedAt: updated.updatedAt.toISOString()
  };
}

/**
 * Set organization-level status for a candidate.
 * If setting to org_rejected, cascades to all active candidacies (sets them to dept_rejected).
 * Efficient: single transaction with batch update.
 */
export async function setOrgStatus(
  candidateId: string,
  orgStatus: CandidateOrgStatus,
  actorId?: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    // Update candidate org status
    const candidate = await tx.candidate.update({
      where: { id: candidateId },
      data: {
        orgStatus,
        updatedAt: new Date()
      }
    });

    // If org_rejected, cascade to all active candidacies
    if (orgStatus === "org_rejected") {
      await tx.departmentCandidacy.updateMany({
        where: {
          candidateId,
          status: "active" // Only cascade from active state
        },
        data: {
          status: "dept_rejected",
          updatedAt: new Date()
        }
      });
    }

    // Log activity event
    await tx.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId,
        actorId,
        event: "org_status_changed",
        detail: orgStatus,
        createdAt: new Date()
      }
    });

    return candidate;
  });

  return {
    id: updated.id,
    candidateId: updated.id,
    orgStatus: updated.orgStatus as CandidateOrgStatus,
    updatedAt: updated.updatedAt.toISOString()
  };
}

/**
 * Batch create candidacies from a job posting's applications.
 * Used when promoting multiple applicants or auto-routing job applicants.
 * Efficient: single batch insert of all candidacies.
 */
export async function batchCreateCandidaciesForJob(
  jobPostingId: string,
  candidateIds: string[]
) {
  if (candidateIds.length === 0) return { created: 0 };

  // Get the job posting to extract departmentId from role
  const jobPosting = await prisma.jobPosting.findUnique({
    where: { id: jobPostingId },
    select: {
      id: true,
      role: {
        select: { id: true, departmentId: true }
      }
    }
  });

  if (!jobPosting?.role) {
    throw new Error("Job posting or role not found");
  }

  const departmentId = jobPosting.role.departmentId!;
  const roleId = jobPosting.role.id;

  // Batch create candidacies
  const result = await prisma.$transaction(async (tx) => {
    // Use createMany but fall back to individual upserts if createMany fails
    // This handles the case where some candidacies already exist
    const existingCandidacies = await tx.departmentCandidacy.findMany({
      where: {
        departmentId,
        candidateId: { in: candidateIds }
      },
      select: { candidateId: true }
    });

    const existingIds = new Set(existingCandidacies.map((c) => c.candidateId));
    const newIds = candidateIds.filter((id) => !existingIds.has(id));

    if (newIds.length > 0) {
      await tx.departmentCandidacy.createMany({
        data: newIds.map((candidateId) => ({
          id: cuidLike(),
          candidateId,
          departmentId,
          roleId,
          status: "active" as const,
          source: "job_application" as const,
          jobPostingId,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      });
    }

    return { created: newIds.length };
  });

  return result;
}

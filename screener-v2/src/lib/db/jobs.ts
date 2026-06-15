import { Prisma } from "@prisma/client";
import { isMissingAssessmentPresetDepartmentColumnError } from "@/lib/addons/catalog";
import type { ExamState } from "@/lib/assessment-engine/types";
import { prisma } from "@/lib/db/prisma";
import { mapCandidate } from "@/lib/db/candidates";
import { createCandidate, findExistingCandidateByEmail } from "@/lib/db/candidates";
import { createOrGetParticipant, getAttempt, startAttempt } from "@/lib/db/repositories";
import {
  type ApplicationScreeningAddonResultItem,
  type ApplicationScreeningPackage,
  type ApplicationScreeningStatus,
  candidateApplicationStatusValues,
  isActiveApplicationStatus,
  type CandidateApplicationListItem,
  type CandidateApplicationStatus,
  type JobPostingDetail,
  type JobPostingListItem
} from "@/lib/jobs/types";
import {
  buildApplicationScreeningBlueprint,
  evaluateApplicationScreening,
  evaluateApplicationScreeningFromExamState,
  normalizeApplicationScreeningAnswerMap,
  resolveApplicationScreeningPackageFromPreset,
  type ApplicationScreeningAnswerMap,
  type ApplicationScreeningResponseDraft
} from "@/lib/jobs/application-screening";
import {
  deriveApplicationScreeningStatus,
  mapApplicationScreeningAddonResult
} from "@/lib/jobs/screening-results";
import { cuidLike } from "@/lib/tokens/token-service";

type JobPostingRow = {
  id: string;
  slug: string;
  title: string;
  roleId: string | null;
  screenerPresetId: string | null;
  summary: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  teamSize: number | null;
  techStack: string | null;
  remotePolicy: string | null;
  isPublished: boolean;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: { label: string; department: string | null; departmentId?: string | null } | null;
  screenerPreset: { id: string; label: string } | null;
  applications?: Array<{ status: string }>;
  _count?: { applications?: number };
};

function activeApplicantCount(rows: Array<{ status: string }>) {
  return rows.filter((row) => candidateApplicationStatusValues.includes(row.status as CandidateApplicationStatus) && isActiveApplicationStatus(row.status as CandidateApplicationStatus)).length;
}

function slugifyJobTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function mapJobPosting(row: JobPostingRow): JobPostingListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    departmentId: row.role?.departmentId ?? undefined,
    roleId: row.roleId ?? undefined,
    roleLabel: row.role?.label ?? undefined,
    roleDepartment: row.role?.department ?? undefined,
    screenerPresetId: row.screenerPresetId ?? undefined,
    screenerPresetLabel: row.screenerPreset?.label ?? undefined,
    summary: row.summary,
    description: row.description,
    salaryMin: row.salaryMin ?? undefined,
    salaryMax: row.salaryMax ?? undefined,
    teamSize: row.teamSize ?? undefined,
    techStack: row.techStack ?? undefined,
    remotePolicy: row.remotePolicy ?? undefined,
    isPublished: row.isPublished,
    isOpen: row.isOpen,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    applicantCount: row._count?.applications ?? (row.applications ? activeApplicantCount(row.applications) : 0)
  };
}

function mapApplication(row: {
  id: string;
  candidateId: string;
  status: string;
  coverNote: string | null;
  source: string | null;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    hrOwner: string | null;
    _count: { resumes: number };
  };
  jobPosting: {
    id: string;
    slug: string;
    title: string;
    role: { label: string; department: string | null } | null;
  };
}): CandidateApplicationListItem {
  return {
    id: row.id,
    candidateId: row.candidate.id,
    candidateName: row.candidate.fullName,
    candidateEmail: row.candidate.email,
    candidateOwner: row.candidate.hrOwner ?? undefined,
    hasResume: row.candidate._count.resumes > 0,
    jobPostingId: row.jobPosting.id,
    jobSlug: row.jobPosting.slug,
    jobTitle: row.jobPosting.title,
    roleLabel: row.jobPosting.role?.label ?? undefined,
    coverNote: row.coverNote ?? undefined,
    source: row.source ?? undefined,
    referredBy: row.referredBy ?? undefined,
    appliedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status as CandidateApplicationStatus
  };
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function applicationScreeningRuntimeSlug(applicationId: string) {
  return `application-screening-${applicationId}`;
}

function buildApplicationScreeningFinishHref(input: {
  jobSlug: string;
  applicationId: string;
  resumeError?: boolean;
}) {
  const params = new URLSearchParams({
    submitted: "1",
    applicationId: input.applicationId
  });

  if (input.resumeError) {
    params.set("resumeError", "1");
  }

  return `/jobs/${input.jobSlug}/apply?${params.toString()}`;
}

function firstAnsweredResponseText(
  evaluation: ReturnType<typeof evaluateApplicationScreening>,
  questionKey: string
) {
  for (const addonResult of evaluation.addonResults) {
    const response = addonResult.responses.find((item) => item.questionKey === questionKey);
    const answerText = response?.answerText?.trim();
    if (answerText) {
      return answerText;
    }
  }

  return undefined;
}

function deriveCandidateProfileSeedFromScreening(
  evaluation: ReturnType<typeof evaluateApplicationScreening>
) {
  return {
    location: firstAnsweredResponseText(evaluation, "currentLocation"),
    salaryExpectation: firstAnsweredResponseText(evaluation, "salaryExpectation")
  };
}

async function replaceApplicationScreeningResultsInTx(args: {
  tx: Prisma.TransactionClient;
  applicationId: string;
  evaluation: ReturnType<typeof evaluateApplicationScreeningFromExamState>;
}) {
  await args.tx.candidateApplicationResponse.deleteMany({
    where: { applicationId: args.applicationId }
  });
  await args.tx.candidateApplicationAddonResult.deleteMany({
    where: { applicationId: args.applicationId }
  });

  for (const addonResult of args.evaluation.addonResults) {
    const createdAddonResult = await args.tx.candidateApplicationAddonResult.create({
      data: {
        applicationId: args.applicationId,
        presetId: addonResult.presetId,
        presetLabel: addonResult.presetLabel,
        addonId: addonResult.addonId ?? null,
        addonSlug: addonResult.addonSlug,
        addonLabel: addonResult.addonLabel,
        assessmentTypeId: addonResult.assessmentTypeId,
        requiredPercent: addonResult.requiredPercent,
        weight: addonResult.weight,
        isMandatory: addonResult.isMandatory,
        inlineSupported: addonResult.inlineSupported,
        status: addonResult.status,
        applicantPercent: addonResult.applicantPercent,
        pointsEarned: addonResult.pointsEarned,
        pointsPossible: addonResult.pointsPossible,
        sortOrder: addonResult.sortOrder
      }
    });

    if (addonResult.responses.length === 0) {
      continue;
    }

    const responses = addonResult.responses as ApplicationScreeningResponseDraft[];
    await args.tx.candidateApplicationResponse.createMany({
      data: responses.map((response) => ({
        applicationId: args.applicationId,
        addonResultId: createdAddonResult.id,
        questionKey: response.questionKey,
        questionLabel: response.questionLabel,
        formatLabel: response.formatLabel,
        answerJson: toPrismaJsonValue(response.answerJson ?? null),
        answerText: response.answerText,
        pointsEarned: response.pointsEarned,
        pointsPossible: response.pointsPossible,
        sortOrder: response.sortOrder
      }))
    });
  }
}

function buildApplicantWorkspaceWhere(filters: {
  q?: string;
  jobId?: string;
  status?: CandidateApplicationStatus;
  resumeMissing?: boolean;
  departmentId?: string | null;
}): Prisma.CandidateApplicationWhereInput {
  const query = filters.q?.trim();

  return {
    ...(filters.jobId ? { jobPostingId: filters.jobId } : {}),
    ...(filters.departmentId ? { jobPosting: { role: { departmentId: filters.departmentId } } } : {}),
    ...(filters.resumeMissing ? { candidate: { resumes: { none: {} } } } : {}),
    ...(filters.status
      ? { status: filters.status }
      : {
          status: {
            in: ["submitted", "under_review"] satisfies CandidateApplicationStatus[]
          }
        }),
    ...(query
      ? {
          OR: [
            { candidate: { fullName: { contains: query, mode: "insensitive" } } },
            { candidate: { email: { contains: query, mode: "insensitive" } } },
            { candidate: { hrOwner: { contains: query, mode: "insensitive" } } },
            { jobPosting: { title: { contains: query, mode: "insensitive" } } },
            { jobPosting: { role: { label: { contains: query, mode: "insensitive" } } } }
          ]
        }
      : {})
  };
}

type ListPublicJobPostingsFilters = {
  q?: string;
  department?: string;
  sort?: "updated_desc" | "updated_asc" | "title_asc";
};

export async function listPublicJobPostings(filters: ListPublicJobPostingsFilters = {}) {
  const query = filters.q?.trim();
  const where: Prisma.JobPostingWhereInput = {
    isPublished: true,
    isOpen: true,
    ...(filters.department
      ? {
          role: {
            department: filters.department
          }
        }
      : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { role: { label: { contains: query, mode: "insensitive" } } }
          ]
        }
      : {})
  };

  const orderBy: Prisma.JobPostingOrderByWithRelationInput[] =
    filters.sort === "updated_asc"
      ? [{ updatedAt: "asc" }, { title: "asc" }]
      : filters.sort === "title_asc"
      ? [{ title: "asc" }, { updatedAt: "desc" }]
      : [{ updatedAt: "desc" }, { title: "asc" }];

  const rows = await prisma.jobPosting.findMany({
    where,
    orderBy,
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      _count: {
        select: {
          applications: {
            where: { status: { in: ["submitted", "under_review"] } }
          }
        }
      }
    }
  });

  return rows.map(mapJobPosting);
}

export async function getPublicJobPostingBySlug(slug: string) {
  const row = await prisma.jobPosting.findFirst({
    where: {
      slug,
      isPublished: true,
      isOpen: true
    },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  return row ? mapJobPosting(row) : null;
}

export async function getPublicJobApplicationContextBySlug(slug: string): Promise<{
  job: JobPostingListItem;
  screeningPackage: ApplicationScreeningPackage | null;
} | null> {
  const row = await prisma.jobPosting.findFirst({
    where: {
      slug,
      isPublished: true,
      isOpen: true
    },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true,
          items: {
            select: {
              id: true,
              sortOrder: true,
              configOverrideJson: true,
              weightOverride: true,
              addon: {
                select: {
                  id: true,
                  slug: true,
                  label: true,
                  assessmentTypeId: true,
                  defaultConfigJson: true,
                  defaultRequiredPercent: true,
                  defaultWeight: true
                }
              }
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      },
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  if (!row) {
    return null;
  }

  return {
    job: mapJobPosting({
      ...row,
      screenerPreset: row.screenerPreset
        ? { id: row.screenerPreset.id, label: row.screenerPreset.label }
        : null
    }),
    screeningPackage: resolveApplicationScreeningPackageFromPreset(row.screenerPreset)
  };
}

export async function listJobPostings(departmentId?: string) {
  const where: Prisma.JobPostingWhereInput = departmentId
    ? { role: { departmentId } }
    : {};

  const rows = await prisma.jobPosting.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      _count: {
        select: {
          applications: {
            where: { status: { in: ["submitted", "under_review"] } }
          }
        }
      }
    }
  });

  return rows.map(mapJobPosting);
}

export async function getJobPosting(jobId: string) {
  const row = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      applications: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
              hrOwner: true,
              _count: {
                select: {
                  resumes: true
                }
              }
            }
          },
          jobPosting: {
            include: {
              role: {
                select: {
                  label: true,
                  department: true,
                  departmentId: true
                }
              },
              screenerPreset: {
                select: {
                  id: true,
                  label: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!row) {
    return null;
  }

  return {
    ...mapJobPosting({
      ...row,
      applications: row.applications.map((application) => ({
        status: application.status
      }))
    }),
    recentApplications: row.applications.map(mapApplication)
  } satisfies JobPostingDetail;
}

async function uniqueJobSlug(title: string, excludeId?: string) {
  const base = slugifyJobTitle(title) || "job";
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.jobPosting.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      select: { id: true }
    });
    if (!existing) {
      return slug;
    }
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createJobPosting(input: {
  title: string;
  roleId?: string;
  screenerPresetId?: string;
  summary: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  teamSize?: number;
  techStack?: string;
  remotePolicy?: string;
  isPublished?: boolean;
  isOpen?: boolean;
}) {
  const title = input.title.trim();
  const slug = await uniqueJobSlug(title);
  const row = await prisma.jobPosting.create({
    data: {
      slug,
      title,
      roleId: input.roleId?.trim() || null,
      screenerPresetId: input.screenerPresetId?.trim() || null,
      summary: input.summary.trim(),
      description: input.description.trim(),
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      teamSize: input.teamSize ?? null,
      techStack: input.techStack?.trim() || null,
      remotePolicy: input.remotePolicy?.trim() || null,
      isPublished: Boolean(input.isPublished),
      isOpen: input.isOpen ?? true
    },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  return mapJobPosting(row);
}

export async function validateJobPostingWorkspaceSelection(input: {
  roleId: string;
  departmentId?: string;
  screenerPresetId?: string;
}) {
  const role = await prisma.roleCatalog.findUnique({
    where: { id: input.roleId },
    select: {
      id: true,
      departmentId: true
    }
  });
  if (!role) {
    throw new Error("Job designation not found.");
  }

  const workspaceDepartmentId = input.departmentId?.trim();
  if (workspaceDepartmentId && role.departmentId !== workspaceDepartmentId) {
    throw new Error("Job designation must belong to this workspace.");
  }

  const screenerPresetId = input.screenerPresetId?.trim();
  if (!screenerPresetId) {
    return {
      roleDepartmentId: role.departmentId,
      presetDepartmentId: null
    };
  }

  const preset = await prisma.assessmentPreset.findUnique({
    where: { id: screenerPresetId },
    select: {
      id: true,
      departmentId: true
    }
  }).catch(async (error) => {
    if (!isMissingAssessmentPresetDepartmentColumnError(error)) {
      throw error;
    }

    const legacyPreset = await prisma.assessmentPreset.findUnique({
      where: { id: screenerPresetId },
      select: {
        id: true
      }
    });

    return legacyPreset ? { id: legacyPreset.id, departmentId: null } : null;
  });
  if (!preset) {
    throw new Error("Application screening package not found.");
  }

  if (workspaceDepartmentId && preset.departmentId && preset.departmentId !== workspaceDepartmentId) {
    throw new Error("Application screening package is not available in this workspace.");
  }

  return {
    roleDepartmentId: role.departmentId,
    presetDepartmentId: preset.departmentId ?? null
  };
}

export async function updateJobPosting(
  jobId: string,
  input: {
    title: string;
    roleId?: string;
    screenerPresetId?: string;
    summary: string;
    description: string;
    salaryMin?: number | string | null;
    salaryMax?: number | string | null;
    teamSize?: number | string | null;
    techStack?: string;
    remotePolicy?: string;
    isPublished?: boolean;
    isOpen?: boolean;
  }
) {
  const title = input.title.trim();
  const slug = await uniqueJobSlug(title, jobId);
  const getSalaryMin = (val?: number | string | null) => val == null ? null : (typeof val === 'number' ? val : Number(val));
  const getSalaryMax = (val?: number | string | null) => val == null ? null : (typeof val === 'number' ? val : Number(val));
  const getTeamSize = (val?: number | string | null) => val == null ? null : (typeof val === 'number' ? val : Number(val));
  const row = await prisma.jobPosting.update({
    where: { id: jobId },
    data: {
      slug,
      title,
      roleId: input.roleId?.trim() || null,
      screenerPresetId: input.screenerPresetId === "" ? null : (input.screenerPresetId?.trim() || undefined),
      summary: input.summary.trim(),
      description: input.description.trim(),
      salaryMin: getSalaryMin(input.salaryMin),
      salaryMax: getSalaryMax(input.salaryMax),
      teamSize: getTeamSize(input.teamSize),
      techStack: input.techStack?.trim() || null,
      remotePolicy: input.remotePolicy?.trim() || null,
      isPublished: Boolean(input.isPublished),
      isOpen: Boolean(input.isOpen)
    },
    include: {
      role: {
        select: {
          label: true,
          department: true,
          departmentId: true
        }
      },
      screenerPreset: {
        select: {
          id: true,
          label: true
        }
      },
      applications: {
        select: {
          status: true
        }
      }
    }
  });

  return mapJobPosting(row);
}

export async function listApplicantWorkspacePage(filters: {
  q?: string;
  jobId?: string;
  status?: CandidateApplicationStatus;
  resumeMissing?: boolean;
  departmentId?: string | null;
  page?: number;
  pageSize?: number;
} = {}) {
  const requestedPage = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));
  const where = buildApplicantWorkspaceWhere(filters);
  const total = await prisma.candidateApplication.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const [rows, resumeMissing, submitted, underReview, jobOptionRows] = await Promise.all([
    prisma.candidateApplication.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        candidateId: true,
        status: true,
        coverNote: true,
        source: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
            hrOwner: true,
            _count: {
              select: {
                resumes: true
              }
            }
          }
        },
        jobPosting: {
          select: {
            id: true,
            slug: true,
            title: true,
            role: {
              select: {
                label: true,
                department: true,
                departmentId: true
              }
            }
          }
        }
      }
    }),
    prisma.candidateApplication.count({
      where: {
        AND: [where, { candidate: { resumes: { none: {} } } }]
      }
    }),
    prisma.candidateApplication.count({
      where: {
        AND: [where, { status: "submitted" }]
      }
    }),
    prisma.candidateApplication.count({
      where: {
        AND: [where, { status: "under_review" }]
      }
    }),
    prisma.jobPosting.findMany({
      where: filters.departmentId ? { role: { departmentId: filters.departmentId } } : {},
      select: { id: true, title: true },
      orderBy: [{ title: "asc" }]
    })
  ]);

  const applicationIds = rows.map((r) => r.id);
  const assignments = applicationIds.length > 0
    ? await prisma.hiringAssignment.findMany({
        where: { applicationId: { in: applicationIds }, active: true },
        select: {
          applicationId: true,
          assignmentRole: true,
          user: { select: { name: true } },
        },
      })
    : [];

  const assignmentsByApp = new Map<string, Array<{ name: string; role: string }>>();
  for (const a of assignments) {
    const list = assignmentsByApp.get(a.applicationId) ?? [];
    list.push({ name: a.user.name ?? "Unknown", role: a.assignmentRole });
    assignmentsByApp.set(a.applicationId, list);
  }

  return {
    rows: rows.map((r) => ({
      ...mapApplication(r),
      teamAssignments: assignmentsByApp.get(r.id),
    })),
    total,
    page,
    pageSize,
    jobOptions: jobOptionRows.map((job) => ({
      id: job.id,
      label: job.title
    })),
    summary: {
      total,
      resumeMissing,
      submitted,
      underReview
    }
  };
}

export async function getApplicantReviewDetail(applicationId: string) {
  const row = await prisma.candidateApplication.findUnique({
    where: { id: applicationId },
    include: {
      candidate: {
        include: {
          resumes: {
            orderBy: { uploadedAt: "desc" },
            take: 1
          },
          role: {
            select: {
              label: true,
              department: true
            }
          }
        }
      },
      jobPosting: {
        include: {
          role: {
            select: {
              label: true,
              department: true,
              departmentId: true
            }
          },
          screenerPreset: {
            select: {
              id: true,
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
  });

  if (!row) {
    return null;
  }

  const latestResume = row.candidate.resumes[0] ?? null;

  return {
    id: row.id,
    status: row.status as CandidateApplicationStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    candidate: mapCandidate(row.candidate),
    job: mapJobPosting({
      ...row.jobPosting,
      applications: []
    }),
    latestResume: latestResume
      ? {
          fileName: latestResume.fileName,
          storageKey: latestResume.storageKey,
          sizeBytes: latestResume.sizeBytes,
          uploadedAt: latestResume.uploadedAt.toISOString()
        }
      : null,
    applicationNote: row.coverNote?.trim() || "",
    screeningStatus: deriveApplicationScreeningStatus(row.screeningAddonResults),
    screeningAddonResults: row.screeningAddonResults.map(mapApplicationScreeningAddonResult)
  };
}

export async function getPublicApplicationStatus(applicationId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const row = await prisma.candidateApplication.findFirst({
    where: {
      id: applicationId,
      candidate: {
        email: normalizedEmail
      }
    },
    include: {
      candidate: {
        select: {
          fullName: true,
          email: true,
          phone: true
        }
      },
      jobPosting: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  });

  if (!row) {
    return null;
  }

  return {
    applicationId: row.id,
    status: row.status as CandidateApplicationStatus,
    appliedAt: row.createdAt.toISOString(),
    candidateName: row.candidate.fullName,
    candidateEmail: row.candidate.email,
    candidatePhone: row.candidate.phone ?? undefined,
    jobTitle: row.jobPosting.title,
    jobSlug: row.jobPosting.slug
  };
}

export type PublicApplicationSource =
  | "direct"
  | "linkedin"
  | "job_board"
  | "referral"
  | "agency"
  | "other";

export async function createCandidateApplicationFromPublicSubmission(input: {
  jobSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  coverNote?: string;
  consentGivenAt?: Date;
  consentVersion?: string;
  screeningAnswers?: ApplicationScreeningAnswerMap | Record<string, unknown>;
  source?: PublicApplicationSource;
  referredBy?: string;
}) {
  const job = await prisma.jobPosting.findFirst({
    where: {
      slug: input.jobSlug,
      isPublished: true,
      isOpen: true
    },
    select: {
      id: true,
      slug: true,
      title: true,
      roleId: true,
      departmentId: true,
      role: {
        select: { departmentId: true }
      },
      screenerPresetId: true,
      screenerPreset: {
        select: {
          id: true,
          label: true,
          items: {
            select: {
              id: true,
              sortOrder: true,
              configOverrideJson: true,
              weightOverride: true,
              addon: {
                select: {
                  id: true,
                  slug: true,
                  label: true,
                  description: true,
                  assessmentTypeId: true,
                  defaultConfigJson: true,
                  defaultDurationMinutes: true,
                  defaultRequiredPercent: true,
                  defaultWeight: true
                }
              }
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      }
    }
  });

  if (!job) {
    throw new Error("This job is not available right now.");
  }

  const screeningPackage = resolveApplicationScreeningPackageFromPreset(job.screenerPreset);
  const screeningAnswers = normalizeApplicationScreeningAnswerMap(input.screeningAnswers);

  const normalizedEmail = input.email.trim().toLowerCase();
  let existingCandidate = await findExistingCandidateByEmail(normalizedEmail);

  if (!existingCandidate) {
    try {
      const created = await createCandidate({
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        roleId: job.roleId ?? undefined,
        departmentId: job.role?.departmentId ?? undefined,
        positionAppliedFor: job.title,
        resumeSource: "Company Website",
        stage: "applicant"
      });
      existingCandidate = {
        id: created.id,
        fullName: created.fullName,
        email: created.email
      };
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("already exists")) {
        throw error;
      }
      existingCandidate = await findExistingCandidateByEmail(normalizedEmail);
    }
  } else {
    const candidateId = existingCandidate.id;
    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id: candidateId },
        data: {
          fullName: input.fullName.trim(),
          phone: input.phone?.trim() || undefined,
          roleId: job.roleId ?? undefined,
          departmentId: job.role?.departmentId ?? undefined,
          positionAppliedFor: job.title
        }
      });

      if (job.role?.departmentId) {
        await tx.departmentCandidacy.upsert({
          where: {
            candidateId_departmentId: {
              candidateId,
              departmentId: job.role.departmentId
            }
          },
          update: {
            roleId: job.roleId,
            status: "active",
            updatedAt: new Date()
          },
          create: {
            id: cuidLike(),
            candidateId,
            departmentId: job.role.departmentId,
            roleId: job.roleId,
            status: "active",
            source: "job_application",
            jobPostingId: job.id
          }
        });
      }
    });
  }

  if (!existingCandidate) {
    throw new Error("Could not create the applicant record.");
  }

  const existingApplication = await prisma.candidateApplication.findUnique({
    where: {
      candidateId_jobPostingId: {
        candidateId: existingCandidate.id,
        jobPostingId: job.id
      }
    },
    select: {
      id: true,
      screeningAttemptId: true
    }
  });

  if (existingApplication) {
    return {
      status: "duplicate" as const,
      candidateId: existingCandidate.id,
      applicationId: existingApplication.id,
      jobId: job.id,
      screeningAttemptId: existingApplication.screeningAttemptId ?? undefined
    };
  }

  const screeningEvaluation = evaluateApplicationScreening(screeningPackage, screeningAnswers);
  const profileSeed = deriveCandidateProfileSeedFromScreening(screeningEvaluation);

  const application = await prisma.$transaction(async (tx) => {
    if (profileSeed.location || profileSeed.salaryExpectation) {
      await tx.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          location: profileSeed.location?.trim() || undefined,
          salaryExpectation: profileSeed.salaryExpectation?.trim() || undefined
        }
      });
    }

    const createdApplication = await tx.candidateApplication.create({
      data: {
        candidateId: existingCandidate.id,
        jobPostingId: job.id,
        status: "submitted",
        coverNote: input.coverNote?.trim() || null,
        consentGivenAt: input.consentGivenAt ?? null,
        consentVersion: input.consentVersion ?? null,
        source: input.source ?? "direct",
        referredBy: input.source === "referral" ? (input.referredBy?.trim() || null) : null,
      }
    });

    if (screeningEvaluation.addonResults.length > 0) {
      await replaceApplicationScreeningResultsInTx({
        tx,
        applicationId: createdApplication.id,
        evaluation: screeningEvaluation
      });
    }

    return createdApplication;
  });

  return {
    status: "created" as const,
    candidateId: existingCandidate.id,
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    departmentId: job.departmentId ?? job.role?.departmentId ?? null,
    screenerPreset: job.screenerPreset,
    requiresScreening: screeningEvaluation.addonResults.length > 0
  };
}

export async function beginPublicApplicationScreeningFlow(input: {
  applicationId: string;
}) {
  const application = await prisma.candidateApplication.findUnique({
    where: { id: input.applicationId },
    select: {
      id: true,
      screeningAttemptId: true,
      candidate: {
        select: {
          fullName: true,
          email: true,
          phone: true
        }
      },
      jobPosting: {
        select: {
          slug: true,
          screenerPreset: {
            select: {
              id: true,
              label: true,
              items: {
                select: {
                  id: true,
                  sortOrder: true,
                  configOverrideJson: true,
                  weightOverride: true,
                  addon: {
                    select: {
                      id: true,
                      slug: true,
                      label: true,
                      description: true,
                      assessmentTypeId: true,
                      defaultConfigJson: true,
                      defaultDurationMinutes: true,
                      defaultRequiredPercent: true,
                      defaultWeight: true
                    }
                  }
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          }
        }
      }
    }
  });

  if (!application) {
    throw new Error("Application not found.");
  }

  const screeningPackage = resolveApplicationScreeningPackageFromPreset(
    application.jobPosting.screenerPreset
  );

  if (!screeningPackage || screeningPackage.addons.length === 0) {
    return null;
  }

  const attemptId = application.screeningAttemptId ?? null;
  if (attemptId) {
    const existingAttempt = await getAttempt(attemptId);
    if (existingAttempt) {
      return {
        applicationId: application.id,
        attemptId: existingAttempt.id,
        jobSlug: application.jobPosting.slug,
        runtimeSlug: applicationScreeningRuntimeSlug(application.id)
      };
    }
  }

  const participant = await createOrGetParticipant({
    kind: "candidate",
    fullName: application.candidate.fullName,
    email: application.candidate.email,
    phone: application.candidate.phone ?? undefined
  });
  const started = await startAttempt({
    assessmentVersionId: "application-screening",
    participantId: participant.id,
    contextType: "hiring",
    integrityPreset: "standard",
    passTargetPercent: 0,
    blueprint: buildApplicationScreeningBlueprint(screeningPackage)
  });

  await prisma.candidateApplication.update({
    where: { id: application.id },
    data: {
      screeningAttemptId: started.attempt.id
    }
  });

  return {
    applicationId: application.id,
    attemptId: started.attempt.id,
    jobSlug: application.jobPosting.slug,
    runtimeSlug: applicationScreeningRuntimeSlug(application.id)
  };
}

export async function syncPublicApplicationScreeningResultsFromAttempt(attemptId: string) {
  const application = await prisma.candidateApplication.findFirst({
    where: { screeningAttemptId: attemptId },
    select: {
      id: true,
      jobPosting: {
        select: {
          screenerPreset: {
            select: {
              id: true,
              label: true,
              items: {
                select: {
                  id: true,
                  sortOrder: true,
                  configOverrideJson: true,
                  weightOverride: true,
                  addon: {
                    select: {
                      id: true,
                      slug: true,
                      label: true,
                      description: true,
                      assessmentTypeId: true,
                      defaultConfigJson: true,
                      defaultDurationMinutes: true,
                      defaultRequiredPercent: true,
                      defaultWeight: true
                    }
                  }
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          }
        }
      }
    }
  });

  if (!application) {
    return null;
  }

  const screeningPackage = resolveApplicationScreeningPackageFromPreset(
    application.jobPosting.screenerPreset
  );
  if (!screeningPackage) {
    return null;
  }

  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.status !== "submitted") {
    return null;
  }

  const evaluation = evaluateApplicationScreeningFromExamState(
    screeningPackage,
    attempt.examState as Partial<Record<string, ExamState>>
  );

  await prisma.$transaction(async (tx) => {
    await replaceApplicationScreeningResultsInTx({
      tx,
      applicationId: application.id,
      evaluation
    });
  });

  return {
    applicationId: application.id
  };
}

export async function getPublicApplicationScreeningContext(input: {
  applicationId: string;
  jobSlug: string;
}) {
  const application = await prisma.candidateApplication.findFirst({
    where: {
      id: input.applicationId,
      jobPosting: {
        slug: input.jobSlug
      }
    },
    select: {
      id: true,
      screeningAttemptId: true,
      candidate: {
        select: {
          fullName: true
        }
      },
      jobPosting: {
        select: {
          title: true,
          role: {
            select: {
              label: true,
              department: true
            }
          },
          screenerPreset: {
            select: {
              id: true,
              label: true,
              items: {
                select: {
                  id: true,
                  sortOrder: true,
                  configOverrideJson: true,
                  weightOverride: true,
                  addon: {
                    select: {
                      id: true,
                      slug: true,
                      label: true,
                      description: true,
                      assessmentTypeId: true,
                      defaultConfigJson: true,
                      defaultDurationMinutes: true,
                      defaultRequiredPercent: true,
                      defaultWeight: true
                    }
                  }
                },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          }
        }
      }
    }
  });

  if (!application) {
    return null;
  }

  const screeningPackage = resolveApplicationScreeningPackageFromPreset(
    application.jobPosting.screenerPreset
  );
  if (!screeningPackage || screeningPackage.addons.length === 0 || !application.screeningAttemptId) {
    return null;
  }

  const totalDurationMinutes = screeningPackage.addons.reduce(
    (total, addon) => total + addon.durationMinutes,
    0
  );

  return {
    applicationId: application.id,
    attemptId: application.screeningAttemptId,
    candidateName: application.candidate.fullName,
    jobTitle: application.jobPosting.title,
    roleLabel: application.jobPosting.role?.label ?? undefined,
    roleDepartment: application.jobPosting.role?.department ?? undefined,
    screeningPackage,
    totalDurationMinutes,
    runtimeSlug: applicationScreeningRuntimeSlug(application.id)
  };
}

export function publicApplicationScreeningFinishHref(input: {
  jobSlug: string;
  applicationId: string;
  resumeError?: boolean;
}) {
  return buildApplicationScreeningFinishHref(input);
}

export function publicApplicationScreeningSlug(applicationId: string) {
  return applicationScreeningRuntimeSlug(applicationId);
}

export async function updateCandidateApplicationLifecycle(input: {
  applicationId: string;
  action: "review" | "promote" | "close";
  hrOwner?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const application = await tx.candidateApplication.findUnique({
      where: { id: input.applicationId },
      select: {
        id: true,
        candidateId: true
      }
    });

    if (!application) {
      throw new Error("Application not found.");
    }

    if (input.action === "review") {
      await tx.candidateApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "under_review"
        }
      });

      if (input.hrOwner?.trim()) {
        await tx.candidate.update({
          where: { id: application.candidateId },
          data: {
            hrOwner: input.hrOwner.trim()
          }
        });
      }
    }

    if (input.action === "close") {
      await tx.candidateApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "closed"
        }
      });
    }

    if (input.action === "promote") {
      await tx.candidateApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "moved_to_pipeline"
        }
      });

      await tx.candidate.update({
        where: { id: application.candidateId },
        data: {
          hrOwner: input.hrOwner?.trim() || undefined,
          stage: "pipeline"
        }
      });
    }

    return application;
  });
}

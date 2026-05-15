import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createCandidate, findExistingCandidateByEmail } from "@/lib/db/candidates";
import { candidateUiStatusToStoredFields } from "@/lib/candidates/ui-status";
import type { CandidateIntakeBucket } from "@/lib/candidates/types";
import {
  candidateApplicationStatusValues,
  isActiveApplicationStatus,
  type CandidateApplicationListItem,
  type CandidateApplicationStatus,
  type JobPostingDetail,
  type JobPostingListItem
} from "@/lib/jobs/types";
import { mapCandidate } from "@/lib/db/candidates";

type JobPostingRow = {
  id: string;
  slug: string;
  title: string;
  roleId: string | null;
  screenerPresetId: string | null;
  summary: string;
  description: string;
  isPublished: boolean;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: { label: string; department: string | null } | null;
  screenerPreset: { id: string; label: string } | null;
  applications: Array<{ status: string }>;
};

function slugifyJobTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function activeApplicantCount(rows: Array<{ status: string }>) {
  return rows.filter((row) => candidateApplicationStatusValues.includes(row.status as CandidateApplicationStatus) && isActiveApplicationStatus(row.status as CandidateApplicationStatus)).length;
}

function mapJobPosting(row: JobPostingRow): JobPostingListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    roleId: row.roleId ?? undefined,
    roleLabel: row.role?.label ?? undefined,
    roleDepartment: row.role?.department ?? undefined,
    screenerPresetId: row.screenerPresetId ?? undefined,
    screenerPresetLabel: row.screenerPreset?.label ?? undefined,
    summary: row.summary,
    description: row.description,
    isPublished: row.isPublished,
    isOpen: row.isOpen,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    applicantCount: activeApplicantCount(row.applications)
  };
}

function mapApplication(row: {
  id: string;
  candidateId: string;
  status: string;
  coverNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    hrOwner: string | null;
    intakeBucket: string;
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
    candidateIntakeBucket: row.candidate.intakeBucket as CandidateIntakeBucket,
    hasResume: row.candidate._count.resumes > 0,
    jobPostingId: row.jobPosting.id,
    jobSlug: row.jobPosting.slug,
    jobTitle: row.jobPosting.title,
    roleLabel: row.jobPosting.role?.label ?? undefined,
    coverNote: row.coverNote ?? undefined,
    appliedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: row.status as CandidateApplicationStatus
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
          department: true
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
          department: true
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

export async function listJobPostings() {
  const rows = await prisma.jobPosting.findMany({
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    include: {
      role: {
        select: {
          label: true,
          department: true
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

  return rows.map(mapJobPosting);
}

export async function getJobPosting(jobId: string) {
  const row = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      role: {
        select: {
          label: true,
          department: true
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
              intakeBucket: true,
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
                  department: true
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
      isPublished: Boolean(input.isPublished),
      isOpen: input.isOpen ?? true
    },
    include: {
      role: {
        select: {
          label: true,
          department: true
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

export async function updateJobPosting(
  jobId: string,
  input: {
    title: string;
    roleId?: string;
    screenerPresetId?: string;
    summary: string;
    description: string;
    isPublished?: boolean;
    isOpen?: boolean;
  }
) {
  const title = input.title.trim();
  const slug = await uniqueJobSlug(title, jobId);
  const row = await prisma.jobPosting.update({
    where: { id: jobId },
    data: {
      slug,
      title,
      roleId: input.roleId?.trim() || null,
      screenerPresetId: input.screenerPresetId === "" ? null : (input.screenerPresetId?.trim() || undefined),
      summary: input.summary.trim(),
      description: input.description.trim(),
      isPublished: Boolean(input.isPublished),
      isOpen: Boolean(input.isOpen)
    },
    include: {
      role: {
        select: {
          label: true,
          department: true
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
  page?: number;
  pageSize?: number;
} = {}) {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));
  const query = filters.q?.trim().toLowerCase() ?? "";

  const rows = await prisma.candidateApplication.findMany({
    where: {
      candidate: {
        intakeBucket: "applicant"
      },
      ...(filters.jobId ? { jobPostingId: filters.jobId } : {}),
      ...(filters.status
        ? { status: filters.status }
        : {
            status: {
              in: ["submitted", "under_review"]
            }
          })
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      candidate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          hrOwner: true,
          intakeBucket: true,
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
              department: true
            }
          }
        }
      }
    }
  });

  const mapped = rows.map(mapApplication).filter((row) => {
    if (!query) return true;

    const haystack = [row.candidateName, row.candidateEmail, row.jobTitle, row.roleLabel || "", row.candidateOwner || ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const start = (page - 1) * pageSize;
  const paged = mapped.slice(start, start + pageSize);
  const jobOptionRows = await prisma.jobPosting.findMany({
    select: { id: true, title: true }
  });

  return {
    rows: paged,
    total: mapped.length,
    page,
    pageSize,
    jobOptions: jobOptionRows.map((job) => ({
      id: job.id,
      label: job.title
    })),
    summary: {
      total: mapped.length,
      resumeMissing: mapped.filter((row) => !row.hasResume).length,
      submitted: mapped.filter((row) => row.status === "submitted").length,
      underReview: mapped.filter((row) => row.status === "under_review").length
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
              department: true
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
    applicationNote: row.coverNote?.trim() || ""
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

export async function createCandidateApplicationFromPublicSubmission(input: {
  jobSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  coverNote?: string;
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

  const normalizedEmail = input.email.trim().toLowerCase();
  let existingCandidate = await findExistingCandidateByEmail(normalizedEmail);

  if (!existingCandidate) {
    try {
      const created = await createCandidate({
        fullName: input.fullName,
        email: normalizedEmail,
        phone: input.phone,
        roleId: job.roleId ?? undefined,
        positionAppliedFor: job.title,
        resumeSource: "Company Website",
        intakeBucket: "applicant",
        ...candidateUiStatusToStoredFields("in_progress")
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
    await prisma.candidate.update({
      where: { id: existingCandidate.id },
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || undefined,
        roleId: job.roleId ?? undefined,
        positionAppliedFor: job.title
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
      id: true
    }
  });

  if (existingApplication) {
    return {
      status: "duplicate" as const,
      candidateId: existingCandidate.id,
      applicationId: existingApplication.id,
      jobId: job.id
    };
  }

  const application = await prisma.candidateApplication.create({
    data: {
      candidateId: existingCandidate.id,
      jobPostingId: job.id,
      status: "submitted",
      coverNote: input.coverNote?.trim() || null
    }
  });

  return {
    status: "created" as const,
    candidateId: existingCandidate.id,
    applicationId: application.id,
    jobId: job.id,
    jobTitle: job.title,
    screenerPreset: job.screenerPreset
  };
}

export async function updateCandidateApplicationLifecycle(input: {
  applicationId: string;
  action: "review" | "promote" | "close";
  hrOwner?: string;
}) {
  const fields = candidateUiStatusToStoredFields("in_progress");

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
          intakeBucket: "pipeline",
          stage: fields.stage,
          finalDecision: fields.finalDecision,
          nextAction: fields.nextAction,
          screeningStatus: fields.screeningStatus ?? null
        }
      });
    }

    return application;
  });
}

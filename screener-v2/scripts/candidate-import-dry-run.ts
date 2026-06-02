/**
 * Candidate import dry run.
 *
 * Guardrails:
 * - dry-run only; apply mode is intentionally disabled in this batch
 * - reads from source and target databases only
 * - never writes to the source database
 * - never emits file reports or raw PII
 * - never loads or copies resume blobs
 *
 * Required env:
 * - IMPORT_SOURCE_DATABASE_URL
 * - IMPORT_TARGET_DATABASE_URL
 *
 * Optional env:
 * - CANDIDATE_IMPORT_LIMIT=10           (hard max 25)
 * - CANDIDATE_IMPORT_SOURCE_IDS=id1,id2
 * - CANDIDATE_IMPORT_SOURCE_EMAILS=a@x,b@y
 */

import { Prisma, PrismaClient } from "@prisma/client";
import {
  buildCandidateImportPlans,
  describeCandidateSelection,
  formatCandidateImportDryRunReport,
  summarizeCandidateImportPlans,
  type ExistingTargetCandidateSnapshot,
  type SourceCandidateSnapshot,
  type TargetDepartmentSnapshot,
  type TargetJobSnapshot
} from "./candidate-import-dry-run.logic";

const MAX_SELECTION = 25;
const TARGET_DEPARTMENT_SLUGS = ["rpa-ind", "rpa-sl"] as const;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function parseListEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseLimit() {
  const raw = process.env.CANDIDATE_IMPORT_LIMIT?.trim() || "10";
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_SELECTION) {
    throw new Error(`CANDIDATE_IMPORT_LIMIT must be an integer between 1 and ${MAX_SELECTION}.`);
  }
  return parsed;
}

function normalizedDatabaseIdentity(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port}${parsed.pathname}`;
  } catch {
    return url.trim();
  }
}

function assertDryRunOnly() {
  if (process.argv.includes("--apply")) {
    throw new Error("Apply mode is disabled in this batch. Dry-run only.");
  }

  const mode = process.env.CANDIDATE_IMPORT_MODE?.trim().toLowerCase();
  if (mode && mode !== "dry-run") {
    throw new Error("CANDIDATE_IMPORT_MODE must be dry-run for this batch.");
  }
}

function buildRpaSourceWhere(ids: string[], emails: string[]): Prisma.CandidateWhereInput {
  if (ids.length > 0) {
    if (ids.length > MAX_SELECTION) {
      throw new Error(`CANDIDATE_IMPORT_SOURCE_IDS exceeds ${MAX_SELECTION} items.`);
    }
    return {
      id: { in: ids }
    };
  }

  if (emails.length > 0) {
    if (emails.length > MAX_SELECTION) {
      throw new Error(`CANDIDATE_IMPORT_SOURCE_EMAILS exceeds ${MAX_SELECTION} items.`);
    }
    return {
      email: {
        in: emails.map((email) => email.toLowerCase())
      }
    };
  }

  return {
    OR: [
      { department: { slug: { contains: "rpa", mode: "insensitive" } } },
      { department: { name: { contains: "rpa", mode: "insensitive" } } },
      { role: { label: { contains: "rpa", mode: "insensitive" } } },
      { role: { label: { contains: "uipath", mode: "insensitive" } } },
      { positionAppliedFor: { contains: "rpa", mode: "insensitive" } },
      { positionAppliedFor: { contains: "uipath", mode: "insensitive" } },
      {
        applications: {
          some: {
            OR: [
              { jobPosting: { title: { contains: "rpa", mode: "insensitive" } } },
              { jobPosting: { title: { contains: "uipath", mode: "insensitive" } } },
              { jobPosting: { role: { label: { contains: "rpa", mode: "insensitive" } } } },
              { jobPosting: { role: { label: { contains: "uipath", mode: "insensitive" } } } }
            ]
          }
        }
      }
    ]
  };
}

function sourceTake(limit: number, ids: string[], emails: string[]) {
  return ids.length > 0 ? ids.length : emails.length > 0 ? emails.length : limit;
}

async function loadSourceCandidates(
  sourcePrisma: PrismaClient,
  limit: number,
  ids: string[],
  emails: string[]
): Promise<SourceCandidateSnapshot[]> {
  const rows = await sourcePrisma.candidate.findMany({
    where: buildRpaSourceWhere(ids, emails),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: sourceTake(limit, ids, emails),
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      stage: true,
      nextAction: true,
      screeningStatus: true,
      orgStatus: true,
      orgStage: true,
      finalizedAs: true,
      positionAppliedFor: true,
      hrOwner: true,
      resumeSource: true,
      updatedAt: true,
      department: {
        select: {
          name: true,
          slug: true
        }
      },
      role: {
        select: {
          label: true
        }
      },
      applications: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          jobPosting: {
            select: {
              title: true,
              department: {
                select: {
                  name: true,
                  slug: true
                }
              },
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

  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    stage: row.stage,
    nextAction: row.nextAction,
    screeningStatus: row.screeningStatus,
    orgStatus: row.orgStatus,
    orgStage: row.orgStage,
    finalizedAs: row.finalizedAs,
    positionAppliedFor: row.positionAppliedFor,
    roleLabel: row.role?.label,
    departmentName: row.department?.name,
    departmentSlug: row.department?.slug,
    hrOwner: row.hrOwner,
    resumeSource: row.resumeSource,
    updatedAt: row.updatedAt.toISOString(),
    latestApplication: row.applications[0]
      ? {
          id: row.applications[0].id,
          status: row.applications[0].status,
          jobTitle: row.applications[0].jobPosting.title,
          roleLabel: row.applications[0].jobPosting.role?.label,
          departmentName: row.applications[0].jobPosting.department?.name,
          departmentSlug: row.applications[0].jobPosting.department?.slug,
          updatedAt: row.applications[0].updatedAt.toISOString()
        }
      : null
  }));
}

async function loadTargetDepartments(targetPrisma: PrismaClient): Promise<TargetDepartmentSnapshot[]> {
  return targetPrisma.department.findMany({
    where: {
      slug: {
        in: [...TARGET_DEPARTMENT_SLUGS]
      }
    },
    select: {
      id: true,
      slug: true,
      name: true
    },
    orderBy: [{ name: "asc" }]
  });
}

async function loadTargetJobs(
  targetPrisma: PrismaClient,
  departmentIds: string[]
): Promise<TargetJobSnapshot[]> {
  if (departmentIds.length === 0) {
    return [];
  }

  const rows = await targetPrisma.jobPosting.findMany({
    where: {
      OR: [
        { departmentId: { in: departmentIds } },
        { role: { departmentId: { in: departmentIds } } }
      ]
    },
    orderBy: [{ title: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      departmentId: true,
      roleId: true,
      role: {
        select: {
          label: true,
          departmentId: true
        }
      }
    }
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    departmentId: row.departmentId,
    roleId: row.roleId,
    roleLabel: row.role?.label,
    roleDepartmentId: row.role?.departmentId
  }));
}

async function loadExistingTargetCandidates(
  targetPrisma: PrismaClient,
  emails: string[]
): Promise<ExistingTargetCandidateSnapshot[]> {
  if (emails.length === 0) {
    return [];
  }

  const rows = await targetPrisma.candidate.findMany({
    where: {
      email: {
        in: emails.map((email) => email.toLowerCase())
      }
    },
    select: {
      id: true,
      email: true,
      applications: {
        select: {
          jobPostingId: true,
          jobPosting: {
            select: {
              departmentId: true,
              role: {
                select: {
                  departmentId: true
                }
              }
            }
          }
        }
      }
    }
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    applications: row.applications.map((application) => ({
      jobPostingId: application.jobPostingId,
      departmentId: application.jobPosting.role?.departmentId ?? application.jobPosting.departmentId
    }))
  }));
}

async function main() {
  assertDryRunOnly();

  const sourceUrl = requireEnv("IMPORT_SOURCE_DATABASE_URL");
  const targetUrl = requireEnv("IMPORT_TARGET_DATABASE_URL");
  if (normalizedDatabaseIdentity(sourceUrl) === normalizedDatabaseIdentity(targetUrl)) {
    throw new Error("Source and target database URLs resolve to the same identity. Refusing to run.");
  }

  const limit = parseLimit();
  const ids = parseListEnv("CANDIDATE_IMPORT_SOURCE_IDS");
  const emails = parseListEnv("CANDIDATE_IMPORT_SOURCE_EMAILS");

  const sourcePrisma = new PrismaClient({
    datasources: {
      db: { url: sourceUrl }
    },
    log: ["error"]
  });
  const targetPrisma = new PrismaClient({
    datasources: {
      db: { url: targetUrl }
    },
    log: ["error"]
  });

  try {
    const sourceCandidates = await loadSourceCandidates(sourcePrisma, limit, ids, emails);
    if (sourceCandidates.length === 0) {
      throw new Error("No source candidates matched the dry-run selection.");
    }

    const selectionLabel = describeCandidateSelection({ limit, ids, emails });
    const targetDepartments = await loadTargetDepartments(targetPrisma);
    const targetJobs = await loadTargetJobs(
      targetPrisma,
      targetDepartments.map((department) => department.id)
    );
    const existingTargetCandidates = await loadExistingTargetCandidates(
      targetPrisma,
      sourceCandidates.map((candidate) => candidate.email)
    );

    const plans = buildCandidateImportPlans(
      sourceCandidates.map((source) => ({
        source,
        targetDepartments,
        targetJobs,
        existingTargetCandidates
      }))
    );
    const summary = summarizeCandidateImportPlans(plans);

    console.log(`Selection: ${selectionLabel}`);
    console.log(formatCandidateImportDryRunReport(plans));

    if (summary.blocked > 0) {
      process.exitCode = 1;
    }
  } finally {
    await Promise.all([sourcePrisma.$disconnect(), targetPrisma.$disconnect()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Candidate import dry run failed.");
  process.exit(1);
});

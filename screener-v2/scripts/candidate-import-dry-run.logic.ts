import { createHash } from "node:crypto";
import {
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues,
  type CandidateNextAction,
  type CandidateScreeningStatus,
  type CandidateStage
} from "@/lib/candidates/types";
import {
  candidateApplicationStatusValues,
  type CandidateApplicationStatus
} from "@/lib/jobs/types";

export type CandidateImportVariant = "IND" | "SL";
export type CandidateImportDecision =
  | "create_candidate_and_application"
  | "repair_candidate_and_create_application"
  | "skip_existing_application"
  | "skip_non_rpa"
  | "skip_unknown_variant"
  | "skip_missing_target_department";
export type TargetJobResolution =
  | "matched_existing_job"
  | "use_existing_pool_job"
  | "create_pool_job";
export type CandidateOrgStatus = "active" | "talent_pool" | "org_rejected";
export type CandidateOrgStage = "active" | "finalized";
export type DepartmentCandidacyStatus = "active" | "talent_pool" | "dept_rejected";

export interface SourceApplicationSnapshot {
  id: string;
  status?: string | null;
  jobTitle?: string | null;
  roleLabel?: string | null;
  departmentName?: string | null;
  departmentSlug?: string | null;
  updatedAt: string;
}

export interface SourceCandidateSnapshot {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  stage?: string | null;
  nextAction?: string | null;
  screeningStatus?: string | null;
  orgStatus?: string | null;
  orgStage?: string | null;
  finalizedAs?: string | null;
  positionAppliedFor?: string | null;
  roleLabel?: string | null;
  departmentName?: string | null;
  departmentSlug?: string | null;
  hrOwner?: string | null;
  resumeSource?: string | null;
  updatedAt: string;
  latestApplication?: SourceApplicationSnapshot | null;
}

export interface TargetDepartmentSnapshot {
  id: string;
  slug: string;
  name: string;
}

export interface TargetJobSnapshot {
  id: string;
  slug: string;
  title: string;
  departmentId?: string | null;
  roleId?: string | null;
  roleLabel?: string | null;
  roleDepartmentId?: string | null;
}

export interface ExistingTargetApplicationSnapshot {
  jobPostingId: string;
  departmentId?: string | null;
}

export interface ExistingTargetCandidateSnapshot {
  id: string;
  email: string;
  applications: ExistingTargetApplicationSnapshot[];
}

export interface CandidateJourneySnapshot {
  stage: CandidateStage;
  nextAction: CandidateNextAction;
  screeningStatus?: CandidateScreeningStatus;
  orgStatus: CandidateOrgStatus;
  orgStage: CandidateOrgStage;
  finalizedAs?: "hired" | "rejected";
  applicationStatus: CandidateApplicationStatus;
  candidacyStatus: DepartmentCandidacyStatus;
}

export interface CandidateImportWritePlan {
  departmentId: string;
  departmentSlug: string;
  departmentName: string;
  roleId?: string;
  roleLabel?: string;
  positionAppliedFor?: string;
  jobPostingId?: string;
  jobSlug?: string;
  jobTitle: string;
  jobResolution: TargetJobResolution;
  poolJobTitle?: string;
  candidate: {
    fullName: string;
    email: string;
    phone?: string;
    hrOwner?: string;
    resumeSource?: string;
    stage: CandidateStage;
    nextAction: CandidateNextAction;
    screeningStatus?: CandidateScreeningStatus;
    orgStatus: CandidateOrgStatus;
    orgStage: CandidateOrgStage;
    finalizedAs?: "hired" | "rejected";
  };
  application: {
    status: CandidateApplicationStatus;
  };
  candidacy: {
    status: DepartmentCandidacyStatus;
  };
}

export interface CandidateImportPlan {
  sourceCandidateId: string;
  sourceCandidateFingerprint: string;
  sourceUpdatedAt: string;
  decision: CandidateImportDecision;
  reasons: string[];
  variant?: CandidateImportVariant;
  journey?: CandidateJourneySnapshot;
  writePlan?: CandidateImportWritePlan;
  existingTargetCandidateId?: string;
}

export interface CandidateImportPlanInput {
  source: SourceCandidateSnapshot;
  targetDepartments: TargetDepartmentSnapshot[];
  targetJobs: TargetJobSnapshot[];
  existingTargetCandidates: ExistingTargetCandidateSnapshot[];
}

export interface CandidateImportPlanSummary {
  total: number;
  actionable: number;
  blocked: number;
  decisions: Record<CandidateImportDecision, number>;
  variants: Partial<Record<CandidateImportVariant, number>>;
  applicationStatuses: Partial<Record<CandidateApplicationStatus, number>>;
  jobResolutions: Partial<Record<TargetJobResolution, number>>;
  poolJobsToCreate: Array<{ title: string; departmentSlug: string }>;
}

const candidateStageSet = new Set<string>(candidateStageValues);
const candidateNextActionSet = new Set<string>(candidateNextActionValues);
const candidateScreeningStatusSet = new Set<string>(candidateScreeningStatusValues);
const candidateApplicationStatusSet = new Set<string>(candidateApplicationStatusValues);
const decisionOrder: CandidateImportDecision[] = [
  "create_candidate_and_application",
  "repair_candidate_and_create_application",
  "skip_existing_application",
  "skip_non_rpa",
  "skip_unknown_variant",
  "skip_missing_target_department"
];
const variantHints = {
  IND: [/\brpa[\s-]*ind\b/i, /\bindia\b/i, /\bind\b/i],
  SL: [/\brpa[\s-]*sl\b/i, /\bsri[\s-]*lanka\b/i, /\bsl\b/i]
} as const;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function uniqueDefined<T>(values: Array<T | null | undefined>) {
  return [...new Set(values.filter((value): value is T => value != null && value !== ""))];
}

function normalizeComparableLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[()/_]+/g, " ")
    .replace(/\b(india|ind|sri lanka|sl)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceTexts(source: SourceCandidateSnapshot) {
  return uniqueDefined([
    source.departmentSlug,
    source.departmentName,
    source.roleLabel,
    source.positionAppliedFor,
    source.latestApplication?.departmentSlug,
    source.latestApplication?.departmentName,
    source.latestApplication?.roleLabel,
    source.latestApplication?.jobTitle
  ]);
}

function sourceJobLabels(source: SourceCandidateSnapshot) {
  return uniqueDefined([
    source.latestApplication?.jobTitle,
    source.latestApplication?.roleLabel,
    source.positionAppliedFor,
    source.roleLabel
  ]);
}

export function fingerprintCandidate(source: Pick<SourceCandidateSnapshot, "email" | "id">) {
  return createHash("sha256")
    .update(`${normalizeEmail(source.email)}|${source.id}`)
    .digest("hex")
    .slice(0, 12);
}

export function isRpaSourceCandidate(source: SourceCandidateSnapshot) {
  return sourceTexts(source).some((value) => /\brpa\b/i.test(value) || /\buipath\b/i.test(value));
}

export function inferRpaVariant(source: SourceCandidateSnapshot): CandidateImportVariant | null {
  const matches = new Set<CandidateImportVariant>();

  for (const text of sourceTexts(source)) {
    if (variantHints.IND.some((pattern) => pattern.test(text))) {
      matches.add("IND");
    }
    if (variantHints.SL.some((pattern) => pattern.test(text))) {
      matches.add("SL");
    }
  }

  if (matches.size !== 1) {
    return null;
  }

  return [...matches][0] ?? null;
}

function toValidStage(value?: string | null): CandidateStage | undefined {
  return value && candidateStageSet.has(value) ? (value as CandidateStage) : undefined;
}

function toValidNextAction(value?: string | null): CandidateNextAction | undefined {
  return value && candidateNextActionSet.has(value) ? (value as CandidateNextAction) : undefined;
}

function toValidScreeningStatus(value?: string | null): CandidateScreeningStatus | undefined {
  return value && candidateScreeningStatusSet.has(value) ? (value as CandidateScreeningStatus) : undefined;
}

function toValidApplicationStatus(value?: string | null): CandidateApplicationStatus | undefined {
  return value && candidateApplicationStatusSet.has(value)
    ? (value as CandidateApplicationStatus)
    : undefined;
}

function normalizeCandidateJourney(source: SourceCandidateSnapshot): CandidateJourneySnapshot {
  const explicitFinalizedAs =
    source.finalizedAs === "hired" || source.finalizedAs === "rejected"
      ? source.finalizedAs
      : undefined;

  let orgStatus: CandidateOrgStatus =
    source.orgStatus === "talent_pool" || source.orgStatus === "org_rejected"
      ? source.orgStatus
      : "active";

  let orgStage: CandidateOrgStage = source.orgStage === "finalized" ? "finalized" : "active";
  let finalizedAs: "hired" | "rejected" | undefined = explicitFinalizedAs;

  if (finalizedAs === "rejected") {
    orgStatus = "org_rejected";
    orgStage = "finalized";
  } else if (finalizedAs === "hired") {
    orgStatus = "active";
    orgStage = "finalized";
  } else if (orgStatus === "org_rejected") {
    finalizedAs = "rejected";
    orgStage = "finalized";
  }

  let stage = toValidStage(source.stage);
  if (!stage) {
    stage = orgStage === "finalized" ? "finalized" : "pipeline";
  }
  if (orgStage === "finalized") {
    stage = "finalized";
  }

  const nextAction =
    stage === "finalized" ? "none" : (toValidNextAction(source.nextAction) ?? "none");
  const screeningStatus = toValidScreeningStatus(source.screeningStatus);
  const sourceApplicationStatus = toValidApplicationStatus(source.latestApplication?.status);
  const derivedApplicationStatus =
    sourceApplicationStatus ??
    (orgStage === "finalized"
      ? "closed"
      : stage === "applicant"
      ? "submitted"
      : stage === "pipeline" || orgStatus === "talent_pool"
      ? "moved_to_pipeline"
      : "under_review");
  const candidacyStatus: DepartmentCandidacyStatus =
    orgStatus === "org_rejected"
      ? "dept_rejected"
      : orgStatus === "talent_pool"
      ? "talent_pool"
      : "active";

  return {
    stage,
    nextAction,
    screeningStatus,
    orgStatus,
    orgStage,
    finalizedAs,
    applicationStatus: derivedApplicationStatus,
    candidacyStatus
  };
}

function targetDepartmentSlugForVariant(variant: CandidateImportVariant) {
  return variant === "IND" ? "rpa-ind" : "rpa-sl";
}

function poolJobTitleForVariant(variant: CandidateImportVariant) {
  return `RPA General Pool - ${variant}`;
}

function selectTargetJob(
  source: SourceCandidateSnapshot,
  targetDepartment: TargetDepartmentSnapshot,
  targetJobs: TargetJobSnapshot[],
  variant: CandidateImportVariant
) {
  const jobsInDepartment = targetJobs.filter((job) => {
    const departmentId = job.roleDepartmentId ?? job.departmentId ?? undefined;
    return departmentId === targetDepartment.id;
  });

  const labels = sourceJobLabels(source)
    .map((value) => ({
      raw: value,
      normalized: normalizeComparableLabel(value)
    }))
    .filter((value) => value.normalized);

  for (const label of labels) {
    const exactJob = jobsInDepartment.find(
      (job) => normalizeComparableLabel(job.title) === label.normalized
    );
    if (exactJob) {
      return {
        jobResolution: "matched_existing_job" as const,
        job: exactJob
      };
    }

    const exactRoleMatch = jobsInDepartment.find(
      (job) => job.roleLabel && normalizeComparableLabel(job.roleLabel) === label.normalized
    );
    if (exactRoleMatch) {
      return {
        jobResolution: "matched_existing_job" as const,
        job: exactRoleMatch
      };
    }
  }

  const poolTitle = poolJobTitleForVariant(variant);
  const existingPoolJob = jobsInDepartment.find(
    (job) => normalizeComparableLabel(job.title) === normalizeComparableLabel(poolTitle)
  );
  if (existingPoolJob) {
    return {
      jobResolution: "use_existing_pool_job" as const,
      job: existingPoolJob,
      poolJobTitle: poolTitle
    };
  }

  return {
    jobResolution: "create_pool_job" as const,
    job: null,
    poolJobTitle: poolTitle
  };
}

function targetCandidateByEmail(
  existingCandidates: ExistingTargetCandidateSnapshot[],
  email: string
) {
  const normalized = normalizeEmail(email);
  return existingCandidates.find((candidate) => normalizeEmail(candidate.email) === normalized);
}

function hasApplicationInTargetDepartment(
  candidate: ExistingTargetCandidateSnapshot,
  departmentId: string
) {
  return candidate.applications.some((application) => application.departmentId === departmentId);
}

export function buildCandidateImportPlan(
  input: CandidateImportPlanInput
): CandidateImportPlan {
  const sourceFingerprint = fingerprintCandidate(input.source);
  const base = {
    sourceCandidateId: input.source.id,
    sourceCandidateFingerprint: sourceFingerprint,
    sourceUpdatedAt: input.source.updatedAt
  } satisfies Pick<
    CandidateImportPlan,
    "sourceCandidateId" | "sourceCandidateFingerprint" | "sourceUpdatedAt"
  >;

  if (!isRpaSourceCandidate(input.source)) {
    return {
      ...base,
      decision: "skip_non_rpa",
      reasons: ["Source candidate is not RPA-related."]
    };
  }

  const variant = inferRpaVariant(input.source);
  if (!variant) {
    return {
      ...base,
      decision: "skip_unknown_variant",
      reasons: ["Could not infer whether the source candidate belongs to RPA IND or RPA SL."]
    };
  }

  const targetDepartment = input.targetDepartments.find(
    (department) => department.slug === targetDepartmentSlugForVariant(variant)
  );
  if (!targetDepartment) {
    return {
      ...base,
      decision: "skip_missing_target_department",
      variant,
      reasons: [`Target department ${targetDepartmentSlugForVariant(variant)} does not exist.`]
    };
  }

  const journey = normalizeCandidateJourney(input.source);
  const selectedJob = selectTargetJob(input.source, targetDepartment, input.targetJobs, variant);
  const existingTargetCandidate = targetCandidateByEmail(
    input.existingTargetCandidates,
    input.source.email
  );

  if (
    existingTargetCandidate &&
    hasApplicationInTargetDepartment(existingTargetCandidate, targetDepartment.id)
  ) {
    return {
      ...base,
      decision: "skip_existing_application",
      variant,
      journey,
      existingTargetCandidateId: existingTargetCandidate.id,
      reasons: ["Target candidate already has a CandidateApplication in the mapped RPA department."]
    };
  }

  const jobTitle = selectedJob.job?.title ?? selectedJob.poolJobTitle ?? poolJobTitleForVariant(variant);
  const positionAppliedFor = uniqueDefined([
    input.source.latestApplication?.jobTitle,
    input.source.positionAppliedFor,
    input.source.roleLabel
  ])[0];

  return {
    ...base,
    decision: existingTargetCandidate
      ? "repair_candidate_and_create_application"
      : "create_candidate_and_application",
    variant,
    journey,
    existingTargetCandidateId: existingTargetCandidate?.id,
    reasons:
      selectedJob.jobResolution === "create_pool_job"
        ? ["No exact staging job matched; the dry run would use a department-scoped pool job."]
        : ["Source candidate maps cleanly to a staging job and CandidateApplication."],
    writePlan: {
      departmentId: targetDepartment.id,
      departmentSlug: targetDepartment.slug,
      departmentName: targetDepartment.name,
      roleId: selectedJob.job?.roleId ?? undefined,
      roleLabel: selectedJob.job?.roleLabel ?? positionAppliedFor ?? undefined,
      positionAppliedFor:
        selectedJob.job?.roleId == null ? positionAppliedFor ?? undefined : undefined,
      jobPostingId: selectedJob.job?.id ?? undefined,
      jobSlug: selectedJob.job?.slug ?? undefined,
      jobTitle,
      jobResolution: selectedJob.jobResolution,
      poolJobTitle: selectedJob.poolJobTitle,
      candidate: {
        fullName: input.source.fullName.trim(),
        email: normalizeEmail(input.source.email),
        phone: input.source.phone?.trim() || undefined,
        hrOwner: input.source.hrOwner?.trim() || undefined,
        resumeSource: input.source.resumeSource?.trim() || undefined,
        stage: journey.stage,
        nextAction: journey.nextAction,
        screeningStatus: journey.screeningStatus,
        orgStatus: journey.orgStatus,
        orgStage: journey.orgStage,
        finalizedAs: journey.finalizedAs
      },
      application: {
        status: journey.applicationStatus
      },
      candidacy: {
        status: journey.candidacyStatus
      }
    }
  };
}

export function buildCandidateImportPlans(inputs: CandidateImportPlanInput[]) {
  return inputs.map((input) => buildCandidateImportPlan(input));
}

export function summarizeCandidateImportPlans(
  plans: CandidateImportPlan[]
): CandidateImportPlanSummary {
  const summary: CandidateImportPlanSummary = {
    total: plans.length,
    actionable: 0,
    blocked: 0,
    decisions: {
      create_candidate_and_application: 0,
      repair_candidate_and_create_application: 0,
      skip_existing_application: 0,
      skip_non_rpa: 0,
      skip_unknown_variant: 0,
      skip_missing_target_department: 0
    },
    variants: {},
    applicationStatuses: {},
    jobResolutions: {},
    poolJobsToCreate: []
  };

  const poolJobs = new Set<string>();

  for (const plan of plans) {
    summary.decisions[plan.decision] += 1;
    if (
      plan.decision === "create_candidate_and_application" ||
      plan.decision === "repair_candidate_and_create_application"
    ) {
      summary.actionable += 1;
    } else if (
      plan.decision === "skip_unknown_variant" ||
      plan.decision === "skip_missing_target_department"
    ) {
      summary.blocked += 1;
    }

    if (plan.variant) {
      summary.variants[plan.variant] = (summary.variants[plan.variant] ?? 0) + 1;
    }
    if (plan.journey) {
      summary.applicationStatuses[plan.journey.applicationStatus] =
        (summary.applicationStatuses[plan.journey.applicationStatus] ?? 0) + 1;
    }
    if (plan.writePlan) {
      summary.jobResolutions[plan.writePlan.jobResolution] =
        (summary.jobResolutions[plan.writePlan.jobResolution] ?? 0) + 1;
      if (plan.writePlan.jobResolution === "create_pool_job" && plan.writePlan.poolJobTitle) {
        const key = `${plan.writePlan.departmentSlug}|${plan.writePlan.poolJobTitle}`;
        if (!poolJobs.has(key)) {
          poolJobs.add(key);
          summary.poolJobsToCreate.push({
            title: plan.writePlan.poolJobTitle,
            departmentSlug: plan.writePlan.departmentSlug
          });
        }
      }
    }
  }

  return summary;
}

function formatCountMap<T extends string>(label: string, values: Partial<Record<T, number>>) {
  const parts = Object.entries(values)
    .filter((entry): entry is [T, number] => typeof entry[1] === "number" && entry[1] > 0)
    .map(([key, count]) => `${key}=${count}`);

  if (parts.length === 0) {
    return `${label}: none`;
  }

  return `${label}: ${parts.join(", ")}`;
}

export function formatCandidateImportDryRunReport(plans: CandidateImportPlan[]) {
  const summary = summarizeCandidateImportPlans(plans);
  const samplePlans = plans
    .filter(
      (plan) =>
        plan.decision === "create_candidate_and_application" ||
        plan.decision === "repair_candidate_and_create_application" ||
        plan.decision === "skip_unknown_variant" ||
        plan.decision === "skip_missing_target_department"
    )
    .slice(0, 10);

  const lines = [
    "Candidate import dry-run summary",
    `Selected candidates: ${summary.total}`,
    `Actionable plans: ${summary.actionable}`,
    `Blocked plans: ${summary.blocked}`,
    formatCountMap("Decisions", summary.decisions),
    formatCountMap("Variants", summary.variants),
    formatCountMap("Application statuses", summary.applicationStatuses),
    formatCountMap("Job resolution", summary.jobResolutions),
    summary.poolJobsToCreate.length === 0
      ? "Pool jobs to create: none"
      : `Pool jobs to create: ${summary.poolJobsToCreate
          .map((job) => `${job.title} [${job.departmentSlug}]`)
          .join(", ")}`
  ];

  if (samplePlans.length > 0) {
    lines.push("Sample plans:");
    for (const plan of samplePlans) {
      const details = [
        `hash=${plan.sourceCandidateFingerprint}`,
        `decision=${plan.decision}`,
        plan.variant ? `variant=${plan.variant}` : undefined,
        plan.writePlan ? `job=${plan.writePlan.jobTitle}` : undefined,
        plan.journey ? `stage=${plan.journey.stage}` : undefined,
        plan.journey ? `application=${plan.journey.applicationStatus}` : undefined
      ]
        .filter(Boolean)
        .join(" ");

      lines.push(`- ${details}`);
    }
  }

  return lines.join("\n");
}

export function describeCandidateSelection(input: {
  limit: number;
  ids: string[];
  emails: string[];
}) {
  if (input.ids.length > 0) {
    return `explicit ids (${input.ids.length})`;
  }
  if (input.emails.length > 0) {
    return `explicit emails (${input.emails.length})`;
  }
  return `latest ${input.limit} RPA candidates`;
}

export function orderedDecisionLabels() {
  return [...decisionOrder];
}

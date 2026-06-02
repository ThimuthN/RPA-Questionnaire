import { describe, expect, it } from "vitest";
import {
  buildCandidateImportPlan,
  formatCandidateImportDryRunReport,
  type ExistingTargetCandidateSnapshot,
  type SourceCandidateSnapshot,
  type TargetDepartmentSnapshot,
  type TargetJobSnapshot
} from "./candidate-import-dry-run.logic";

const targetDepartments: TargetDepartmentSnapshot[] = [
  { id: "dept-rpa-ind", slug: "rpa-ind", name: "RPA IND" },
  { id: "dept-rpa-sl", slug: "rpa-sl", name: "RPA SL" }
];

function sourceCandidate(
  overrides: Partial<SourceCandidateSnapshot> = {}
): SourceCandidateSnapshot {
  return {
    id: "src-cand-1",
    fullName: "Alice Applicant",
    email: "alice@example.com",
    phone: "+94112223344",
    stage: "screening",
    nextAction: "review_result",
    screeningStatus: "pending",
    orgStatus: "active",
    orgStage: "active",
    finalizedAs: null,
    positionAppliedFor: "Senior RPA Engineer - IND",
    roleLabel: "Senior RPA Engineer",
    departmentName: "RPA IND",
    departmentSlug: "rpa-ind",
    hrOwner: "Owner One",
    resumeSource: "Referral",
    updatedAt: "2026-06-02T00:00:00.000Z",
    latestApplication: {
      id: "src-app-1",
      status: "under_review",
      jobTitle: "Senior RPA Engineer - IND",
      roleLabel: "Senior RPA Engineer",
      departmentName: "RPA IND",
      departmentSlug: "rpa-ind",
      updatedAt: "2026-06-02T00:00:00.000Z"
    },
    ...overrides
  };
}

function targetJob(overrides: Partial<TargetJobSnapshot> = {}): TargetJobSnapshot {
  return {
    id: "job-1",
    slug: "senior-rpa-engineer",
    title: "Senior RPA Engineer",
    departmentId: "dept-rpa-ind",
    roleId: "role-1",
    roleLabel: "Senior RPA Engineer",
    roleDepartmentId: "dept-rpa-ind",
    ...overrides
  };
}

function existingCandidate(
  overrides: Partial<ExistingTargetCandidateSnapshot> = {}
): ExistingTargetCandidateSnapshot {
  return {
    id: "target-cand-1",
    email: "alice@example.com",
    applications: [],
    ...overrides
  };
}

describe("candidate import dry-run planning", () => {
  it("maps an IND candidate to an exact staging job and preserves journey state", () => {
    const plan = buildCandidateImportPlan({
      source: sourceCandidate(),
      targetDepartments,
      targetJobs: [targetJob()],
      existingTargetCandidates: []
    });

    expect(plan.decision).toBe("create_candidate_and_application");
    expect(plan.variant).toBe("IND");
    expect(plan.journey).toMatchObject({
      stage: "screening",
      applicationStatus: "under_review",
      candidacyStatus: "active"
    });
    expect(plan.writePlan).toMatchObject({
      departmentSlug: "rpa-ind",
      jobTitle: "Senior RPA Engineer",
      jobResolution: "matched_existing_job",
      roleId: "role-1"
    });
  });

  it("falls back to an existing department-scoped pool job when no exact job matches", () => {
    const plan = buildCandidateImportPlan({
      source: sourceCandidate({
        email: "pool@example.com",
        departmentName: "RPA SL",
        departmentSlug: "rpa-sl",
        positionAppliedFor: "UiPath Developer - SL",
        roleLabel: "UiPath Developer",
        latestApplication: {
          id: "src-app-2",
          status: "submitted",
          jobTitle: "UiPath Developer - SL",
          roleLabel: "UiPath Developer",
          departmentName: "RPA SL",
          departmentSlug: "rpa-sl",
          updatedAt: "2026-06-02T00:00:00.000Z"
        }
      }),
      targetDepartments,
      targetJobs: [
        targetJob({
          id: "job-pool",
          slug: "rpa-general-pool-sl",
          title: "RPA General Pool - SL",
          departmentId: "dept-rpa-sl",
          roleId: null,
          roleLabel: null,
          roleDepartmentId: "dept-rpa-sl"
        })
      ],
      existingTargetCandidates: []
    });

    expect(plan.decision).toBe("create_candidate_and_application");
    expect(plan.variant).toBe("SL");
    expect(plan.writePlan).toMatchObject({
      departmentSlug: "rpa-sl",
      jobTitle: "RPA General Pool - SL",
      jobResolution: "use_existing_pool_job"
    });
  });

  it("rejects generic RPA candidates when the IND or SL variant cannot be inferred", () => {
    const plan = buildCandidateImportPlan({
      source: sourceCandidate({
        departmentName: "RPA",
        departmentSlug: "rpa",
        positionAppliedFor: "RPA Developer",
        roleLabel: "RPA Developer",
        latestApplication: {
          id: "src-app-3",
          status: "submitted",
          jobTitle: "RPA Developer",
          roleLabel: "RPA Developer",
          departmentName: "RPA",
          departmentSlug: "rpa",
          updatedAt: "2026-06-02T00:00:00.000Z"
        }
      }),
      targetDepartments,
      targetJobs: [targetJob()],
      existingTargetCandidates: []
    });

    expect(plan.decision).toBe("skip_unknown_variant");
    expect(plan.writePlan).toBeUndefined();
  });

  it("skips when the target candidate already has an application in the mapped RPA department", () => {
    const plan = buildCandidateImportPlan({
      source: sourceCandidate(),
      targetDepartments,
      targetJobs: [targetJob()],
      existingTargetCandidates: [
        existingCandidate({
          applications: [{ jobPostingId: "job-1", departmentId: "dept-rpa-ind" }]
        })
      ]
    });

    expect(plan.decision).toBe("skip_existing_application");
    expect(plan.existingTargetCandidateId).toBe("target-cand-1");
  });

  it("preserves rejected finalization state and closes the planned application", () => {
    const plan = buildCandidateImportPlan({
      source: sourceCandidate({
        email: "rejected@example.com",
        stage: "screening",
        orgStatus: "org_rejected",
        orgStage: "active",
        finalizedAs: null,
        latestApplication: null
      }),
      targetDepartments,
      targetJobs: [targetJob()],
      existingTargetCandidates: []
    });

    expect(plan.journey).toMatchObject({
      stage: "finalized",
      orgStatus: "org_rejected",
      orgStage: "finalized",
      finalizedAs: "rejected",
      applicationStatus: "closed",
      candidacyStatus: "dept_rejected"
    });
  });

  it("formats a redacted dry-run report without raw candidate PII", () => {
    const source = sourceCandidate();
    const plan = buildCandidateImportPlan({
      source,
      targetDepartments,
      targetJobs: [targetJob()],
      existingTargetCandidates: []
    });

    const report = formatCandidateImportDryRunReport([plan]);

    expect(report).toContain("hash=");
    expect(report).not.toContain(source.email);
    expect(report).not.toContain(source.fullName);
    expect(report).not.toContain(source.id);
    expect(report).not.toContain(source.phone ?? "");
  });
});

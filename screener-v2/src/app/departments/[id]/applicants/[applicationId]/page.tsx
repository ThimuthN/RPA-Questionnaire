import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { ApplicantReviewContent } from "@/components/candidates/ApplicantReviewContent";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listDepartmentHiringTeamOptions } from "@/lib/db/hiring-team-templates";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { getApplicantReviewDetail } from "@/lib/db/jobs";

export default async function DepartmentApplicantReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; applicationId: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id: departmentId, applicationId } = await params;
  const pageState = await searchParams;
  const session = await requirePageSession(`/departments/${departmentId}/applicants/${applicationId}`);
  const [department, detail] = await Promise.all([
    getDepartment(departmentId),
    getApplicantReviewDetail(applicationId)
  ]);

  if (!department || !detail) {
    notFound();
  }
  const belongsToDept =
    detail.candidate.departmentId === departmentId || detail.job.departmentId === departmentId;
  if (!belongsToDept) {
    notFound();
  }

  const canViewApplication = await canUsePermissionForDepartment(
    session,
    "view_candidates",
    departmentId
  );
  if (!canViewApplication) {
    redirect(`/departments/${departmentId}/applicants`);
  }

  const [assignments, teamOptions, canManageApplications, canMoveToPipeline] = await Promise.all([
    getApplicationAssignments(detail.id),
    listDepartmentHiringTeamOptions(departmentId),
    canUsePermissionForDepartment(session, "manage_candidates", departmentId),
    canUsePermissionForDepartment(session, "promote_candidate", departmentId) ||
      canUsePermissionForDepartment(session, "manage_candidates", departmentId)
  ]);
  const candidateProfileParams = new URLSearchParams({
    workspaceId: departmentId,
    returnTo: `/departments/${departmentId}/applicants/${detail.id}`
  });

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow={department.name}
      title={detail.candidate.fullName}
      subtitle={`Application for ${detail.job.title}`}
      utility={
        <Link href={`/departments/${departmentId}/applicants` as Route}>
          <Button variant="secondary">Back to applicants</Button>
        </Link>
      }
    >
      <ApplicantReviewContent
        detail={detail}
        pageState={pageState}
        backToApplicantsHref={`/departments/${departmentId}/applicants` as Route}
        reviewHref={`/departments/${departmentId}/applicants/${detail.id}` as Route}
        candidateProfileHref={`/people/candidates/${detail.candidate.id}?${candidateProfileParams.toString()}` as Route}
        assignments={assignments}
        templates={teamOptions.templates}
        users={teamOptions.users}
        canManageApplications={canManageApplications}
        canMoveToPipeline={canMoveToPipeline}
      />
    </SceneShell>
  );
}

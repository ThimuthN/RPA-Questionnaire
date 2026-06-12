import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { ApplicantReviewContent } from "@/components/candidates/ApplicantReviewContent";
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

  if (!department || !detail || detail.candidate.departmentId !== departmentId) {
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
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">{department.name}</p>
        <h1 className="text-3xl text-[color:var(--app-heading)]">{detail.candidate.fullName}</h1>
        <p className="text-sm text-[color:var(--app-muted)]">Application for {detail.job.title}</p>
      </div>

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
    </div>
  );
}

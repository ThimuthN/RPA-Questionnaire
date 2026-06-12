import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { ApplicantReviewContent } from "@/components/candidates/ApplicantReviewContent";
import { Button } from "@/components/primitives/Button";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { listDepartmentHiringTeamOptions } from "@/lib/db/hiring-team-templates";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { getApplicantReviewDetail } from "@/lib/db/jobs";

export default async function ApplicantReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/people/candidates/applicants/${id}`);
  const pageState = await searchParams;
  const detail = await getApplicantReviewDetail(id);

  if (!detail) {
    notFound();
  }

  if (!session.permissions.includes("view_candidates")) {
    redirect("/people/candidates/applicants");
  }

  const canViewApplication = await canUsePermissionForDepartment(
    session,
    "view_candidates",
    detail.candidate.departmentId
  );
  if (!canViewApplication) {
    redirect("/people/candidates/applicants");
  }

  const [assignments, teamOptions, canManageApplications, canMoveToPipeline] = await Promise.all([
    getApplicationAssignments(detail.id),
    detail.candidate.departmentId
      ? listDepartmentHiringTeamOptions(detail.candidate.departmentId)
      : Promise.resolve({ templates: [], users: [] }),
    canUsePermissionForDepartment(session, "manage_candidates", detail.candidate.departmentId),
    canUsePermissionForDepartment(session, "promote_candidate", detail.candidate.departmentId) ||
      canUsePermissionForDepartment(session, "manage_candidates", detail.candidate.departmentId)
  ]);
  const candidateProfileParams = new URLSearchParams({
    returnTo: `/people/candidates/applicants/${detail.id}`
  });
  if (detail.candidate.departmentId) {
    candidateProfileParams.set("workspaceId", detail.candidate.departmentId);
  }

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title={detail.candidate.fullName}
      subtitle={`Application for ${detail.job.title}`}
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          <Link href="/people/candidates/applicants">
            <Button variant="secondary">Back to applicants</Button>
          </Link>
        </div>
      }
    >
      <ApplicantReviewContent
        detail={detail}
        pageState={pageState}
        backToApplicantsHref={"/people/candidates/applicants" as Route}
        reviewHref={`/people/candidates/applicants/${detail.id}` as Route}
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

import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { JobsWorkspaceView } from "@/components/jobs/JobsWorkspaceView";
import { requirePageSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success)]/10 p-4 text-sm text-white"
          : "rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger)]/10 p-4 text-sm text-white"
      }
    >
      {children}
    </div>
  );
}

export default async function CandidateJobsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const session = await requirePageSession("/people/candidates/jobs");
  const pageState = await searchParams;
  const canCreateJob = session.permissions.includes("create_job");
  const canEditJob = session.permissions.includes("edit_job");

  const notice =
    pageState.created || pageState.updated || pageState.error ? (
      <div className="space-y-2">
        {pageState.created ? <NoticeBanner tone="success">Job created.</NoticeBanner> : null}
        {pageState.updated ? <NoticeBanner tone="success">Job updated.</NoticeBanner> : null}
        {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}
      </div>
    ) : undefined;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title="Jobs"
      subtitle="Manage job openings, public availability, and applicant intake."
      utility={<PeopleViewSwitch current="candidates" />}
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="jobs" />
        <JobsWorkspaceView
          scope="global"
          canCreateJob={canCreateJob}
          canEditJob={canEditJob}
          createJobHref="/people/candidates/jobs/new"
          applicantsBasePath="/people/candidates/applicants"
          editJobBasePath="/people/candidates/jobs"
          jobsBasePath="/people/candidates/jobs"
          notice={notice}
        />
      </div>
    </SceneShell>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { JobPostingEditorContent } from "@/components/jobs/JobPostingEditorContent";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { requirePageSession } from "@/lib/auth/guards";
import { getJobPosting } from "@/lib/db/jobs";
import { listRoleCatalog } from "@/lib/roles/catalog";
import { listAssessmentPresets } from "@/lib/addons/catalog";

export default async function EditJobPostingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/people/candidates/jobs/${id}`);
  if (!session.permissions.includes("edit_job")) {
    redirect("/people/candidates/jobs");
  }
  const pageState = await searchParams;
  const [job, roles, presets] = await Promise.all([getJobPosting(id), listRoleCatalog(true), listAssessmentPresets(false)]);

  if (!job) {
    notFound();
  }

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Hiring"
      title={job.title}
      subtitle="Edit the job opening, public availability, and applicant intake."
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          <Link href="/people/candidates/jobs">
            <Button variant="secondary">Back to jobs</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="jobs" />

        <JobPostingEditorContent
          job={job}
          pageState={pageState}
          cancelHref="/people/candidates/jobs"
          editorHref={`/people/candidates/jobs/${job.id}`}
          applicantListHref={{
            pathname: "/people/candidates/applicants",
            query: { jobId: job.id }
          }}
          roleOptions={roles.map((role) => ({
            id: role.id,
            label: role.label,
            department: role.department,
            isActive: role.isActive
          }))}
          presetOptions={presets.map((preset) => ({
            id: preset.id,
            label: preset.label
          }))}
        />
      </div>
    </SceneShell>
  );
}

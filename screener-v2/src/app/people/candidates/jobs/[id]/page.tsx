import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { getJobPosting } from "@/lib/db/jobs";

export default async function EditJobPostingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/people/candidates/jobs/${id}`);
  const pageState = await searchParams;
  const job = await getJobPosting(id);

  if (!job) {
    notFound();
  }

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="People"
      title={job.title}
      subtitle="Update the posting and public availability."
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

        {(pageState.created || pageState.updated || pageState.error) ? (
          <div className="space-y-2">
            {pageState.created ? <p className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">Job created.</p> : null}
            {pageState.updated ? <p className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">Job updated.</p> : null}
            {pageState.error ? <p className="rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{pageState.error}</p> : null}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <StagePanel className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl text-[color:var(--app-heading)]">Job details</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Keep the public listing short and clear.</p>
            </div>
            <JobPostingForm
              action={`/api/jobs/${job.id}`}
              submitLabel="Save job"
              cancelHref="/people/candidates/jobs"
              job={job}
            />
          </StagePanel>

          <div className="space-y-4">
            <StagePanel tone="summary" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill label={job.isPublished ? "Published" : "Draft"} tone={job.isPublished ? "emerald" : "neutral"} />
                <StatusPill label={job.isOpen ? "Open" : "Closed"} tone={job.isOpen ? "blue" : "amber"} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-[color:var(--app-heading)]">Applicants</p>
                <p className="text-3xl text-[color:var(--app-heading)]">{job.applicantCount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-[color:var(--app-muted)]">Public link</p>
                <Link href={`/jobs/${job.slug}`} className="text-sm text-[color:var(--app-brand)] hover:underline">
                  /jobs/{job.slug}
                </Link>
              </div>
            </StagePanel>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

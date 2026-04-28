import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { requirePageSession } from "@/lib/auth/guards";
import { listJobPostings } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await requirePageSession("/people");
  const jobs = await listJobPostings();
  const publishedOpen = jobs.filter((job) => job.isPublished && job.isOpen).length;
  const draftCount = jobs.filter((job) => !job.isPublished).length;
  const closedCount = jobs.filter((job) => job.isPublished && !job.isOpen).length;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="People"
      title="Recruiting workspace"
      subtitle="Manage hiring, open jobs, and applicant review from a single People dashboard."
      utility={<PeopleViewSwitch current="candidates" />}
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Published openings</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{publishedOpen}</p>
            <p className="mt-2 text-sm text-[color:var(--app-muted)]">Live jobs available for public applications.</p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Draft jobs</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{draftCount}</p>
            <p className="mt-2 text-sm text-[color:var(--app-muted)]">Roles still being prepared or updated.</p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Closed jobs</p>
            <p className="mt-2 text-3xl text-[color:var(--app-heading)]">{closedCount}</p>
            <p className="mt-2 text-sm text-[color:var(--app-muted)]">Roles that are no longer accepting applications.</p>
          </div>
        </div>

        <StagePanel className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">People dashboard</p>
              <h2 className="text-2xl text-[color:var(--app-heading)]">Hiring work in one place</h2>
              <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                Open the jobs list, review applicants, or jump straight to your candidate pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/people/candidates/jobs">
                <Button>Manage jobs</Button>
              </Link>
              <Link href="/people/candidates/applicants">
                <Button variant="secondary">Review applicants</Button>
              </Link>
              <Link href="/people/candidates">
                <Button variant="ghost">Open pipeline</Button>
              </Link>
            </div>
          </div>
        </StagePanel>
      </div>
    </SceneShell>
  );
}

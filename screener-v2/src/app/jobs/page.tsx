import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { listPublicJobPostings } from "@/lib/db/jobs";

export const dynamic = "force-dynamic";

export default async function PublicJobsPage() {
  const jobs = await listPublicJobPostings();

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Northstar jobs"
      title="Open roles"
      subtitle="Find the role that fits and apply in a few minutes."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${jobs.length} open role${jobs.length === 1 ? "" : "s"}`} tone="blue" />
          <StatusPill label="No login required" tone="emerald" />
          <StatusPill label="Resume optional" tone="neutral" />
        </div>

        {jobs.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-[color:var(--app-heading)]">No openings right now</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Check back later for new roles.</p>
          </StagePanel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {jobs.map((job) => (
              <StagePanel key={job.id} tone="open" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {job.roleDepartment ? <StatusPill label={job.roleDepartment} tone="neutral" /> : null}
                    {job.roleLabel ? <StatusPill label={job.roleLabel} tone="blue" /> : <StatusPill label="Open role" tone="blue" />}
                  </div>
                  <h2 className="text-2xl text-[color:var(--app-heading)]">{job.title}</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">{job.summary}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applications are open now</p>
                  <Link href={`/jobs/${job.slug}`}>
                    <Button>View role</Button>
                  </Link>
                </div>
              </StagePanel>
            ))}
          </div>
        )}
      </div>
    </SceneShell>
  );
}

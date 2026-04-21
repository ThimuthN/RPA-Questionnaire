import Link from "next/link";
import { Button } from "@/components/primitives/Button";
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
      subtitle="Apply without logging in."
    >
      <div className="space-y-6">
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
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-brand)]">
                    {job.roleDepartment || "Open role"}
                  </p>
                  <h2 className="text-2xl text-[color:var(--app-heading)]">{job.title}</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">{job.summary}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/jobs/${job.slug}`}>
                    <Button>Apply</Button>
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

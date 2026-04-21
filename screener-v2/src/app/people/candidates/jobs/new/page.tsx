import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { listRoleCatalog } from "@/lib/roles/catalog";

export default async function NewJobPostingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePageSession("/people/candidates/jobs/new");
  const pageState = await searchParams;
  const roles = await listRoleCatalog(true);

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="People"
      title="New job"
      subtitle="Add a basic public opening."
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
        <StagePanel className="max-w-3xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Create a job</h2>
            <p className="text-sm text-[color:var(--app-muted)]">This creates the internal record and the public page when published.</p>
          </div>
          {pageState.error ? <p className="text-sm text-[color:var(--app-danger)]">{pageState.error}</p> : null}
          <JobPostingForm
            action="/api/jobs"
            submitLabel="Create job"
            cancelHref="/people/candidates/jobs"
            roleOptions={roles.map((role) => ({
              id: role.id,
              label: role.label,
              department: role.department,
              isActive: role.isActive,
              coreBasisRoleId: role.coreBasisRoleId
            }))}
          />
        </StagePanel>
      </div>
    </SceneShell>
  );
}

import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requirePageSession("/people/employees");

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title="Employees"
      subtitle="Employee management is outside the v1 hiring workflow. Use the hiring system to finalize candidates."
    >
      <StagePanel className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl text-[color:var(--app-heading)]">v1 limitation</h2>
          <p className="text-sm text-[color:var(--app-text)]">
            Employee management and HRMS features are not included in the v1 hiring platform. This workspace is reserved for future employee lifecycle features.
          </p>
          <p className="text-sm text-[color:var(--app-text)]">
            When you hire candidates, their employment record is recorded in their candidate profile as part of the final hiring decision. Complete employee onboarding and management through your HRMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/people/candidates">
            <Button>Back to candidates</Button>
          </Link>
          <Link href="/people/candidates/jobs">
            <Button variant="secondary">Manage jobs</Button>
          </Link>
        </div>
      </StagePanel>
    </SceneShell>
  );
}

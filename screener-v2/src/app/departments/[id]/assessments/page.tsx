import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { getDepartment } from "@/lib/db/departments";
import { notFound } from "next/navigation";

export default async function DepartmentAssessmentsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">{department.name} — Assessments</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Manage and review assessment templates, add-ons, and results for this workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {/* Create / Assign Assessment Card */}
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="text-lg font-medium text-[color:var(--app-heading)] mb-2">Create / Assign Assessment</h3>
          <p className="text-sm text-[color:var(--app-muted)] mb-4">
            Assignments are created from candidate profiles or the candidate database.
          </p>
          <Link href={`/departments/${id}/candidates`}>
            <Button variant="secondary">Go to candidates</Button>
          </Link>
        </div>

        {/* Assessment Templates / Add-ons Card */}
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="text-lg font-medium text-[color:var(--app-heading)] mb-2">Assessment Templates</h3>
          <p className="text-sm text-[color:var(--app-muted)] mb-4">
            Manage reusable screening templates and add-ons used by this workspace.
          </p>
          <Link href="/addons">
            <Button variant="secondary">Browse templates</Button>
          </Link>
        </div>

        {/* Assessment Results Card */}
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="text-lg font-medium text-[color:var(--app-heading)] mb-2">Assessment Results</h3>
          <p className="text-sm text-[color:var(--app-muted)] mb-4">
            Review completed assessment evidence for candidates in this workspace.
          </p>
          <Link href={`/departments/${id}/candidates?stage=assessment`}>
            <Button variant="secondary">View results</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <p className="text-sm text-[color:var(--app-muted)]">
          Assessment evidence and detailed results are stored on individual candidate profiles. Select a candidate to view their assessment history, scores, and feedback.
        </p>
      </div>
    </div>
  );
}

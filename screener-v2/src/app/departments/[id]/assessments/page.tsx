import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { getDepartment } from "@/lib/db/departments";

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
      <div className="space-y-1">
        <h2 className="text-2xl text-[color:var(--app-heading)]">{department.name} Assessments</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Use the same assessment system with workspace-specific presets and result views.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="mb-2 text-lg font-medium text-[color:var(--app-heading)]">Create Assessment</h3>
          <p className="mb-4 text-sm text-[color:var(--app-muted)]">
            Build an assessment with shared add-ons and presets available to this workspace.
          </p>
          <Link href={`/create-test?workspaceId=${id}`}>
            <Button variant="secondary">Create assessment</Button>
          </Link>
        </div>

        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="mb-2 text-lg font-medium text-[color:var(--app-heading)]">Assessment Templates</h3>
          <p className="mb-4 text-sm text-[color:var(--app-muted)]">
            Browse shared add-ons, then create and manage presets for this workspace.
          </p>
          <Link href={`/addons?workspaceId=${id}`}>
            <Button variant="secondary">Browse templates</Button>
          </Link>
        </div>

        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
          <h3 className="mb-2 text-lg font-medium text-[color:var(--app-heading)]">Assessment Results</h3>
          <p className="mb-4 text-sm text-[color:var(--app-muted)]">
            Review completed assessment evidence for candidates in this workspace.
          </p>
          <Link href={`/results?workspaceId=${id}`}>
            <Button variant="secondary">View results</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <p className="text-sm text-[color:var(--app-muted)]">
          Shared add-ons stay centralized. Workspace presets and workspace result views stay scoped to the selected department.
        </p>
      </div>
    </div>
  );
}

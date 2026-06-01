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
        <h2 className="text-2xl text-[color:var(--app-heading)]">Assessments</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Review assessment results for department candidates.
        </p>
      </div>

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8 text-center">
        <p className="text-sm text-[color:var(--app-muted)] mb-6">
          Assessment evidence and results are stored on candidate profiles.
        </p>
        <Link href={`/departments/${id}/candidates`}>
          <Button>View candidates</Button>
        </Link>
      </div>
    </div>
  );
}

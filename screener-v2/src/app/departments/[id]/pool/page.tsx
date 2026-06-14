import { notFound } from "next/navigation";
import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { TalentPoolWorkspaceView } from "@/components/candidates/TalentPoolWorkspaceView";

export const dynamic = "force-dynamic";

export default async function DepartmentTalentPoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePageSession(`/departments/${id}/pool`);
  const department = await getDepartment(id);
  if (!department) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Talent pool</h2>
        <p className="mt-0.5 text-sm text-[color:var(--app-muted)]">
          Candidates not in an active pipeline for this workspace.
        </p>
      </div>
      <CandidatesViewSwitch current="pool" scope="department" departmentId={id} countsDepartmentId={id} />
      <TalentPoolWorkspaceView scope="department" departmentId={id} />
    </div>
  );
}

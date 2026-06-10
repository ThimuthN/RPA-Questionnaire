import dynamic from "next/dynamic";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";
import { requireDepartmentWorkspaceAccess, requirePageSession } from "@/lib/auth/guards";
import { getDepartment } from "@/lib/db/departments";

const CreateAssessmentBuilder = dynamic(
  () => import("@/components/assessments/CreateAssessmentBuilder").then((mod) => mod.CreateAssessmentBuilder),
  {
    loading: () => (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-sm text-[color:var(--app-muted)] shadow-[var(--app-shadow-soft)]">
        Loading assessment builder...
      </div>
    )
  }
);

export default async function CreateTestPage({
  searchParams
}: {
  searchParams: Promise<{ candidateId?: string; milestoneId?: string; workspaceId?: string }>;
}) {
  const params = await searchParams;
  const workspaceId = params.workspaceId?.trim() || undefined;
  const nextPath = workspaceId ? `/create-test?workspaceId=${workspaceId}` : "/create-test";
  const session = await requirePageSession(nextPath);

  let workspaceName: string | undefined;
  if (workspaceId) {
    const [department, access] = await Promise.all([
      getDepartment(workspaceId),
      requireDepartmentWorkspaceAccess(session, workspaceId)
    ]);

    if (!department) {
      notFound();
    }
    if (!access.ok) {
      notFound();
    }

    workspaceName = department.name;
  }

  const [addons, presets] = await Promise.all([
    listAddonCatalog(),
    listAssessmentPresets(
      workspaceId
        ? { departmentId: workspaceId, includeShared: true }
        : { includeInactive: false }
    )
  ]);

  return (
    <SceneTransition>
      <CreateAssessmentBuilder
        initialAddons={addons}
        initialPresets={presets}
        eyebrow={workspaceName ?? "Assessments"}
        title={workspaceId ? "Assemble a workspace assessment" : "Assemble an assessment"}
        subtitle={
          workspaceId
            ? "Use shared add-ons and the presets available in this workspace."
            : "Choose the mix, set the details, then share it."
        }
        utility={
          workspaceId ? (
            <Link href={`/departments/${workspaceId}/assessments` as Route}>
              <Button variant="secondary">Back to workspace</Button>
            </Link>
          ) : undefined
        }
        linkedCandidateId={params.candidateId?.trim() || undefined}
        linkedCandidateMilestoneId={params.milestoneId?.trim() || undefined}
      />
    </SceneTransition>
  );
}

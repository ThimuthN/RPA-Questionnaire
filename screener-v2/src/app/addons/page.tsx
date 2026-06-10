import dynamic from "next/dynamic";
import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { StatusPill } from "@/components/primitives/StatusPill";
import { requireDepartmentWorkspaceAccess, requirePageSession } from "@/lib/auth/guards";
import {
  canUsePermissionForDepartment,
  hasGlobalPermission,
  isSystemAdmin
} from "@/lib/auth/permission-evaluator";
import { getDepartment } from "@/lib/db/departments";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";

const AddonLibraryClient = dynamic(
  () => import("@/components/addons/AddonLibraryClient").then((mod) => mod.AddonLibraryClient),
  {
    loading: () => (
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-sm text-[color:var(--app-muted)] shadow-[var(--app-shadow-soft)]">
        Loading add-on library...
      </div>
    )
  }
);

export default async function AddonsPage({
  searchParams
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  const pageState = await searchParams;
  const workspaceId = pageState.workspaceId?.trim() || undefined;
  const nextPath = workspaceId ? `/addons?workspaceId=${workspaceId}` : "/addons";
  const session = await requirePageSession(nextPath);
  const globalManageAccess = session.userId
    ? (await isSystemAdmin(session.userId)) ||
      (await hasGlobalPermission(session.userId, "manage_addons"))
    : false;

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
  } else if (!globalManageAccess) {
    redirect("/");
  }

  const canManageWorkspacePresets = workspaceId
    ? await canUsePermissionForDepartment(session, "manage_addons", workspaceId)
    : false;

  const [addons, presets] = await Promise.all([
    listAddonCatalog(true),
    listAssessmentPresets(
      workspaceId
        ? { includeInactive: true, departmentId: workspaceId, includeShared: true }
        : { includeInactive: true }
    )
  ]);

  return (
    <SceneTransition>
      <SceneShell
        variant="create"
        tone="page"
        eyebrow={workspaceName ?? "Assessments"}
        title="Assessment templates"
        subtitle={
          workspaceId
            ? "Browse shared add-ons and manage the presets available in this workspace."
            : "Manage reusable assessment templates and question sets."
        }
        utility={
          <div className="flex flex-wrap items-center gap-2">
            {workspaceId ? (
              <Link href={`/departments/${workspaceId}/assessments` as Route}>
                <Button variant="secondary">Back to workspace</Button>
              </Link>
            ) : null}
            <StatusPill label={`${addons.length} templates`} tone="blue" />
            <StatusPill label={`${presets.length} presets`} tone="purple" />
          </div>
        }
      >
        <AddonLibraryClient
          initialAddons={addons}
          initialPresets={presets}
          canManageAddons={globalManageAccess}
          canManageGlobalPresets={globalManageAccess}
          canManageWorkspacePresets={canManageWorkspacePresets}
          managedDepartmentId={workspaceId}
        />
      </SceneShell>
    </SceneTransition>
  );
}

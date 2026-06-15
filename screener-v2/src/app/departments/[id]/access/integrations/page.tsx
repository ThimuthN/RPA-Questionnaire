import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { DepartmentIntegrationsSection } from "@/components/integrations/DepartmentIntegrationsSection";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { listDepartmentIntegrationSummaries } from "@/lib/integrations";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";

export default async function DepartmentIntegrationsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ integrationUpdated?: string; error?: string }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  const session = await requirePageSession(`/departments/${id}/access/integrations`);
  const canManageIntegrations = await canUsePermissionForDepartment(session, "manage_integrations", id);

  if (!canManageIntegrations) {
    notFound();
  }

  const [department, integrations] = await Promise.all([
    getDepartment(id),
    listDepartmentIntegrationSummaries(id)
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">App Integrations</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Connect the department mailbox, scheduling calendar, and meeting provider used across this workspace.
        </p>
      </div>

      {pageState.integrationUpdated ? (
        <NotificationBanner tone="success">
          {pageState.integrationUpdated} connection updated successfully.
        </NotificationBanner>
      ) : null}

      {pageState.error ? (
        <NotificationBanner tone="error">{decodeURIComponent(pageState.error)}</NotificationBanner>
      ) : null}

      <DepartmentIntegrationsSection departmentId={id} initialIntegrations={integrations} />
    </div>
  );
}

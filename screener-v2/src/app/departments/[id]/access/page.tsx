import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import { DepartmentAccessRolesSection } from "@/components/departments/DepartmentAccessRolesSection";
import { DepartmentIntegrationsSection } from "@/components/integrations/DepartmentIntegrationsSection";
import { NotificationBanner } from "@/components/primitives/NotificationBanner";
import { listDepartmentIntegrationSummaries } from "@/lib/integrations";
import { listAccessRoles } from "@/lib/roles/catalog";

export default async function DepartmentAccessPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ integrationUpdated?: string; error?: string }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  const session = await requirePageSession(`/departments/${id}/access`);
  const permResult = await requirePermissionForDepartment(session, "manage_users", id);
  if (!permResult.ok) {
    notFound();
  }

  const [department, accessRoles, integrations] = await Promise.all([
    getDepartment(id),
    listAccessRoles({
      departmentId: id,
      scope: "department"
    }),
    listDepartmentIntegrationSummaries(id)
  ]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Access</h1>
        <p className="mt-1 text-sm text-[color:var(--app-muted)]">
          Manage workspace permissions and connected department tools.
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

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
        <h3 className="mb-2 font-medium text-[color:var(--app-heading)]">Workspace administration</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          Access Control governs who can operate inside this workspace. App Integrations connect the department mailbox,
          scheduling calendar, and meeting provider that later ATS workflow phases will use.
        </p>
      </div>

      <DepartmentAccessRolesSection
        departmentId={id}
        departmentName={department.name}
        initialRoles={accessRoles}
      />

      <div className="border-t border-[color:var(--app-border)] pt-6">
        <DepartmentIntegrationsSection departmentId={id} initialIntegrations={integrations} />
      </div>
    </div>
  );
}

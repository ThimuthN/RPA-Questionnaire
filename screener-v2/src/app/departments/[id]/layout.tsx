import type { Route } from "next";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { DepartmentWorkspaceTabs } from "@/components/departments/DepartmentWorkspaceTabs";
import { requirePageSession, requireDepartmentWorkspaceAccess } from "@/lib/auth/guards";
import { getDepartment } from "@/lib/db/departments";
import { notFound } from "next/navigation";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function DepartmentWorkspaceLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const session = await requirePageSession(`/departments/${id}`);

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  const accessResult = await requireDepartmentWorkspaceAccess(session, id);
  if (!accessResult.ok) {
    notFound();
  }

  const tabs: Array<{ label: string; href: Route }> = [
    { label: "Overview", href: `/departments/${id}` as Route },
    { label: "Job Designations", href: `/departments/${id}/designations` as Route },
    { label: "Jobs", href: `/departments/${id}/jobs` as Route },
    { label: "Applicants", href: `/departments/${id}/applicants` as Route },
    { label: "Candidates", href: `/departments/${id}/candidates` as Route },
    { label: "Assessments", href: `/departments/${id}/assessments` as Route },
    { label: "Team", href: `/departments/${id}/users` as Route },
    { label: "Access", href: `/departments/${id}/access` as Route }
  ];

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Hiring"
      title={`${department.name}${!department.isActive ? " (Inactive)" : ""}`}
      subtitle="Hiring workspace"
    >
      <StagePanel className="space-y-5">
        <DepartmentWorkspaceTabs tabs={tabs} departmentId={id} />
        {children}
      </StagePanel>
    </SceneShell>
  );
}

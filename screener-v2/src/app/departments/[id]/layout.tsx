import { SceneShell } from "@/components/scene/SceneShell";
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

  return (
    <SceneShell
      variant="create"
      tone="page"
      eyebrow="Hiring"
      title={`${department.name}${!department.isActive ? " (Inactive)" : ""}`}
      subtitle="Hiring workspace"
    >
      <div className="space-y-5">
        {children}
      </div>
    </SceneShell>
  );
}

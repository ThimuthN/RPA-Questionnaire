import { notFound } from "next/navigation";
import { AssessmentHubView } from "@/components/assessments/AssessmentHubView";
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
    <AssessmentHubView workspaceId={id} workspaceName={department.name} />
  );
}

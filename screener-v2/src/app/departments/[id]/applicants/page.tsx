import { notFound } from "next/navigation";
import { ApplicantWorkspaceView } from "@/components/candidates/ApplicantWorkspaceView";
import { getDepartment } from "@/lib/db/departments";
import { type RouteSearchParams } from "@/lib/http/search-params";

export default async function DepartmentApplicantsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { id } = await params;
  const department = await getDepartment(id);

  if (!department) {
    notFound();
  }

  return (
    <ApplicantWorkspaceView
      scope="department"
      departmentId={id}
      departmentName={department.name}
      searchParams={await searchParams}
    />
  );
}

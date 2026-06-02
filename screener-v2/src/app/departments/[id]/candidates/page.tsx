import { notFound } from "next/navigation";
import { CandidateWorkspaceView } from "@/components/candidates/CandidateWorkspaceView";
import { getDepartment } from "@/lib/db/departments";
import { type RouteSearchParams } from "@/lib/http/search-params";

export default async function DepartmentCandidatesPage({
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
    <CandidateWorkspaceView
      scope="department"
      departmentId={id}
      departmentName={department.name}
      searchParams={await searchParams}
    />
  );
}

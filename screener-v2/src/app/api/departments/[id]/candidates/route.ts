import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { listCandidaciesForDepartment } from "@/lib/db/candidacies";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id: departmentId } = await params;

  const permCheck = await requirePermissionForDepartment(session, "view_candidates", departmentId);
  if (!permCheck.ok) {
    return permCheck.response;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "active" | "talent_pool" | "dept_rejected" | null;
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "12", 10);

    const result = await listCandidaciesForDepartment({
      departmentId,
      status: status || undefined,
      q: q || undefined,
      page,
      pageSize
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch candidacies" },
      { status: 500 }
    );
  }
}

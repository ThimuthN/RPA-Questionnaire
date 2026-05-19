import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
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

  // Check permission: users with view_candidates permission can view
  const canView = session.permissions.includes("view_candidates");

  if (!canView) {
    return NextResponse.json(
      { error: "Not authorized to view this department's candidates" },
      { status: 403 }
    );
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
      { error: error instanceof Error ? error.message : "Failed to fetch candidacies" },
      { status: 500 }
    );
  }
}

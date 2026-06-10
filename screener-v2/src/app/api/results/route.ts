import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireDepartmentWorkspaceAccess,
  requireGlobalPermission,
  requirePermissionForDepartment
} from "@/lib/auth/guards";
import { listResultWorkspacePage } from "@/lib/db/repositories";
import { parseResultsWorkspaceQuery } from "@/lib/results/query";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim() || undefined;

  const access = workspaceId
    ? await requireDepartmentWorkspaceAccess(auth.session, workspaceId)
    : await requireGlobalPermission(auth.session, "view_results");
  if (!access.ok) {
    return access.response;
  }

  const perm = workspaceId
    ? await requirePermissionForDepartment(auth.session, "view_results", workspaceId)
    : await requireGlobalPermission(auth.session, "view_results");
  if (!perm.ok) {
    return perm.response;
  }

  const query = parseResultsWorkspaceQuery(searchParams);
  const result = await listResultWorkspacePage({ ...query, departmentId: workspaceId });
  return NextResponse.json({
    ok: true,
    count: result.total,
    rows: result.rows
  });
}

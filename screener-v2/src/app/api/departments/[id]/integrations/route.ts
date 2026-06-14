import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { listDepartmentIntegrationSummaries } from "@/lib/integrations/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const permission = await requirePermissionForDepartment(auth.session, "manage_integrations", id);
  if (!permission.ok) {
    return permission.response;
  }

  return NextResponse.json({
    ok: true,
    integrations: await listDepartmentIntegrationSummaries(id)
  });
}

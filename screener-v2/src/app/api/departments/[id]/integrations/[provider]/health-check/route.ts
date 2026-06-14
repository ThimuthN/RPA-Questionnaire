import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { parseIntegrationProvider } from "@/lib/integrations/http";
import { runDepartmentProviderHealthCheck } from "@/lib/integrations/service";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; provider: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id, provider: providerRaw } = await params;
    const permission = await requirePermissionForDepartment(auth.session, "manage_integrations", id);
    if (!permission.ok) {
      return permission.response;
    }

    const result = await runDepartmentProviderHealthCheck(id, parseIntegrationProvider(providerRaw));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Unknown provider.", 404);
    }
    return jsonError(error instanceof Error ? error.message : "Could not check integration health.");
  }
}

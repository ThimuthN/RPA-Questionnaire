import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { parseIntegrationProvider, setDefaultsSchema } from "@/lib/integrations/http";
import { setDepartmentProviderDefaults } from "@/lib/integrations/service";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; provider: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id, provider: providerRaw } = await params;
    const permission = await requirePermissionForDepartment(auth.session, "manage_users", id);
    if (!permission.ok) {
      return permission.response;
    }

    const provider = parseIntegrationProvider(providerRaw);
    const body = setDefaultsSchema.parse(await request.json());
    await setDepartmentProviderDefaults(id, provider, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid defaults payload.");
    }
    return jsonError(error instanceof Error ? error.message : "Could not save integration defaults.");
  }
}

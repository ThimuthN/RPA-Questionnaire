import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireGlobalPermission } from "@/lib/auth/guards";
import { parseIntegrationProvider } from "@/lib/integrations/http";
import { testProviderAppConfiguration } from "@/lib/integrations/service";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const permission = await requireGlobalPermission(auth.session, "manage_integrations");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const provider = parseIntegrationProvider((await params).provider);
    const result = await testProviderAppConfiguration(provider);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Unknown provider.", 404);
    }
    return jsonError(error instanceof Error ? error.message : "Could not test provider configuration.");
  }
}

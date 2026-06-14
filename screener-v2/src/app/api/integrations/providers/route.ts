import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiSession } from "@/lib/auth/guards";
import { providerAppBodySchema } from "@/lib/integrations/http";
import { listProviderAppSummaries, saveProviderAppConfiguration } from "@/lib/integrations/service";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET() {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    ok: true,
    providers: await listProviderAppSummaries()
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = providerAppBodySchema.parse(await request.json());
    await saveProviderAppConfiguration({
      provider: body.provider,
      clientId: body.clientId || undefined,
      clientSecret: body.clientSecret || undefined,
      tenantId: body.tenantId || undefined,
      enabled: body.enabled,
      scopes: body.scopes
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid provider configuration.");
    }
    return jsonError(error instanceof Error ? error.message : "Could not save provider configuration.");
  }
}

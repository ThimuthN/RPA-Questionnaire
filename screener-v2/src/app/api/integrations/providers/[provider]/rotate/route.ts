import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiSession } from "@/lib/auth/guards";
import { parseIntegrationProvider, rotateSecretSchema } from "@/lib/integrations/http";
import { rotateProviderAppSecret } from "@/lib/integrations/service";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const provider = parseIntegrationProvider((await params).provider);
    const body = rotateSecretSchema.parse(await request.json());
    await rotateProviderAppSecret(provider, body.clientSecret);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid secret payload.");
    }
    return jsonError(error instanceof Error ? error.message : "Could not rotate provider secret.");
  }
}

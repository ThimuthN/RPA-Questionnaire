import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireGlobalPermission } from "@/lib/auth/guards";
import { getStarryStatus, saveStarryConfig } from "@/lib/ai/config";

const bodySchema = z.object({
  providerKind: z.enum(["anthropic", "openai"]),
  model: z.string().max(120).optional(),
  baseUrl: z.string().url().max(300).refine((u) => u.startsWith("https://"), { message: "Base URL must use HTTPS." }).optional(),
  apiKey: z.string().max(400).optional(),
  enabled: z.boolean()
});

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const permission = await requireGlobalPermission(auth.session, "manage_integrations");
  if (!permission.ok) return permission.response;

  return NextResponse.json({ ok: true, status: await getStarryStatus() });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const permission = await requireGlobalPermission(auth.session, "manage_integrations");
  if (!permission.ok) return permission.response;

  try {
    const body = bodySchema.parse(await request.json());
    const result = await saveStarryConfig(body);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, status: await getStarryStatus() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof z.ZodError ? error.issues[0]?.message : "Invalid configuration." },
      { status: 400 }
    );
  }
}

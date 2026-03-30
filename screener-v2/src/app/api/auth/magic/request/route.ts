import { NextResponse } from "next/server";
import { z } from "zod";
import { issueMagicToken } from "@/lib/auth/magic-link";
import { requireApiSession } from "@/lib/auth/guards";
import { getAppUrl } from "@/lib/server/app-url";

const requestSchema = z.object({
  email: z.string().email(),
  campaignId: z.string().optional()
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = requestSchema.parse(await request.json());
    const token = await issueMagicToken(body.email);
    const appUrl = getAppUrl(request);
    return NextResponse.json({
      ok: true,
      message: "Magic link issued.",
      devShortcutUrl:
        process.env.NODE_ENV !== "production"
          ? `${appUrl}/employee/verify?t=${encodeURIComponent(token)}`
          : undefined
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

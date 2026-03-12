import { NextResponse } from "next/server";
import { z } from "zod";
import { issueMagicToken } from "@/lib/auth/magic-link";
import { getAppUrl } from "@/lib/server/app-url";

const requestSchema = z.object({
  email: z.string().email(),
  campaignId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const token = await issueMagicToken(body.email);
    const appUrl = getAppUrl(request);
    return NextResponse.json({
      ok: true,
      message: "Magic link issued.",
      // v1 dev behavior: return raw token for immediate testing.
      token,
      verifyUrl: `${appUrl}/employee/verify?t=${encodeURIComponent(token)}`
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

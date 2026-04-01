import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMagicVerificationToken,
  setMagicVerificationCookie,
  verifyMagicToken
} from "@/lib/auth/magic-link";

const verifySchema = z.object({
  token: z.string().min(8),
  fullName: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = verifySchema.parse(await request.json());
    const verified = await verifyMagicToken(body.token);
    if (!verified.ok || !verified.email) {
      return NextResponse.json({ ok: false, message: verified.message || "Token invalid." }, { status: 400 });
    }
    const response = NextResponse.json({
      ok: true,
      session: {
        email: verified.email.trim().toLowerCase(),
        mode: "employee"
      }
    });
    const verificationToken = await createMagicVerificationToken(verified.email);
    setMagicVerificationCookie(response, verificationToken);
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

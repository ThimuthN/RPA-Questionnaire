import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyMagicToken } from "@/lib/auth/magic-link";
import { createOrGetParticipant } from "@/lib/db/repositories";

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
    const participant = await createOrGetParticipant({
      kind: "employee",
      fullName: body.fullName || verified.email.split("@")[0],
      email: verified.email
    });
    return NextResponse.json({
      ok: true,
      session: {
        participantId: participant.id,
        email: participant.email,
        mode: "employee"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

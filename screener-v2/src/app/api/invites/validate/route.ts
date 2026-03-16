import { NextResponse } from "next/server";
import { z } from "zod";
import type { RoleId } from "@/lib/assessment-engine/types";
import { validateInvite } from "@/lib/db/repositories";
import { getTotalDurationMinutes } from "@/lib/sections/registry";

const validateSchema = z
  .object({
    token: z.string().min(8).optional(),
    slug: z.string().min(3).optional(),
    passcode: z.string().optional(),
    roleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).optional()
  })
  .refine((value) => Boolean(value.token || value.slug), {
    message: "Token or slug is required."
  });

export async function POST(request: Request) {
  try {
    const body = validateSchema.parse(await request.json());
    const checked = await validateInvite({
      token: body.token,
      slug: body.slug,
      passcode: body.passcode,
      roleId: body.roleId as RoleId | undefined
    });
    if (!checked.ok || !checked.invite) {
      return NextResponse.json({ ok: false, message: checked.message || "Invite invalid." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      invite: {
        id: checked.invite.id,
        slug: checked.invite.slug,
        roleLocked: checked.invite.roleLocked,
        stackLocked: checked.invite.stackLocked,
        roleId: checked.invite.roleId ?? null,
        stacks: checked.invite.stacks ?? [],
        sections: checked.invite.sections ?? []
      },
      totalDurationMinutes:
        checked.invite.roleId && checked.invite.sections?.length
          ? getTotalDurationMinutes(checked.invite.sections, checked.invite.roleId)
          : null,
      remainingAttempts: checked.remainingAttempts ?? 0
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import type { RoleId } from "@/lib/assessment-engine/types";
import { validateInvite } from "@/lib/db/repositories";
import { summarizeBlueprintForClient } from "@/lib/exams/client-blueprint";

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
    return NextResponse.json({
      ok: checked.ok,
      state: checked.state,
      message: checked.message,
      invite: checked.invite
        ? {
            id: checked.invite.id,
            slug: checked.invite.slug,
            roleLocked: checked.invite.roleLocked,
            stackLocked: checked.invite.stackLocked,
            roleId: checked.invite.roleId ?? null,
            passTarget: checked.invite.passTargetPercent,
            stacks: checked.invite.stacks ?? [],
            sections: checked.invite.sections ?? [],
            integrityPreset: checked.invite.integrityPreset,
            exams: summarizeBlueprintForClient(checked.invite.blueprint)
          }
        : null,
      totalDurationMinutes: checked.invite
        ? checked.invite.blueprint.exams.reduce((sum, exam) => sum + exam.durationMinutes, 0)
        : null,
      remainingAttempts: checked.remainingAttempts
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

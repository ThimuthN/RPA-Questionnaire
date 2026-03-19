import { NextResponse } from "next/server";
import { z } from "zod";
import type { RoleId, StackId } from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";
import { createInvite } from "@/lib/db/repositories";
import { normalizeSelectedSections } from "@/lib/sections/registry";
import { getRoleConfig } from "@/lib/data/question-bank";
import { getAppUrl } from "@/lib/server/app-url";

const createInviteSchema = z.object({
  assessmentVersionId: z.string().default("v1-default"),
  mode: z.enum(["candidate", "employee", "live"]).default("candidate"),
  roleLocked: z.boolean().optional(),
  stackLocked: z.boolean().optional(),
  roleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).optional(),
  passTarget: z.number().int().min(40).max(90).optional(),
  stacks: z.array(z.enum(["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"])).optional(),
  sections: z.array(z.enum(["core", "practical", "applied_logic_reasoning"])).optional(),
  blueprint: z
    .object({
      exams: z
        .array(
          z.object({
            definitionId: z.enum(["core_exam", "practical_exam", "applied_logic_exam"]),
            config: z.record(z.string(), z.unknown()).default({}),
            weight: z.number().positive().optional(),
            requiredPercent: z.number().min(0).max(100).optional()
          })
        )
        .optional()
    })
    .optional(),
  maxAttempts: z.number().int().min(1).max(5).optional(),
  expiresAt: z.string().optional(),
  withPasscode: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const body = createInviteSchema.parse(await request.json());
    const requestedExamCount = body.blueprint?.exams?.length ?? body.sections?.length ?? 0;
    if (requestedExamCount === 0) {
      return NextResponse.json(
        { ok: false, message: "At least one exam must be selected." },
        { status: 400 }
      );
    }
    const normalizedSections = normalizeSelectedSections(body.sections as SectionId[] | undefined);
    if (!body.blueprint?.exams?.length && normalizedSections.length === 0) {
      return NextResponse.json(
        { ok: false, message: "At least one exam must be selected." },
        { status: 400 }
      );
    }

    const effectiveRoleId = body.roleId as RoleId | undefined;
    const passTargetPercent =
      typeof body.passTarget === "number"
        ? body.passTarget
        : effectiveRoleId
          ? Number(getRoleConfig(effectiveRoleId).pass_percentage)
          : 60;

    const created = await createInvite({
      assessmentVersionId: body.assessmentVersionId,
      mode: body.mode,
      roleLocked: body.roleLocked,
      stackLocked: body.stackLocked,
      roleId: effectiveRoleId,
      passTargetPercent,
      stacks: body.stacks as StackId[] | undefined,
      sections: normalizedSections,
      blueprint: body.blueprint?.exams ? { exams: body.blueprint.exams } : undefined,
      maxAttempts: body.maxAttempts,
      expiresAt: body.expiresAt,
      withPasscode: body.withPasscode
    });
    const appUrl = getAppUrl(request);

    return NextResponse.json({
      ok: true,
      inviteId: created.row.id,
      slug: created.row.slug,
      token: created.token,
      passcode: created.passcode || null,
      passTarget: created.row.passTargetPercent,
      entryUrl: `${appUrl}/a/${created.row.slug}?t=${encodeURIComponent(created.token)}`
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

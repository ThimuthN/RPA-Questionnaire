import { NextResponse } from "next/server";
import { z } from "zod";
import type { RoleId, StackId } from "@/lib/assessment-engine/types";
import { createInvite } from "@/lib/db/repositories";
import { getAppUrl } from "@/lib/server/app-url";

const createInviteSchema = z.object({
  assessmentVersionId: z.string().default("v1-default"),
  mode: z.enum(["candidate", "employee", "live"]).default("candidate"),
  roleLocked: z.boolean().optional(),
  stackLocked: z.boolean().optional(),
  roleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).optional(),
  stacks: z.array(z.enum(["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"])).optional(),
  maxAttempts: z.number().int().min(1).max(5).optional(),
  expiresAt: z.string().optional(),
  withPasscode: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const body = createInviteSchema.parse(await request.json());
    const created = await createInvite({
      assessmentVersionId: body.assessmentVersionId,
      mode: body.mode,
      roleLocked: body.roleLocked,
      stackLocked: body.stackLocked,
      roleId: body.roleId as RoleId | undefined,
      stacks: body.stacks as StackId[] | undefined,
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
      entryUrl: `${appUrl}/a/${created.row.slug}?t=${encodeURIComponent(created.token)}`
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

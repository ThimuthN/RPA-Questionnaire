import { NextResponse } from "next/server";
import { z } from "zod";
import type { RoleId, StackId } from "@/lib/assessment-engine/types";
import { pickPracticalPack } from "@/features/practical/packs";
import {
  createOrGetParticipant,
  startAttempt,
  validateInvite
} from "@/lib/db/repositories";

const startSchema = z.object({
  inviteToken: z.string().optional(),
  inviteSlug: z.string().optional(),
  passcode: z.string().optional(),
  participant: z.object({
    kind: z.enum(["candidate", "employee"]),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  roleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).optional(),
  stacks: z.array(z.enum(["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"])).min(1).optional()
});

export async function POST(request: Request) {
  try {
    const body = startSchema.parse(await request.json());
    let inviteId: string | undefined;
    let assessmentVersionId: string | undefined;
    let effectiveRoleId = body.roleId as RoleId | undefined;
    let effectiveStacks = body.stacks as StackId[] | undefined;

    if (body.inviteToken) {
      const inviteCheck = await validateInvite({
        token: body.inviteToken,
        passcode: body.passcode
      });
      if (!inviteCheck.ok || !inviteCheck.invite) {
        return NextResponse.json(
          { ok: false, message: inviteCheck.message || "Invite validation failed." },
          { status: 400 }
        );
      }
      inviteId = inviteCheck.invite.id;
      assessmentVersionId = inviteCheck.invite.assessmentVersionId;
      effectiveRoleId = inviteCheck.invite.roleId ?? effectiveRoleId;
      effectiveStacks = inviteCheck.invite.stacks ?? effectiveStacks;
    } else if (body.inviteSlug) {
      const inviteCheck = await validateInvite({
        slug: body.inviteSlug,
        passcode: body.passcode
      });
      if (!inviteCheck.ok || !inviteCheck.invite) {
        return NextResponse.json(
          { ok: false, message: inviteCheck.message || "Invite validation failed." },
          { status: 400 }
        );
      }
      inviteId = inviteCheck.invite.id;
      assessmentVersionId = inviteCheck.invite.assessmentVersionId;
      effectiveRoleId = inviteCheck.invite.roleId ?? effectiveRoleId;
      effectiveStacks = inviteCheck.invite.stacks ?? effectiveStacks;
    }

    if (!effectiveRoleId || !effectiveStacks?.length) {
      return NextResponse.json(
        { ok: false, message: "Role and stack are required." },
        { status: 400 }
      );
    }

    const participant = await createOrGetParticipant({
      kind: body.participant.kind,
      fullName: body.participant.fullName,
      email: body.participant.email,
      phone: body.participant.phone
    });
    const started = await startAttempt({
      inviteId,
      assessmentVersionId,
      participantId: participant.id,
      roleId: effectiveRoleId,
      stacks: effectiveStacks
    });
    const practicalPack = pickPracticalPack(effectiveRoleId, effectiveStacks);

    return NextResponse.json({
      ok: true,
      attemptId: started.attempt.id,
      roleId: started.attempt.roleId,
      stacks: started.attempt.stacks,
      seed: started.attempt.seed,
      questionIds: started.attempt.coreQuestionIds,
      practicalPack,
      timers: {
        core: started.attempt.remainingCoreSeconds,
        practical: started.attempt.remainingPracticalSeconds
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

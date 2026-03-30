import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assessmentContextTypeValues,
  type AssessmentContextType,
  type IntegrityPresetId,
  type RoleId,
  type StackId
} from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";
import {
  createOrGetParticipant,
  startAttempt,
  validateInvite
} from "@/lib/db/repositories";
import {
  createRuntimeSessionToken,
  setRuntimeSessionCookie
} from "@/lib/auth/runtime-session";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

const startSchema = z.object({
  inviteToken: z.string().optional(),
  inviteSlug: z.string().optional(),
  passcode: z.string().optional(),
  contextType: z.enum(assessmentContextTypeValues).optional(),
  participant: z.object({
    kind: z.enum(["candidate", "employee"]),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  runtimeSlug: z.string().min(1).optional(),
  roleId: z.enum(["Intern", "Associate", "SE", "SeniorSE", "TechLead"]).optional(),
  stacks: z.array(z.enum(["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"])).min(1).optional()
});

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.attempts.start");

  try {
    const body = startSchema.parse(await request.json());
    let inviteId: string | undefined;
    let assessmentVersionId: string | undefined;
    let integrityPreset: IntegrityPresetId | undefined;
    const effectiveRoleId = body.roleId as RoleId | undefined;
    let effectiveStacks = body.stacks as StackId[] | undefined;
    let effectiveSections: SectionId[] | undefined;
    let effectivePassTarget: number | undefined;
    let effectiveBlueprint;
    let effectiveContextType = (body.contextType as AssessmentContextType | undefined) ?? "general";
    let runtimeSlug = body.runtimeSlug?.trim();

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
      integrityPreset = inviteCheck.invite.integrityPreset;
      effectivePassTarget = inviteCheck.invite.passTargetPercent;
      effectiveStacks = inviteCheck.invite.stacks ?? effectiveStacks;
      effectiveSections = inviteCheck.invite.sections;
      effectiveBlueprint = inviteCheck.invite.blueprint;
      effectiveContextType = inviteCheck.invite.contextType;
      runtimeSlug = inviteCheck.invite.slug;
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
      integrityPreset = inviteCheck.invite.integrityPreset;
      effectivePassTarget = inviteCheck.invite.passTargetPercent;
      effectiveStacks = inviteCheck.invite.stacks ?? effectiveStacks;
      effectiveSections = inviteCheck.invite.sections;
      effectiveBlueprint = inviteCheck.invite.blueprint;
      effectiveContextType = inviteCheck.invite.contextType;
      runtimeSlug = inviteCheck.invite.slug;
    }

    if (!effectiveBlueprint && (!effectiveRoleId || !effectiveStacks?.length)) {
      return NextResponse.json(
        { ok: false, message: "Exam configuration is missing." },
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
      contextType: effectiveContextType,
      integrityPreset,
      roleId: effectiveRoleId,
      passTargetPercent: effectivePassTarget,
      stacks: effectiveStacks,
      sections: effectiveSections,
      blueprint: effectiveBlueprint
    });
    const response = NextResponse.json({
      ok: true,
      attemptId: started.attempt.id
    });
    if (runtimeSlug) {
      const runtimeToken = await createRuntimeSessionToken({
        attemptId: started.attempt.id,
        slug: runtimeSlug
      });
      setRuntimeSessionCookie(response, runtimeToken);
    }
    return response;
  } catch (error) {
    logRouteError("attempt_start_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Invalid request."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}

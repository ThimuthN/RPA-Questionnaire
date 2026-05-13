import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assessmentContextTypeValues,
  type AssessmentContextType,
  type IntegrityPresetId,
  type StackId
} from "@/lib/assessment-engine/types";
import type { SectionId } from "@/lib/sections/types";
import { requireApiSession } from "@/lib/auth/guards";
import { createInvite } from "@/lib/db/repositories";
import { normalizeSelectedSections } from "@/lib/sections/registry";
import { getAppUrl } from "@/lib/server/app-url";
import { examDefinitionIdSchema } from "@/lib/exams/definitions";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const createInviteSchema = z.object({
  assessmentVersionId: z.string().default("v1-default"),
  mode: z.enum(["candidate", "employee", "live"]).default("candidate"),
  contextType: z.enum(assessmentContextTypeValues).default("general"),
  candidateId: z.string().optional(),
  candidateMilestoneId: z.string().optional(),
  integrityPreset: z.enum(["strict", "standard", "relaxed"]).default("standard"),
  roleLocked: z.boolean().optional(),
  stackLocked: z.boolean().optional(),
  passTarget: z.number().int().min(40).max(90).optional(),
  stacks: z.array(z.enum(["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"])).optional(),
  sections: z.array(z.enum(["core", "practical", "applied_logic_reasoning"])).optional(),
  blueprint: z
    .object({
      exams: z
        .array(
          z.object({
            definitionId: examDefinitionIdSchema,
            sourceAddonId: z.string().optional(),
            sourcePresetId: z.string().optional(),
            label: z.string().optional(),
            description: z.string().optional(),
            config: z.record(z.string(), z.unknown()).default({}),
            durationMinutes: z.number().int().positive().optional(),
            weight: z.number().int().positive().optional(),
            weightMode: z.enum(["auto", "manual"]).optional(),
            requiredPercent: z.number().min(0).max(100).optional(),
            requiredPercentMode: z.enum(["auto", "manual"]).optional()
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
  const logContext = createRequestLogContext(request, "api.invites.create");

  try {
    const auth = await requireApiSession();
    if (!auth.ok) {
      return auth.response;
    }
    const { session } = auth;
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

    const passTargetPercent = typeof body.passTarget === "number" ? body.passTarget : 60;
    if (body.blueprint?.exams?.length) {
      const totalContribution = body.blueprint.exams.reduce((sum, exam) => sum + Number(exam.weight ?? 0), 0);
      if (totalContribution !== 100) {
        return NextResponse.json(
          { ok: false, message: `Score contribution must add up to 100. Current total: ${totalContribution}.` },
          { status: 400 }
        );
      }
    }

    let roleWarning: string | undefined;
    if (body.candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: body.candidateId },
        select: { roleId: true, role: { select: { label: true, coreBasisRoleId: true } } }
      });
      if (!candidate?.role?.coreBasisRoleId) {
        roleWarning = "Candidate has no role assigned. Assessment will use the default level.";
      }
    }

    const created = await createInvite({
      assessmentVersionId: body.assessmentVersionId,
      mode: body.mode,
      contextType: body.contextType as AssessmentContextType,
      candidateId: body.candidateId,
      candidateMilestoneId: body.candidateMilestoneId,
      createdById: session.userId ?? undefined,
      integrityPreset: body.integrityPreset as IntegrityPresetId,
      roleLocked: body.roleLocked,
      stackLocked: body.stackLocked,
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
      integrityPreset: created.row.integrityPreset,
      passTarget: created.row.passTargetPercent,
      entryUrl: `${appUrl}/a/${created.row.slug}?t=${encodeURIComponent(created.token)}`,
      ...(roleWarning ? { roleWarning } : {})
    });
  } catch (error) {
    logRouteError("invite_create_failed", logContext, error);

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

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSession as getSession } from "@/lib/auth/app-session";
import {
  candidateFinalDecisionValues,
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues,
  candidateUiStatusValues
} from "@/lib/candidates/types";
import { candidateUiStatusToStoredFields } from "@/lib/candidates/ui-status";
import { updateCandidate } from "@/lib/db/candidates";

const updateCandidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  uiStatus: z.enum(candidateUiStatusValues).optional(),
  stage: z.enum(candidateStageValues).optional(),
  finalDecision: z.enum(candidateFinalDecisionValues).optional(),
  nextAction: z.enum(candidateNextActionValues).optional(),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = updateCandidateSchema.parse(Object.fromEntries((await request.formData()).entries()));
    const derivedStatus = body.uiStatus
      ? candidateUiStatusToStoredFields(body.uiStatus)
      : (() => {
          if (!body.stage || !body.finalDecision || !body.nextAction) {
            throw new Error("Candidate status is required.");
          }

          return {
            stage: body.stage,
            finalDecision: body.finalDecision,
            nextAction: body.nextAction,
            screeningStatus: body.screeningStatus || undefined
          };
        })();
    await updateCandidate(id, {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      roleId: body.roleId,
      positionAppliedFor: body.positionAppliedFor,
      batchId: body.batchId,
      resumeSource: body.resumeSource,
      hrOwner: body.hrOwner,
      candidateFolderUrl: body.candidateFolderUrl,
      notesSummary: body.notesSummary,
      ...derivedStatus
    });

    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const { id } = await params;
    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update candidate.");
    return NextResponse.redirect(url, 303);
  }
}

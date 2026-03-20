import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  candidateFinalDecisionValues,
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues,
  candidateUiStatusValues
} from "@/lib/candidates/types";
import { candidateUiStatusToStoredFields } from "@/lib/candidates/ui-status";
import { createCandidate } from "@/lib/db/candidates";

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  uiStatus: z.enum(candidateUiStatusValues).optional(),
  stage: z.enum(candidateStageValues).default("new"),
  finalDecision: z.enum(candidateFinalDecisionValues).default("in_process"),
  nextAction: z.enum(candidateNextActionValues).default("none"),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional()
});

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const formRequest = isFormRequest(request);
    const rawBody = formRequest ? Object.fromEntries((await request.formData()).entries()) : await request.json();
    const body = candidateSchema.parse(rawBody);
    const derivedStatus = body.uiStatus
      ? candidateUiStatusToStoredFields(body.uiStatus)
      : {
          stage: body.stage,
          finalDecision: body.finalDecision,
          nextAction: body.nextAction,
          screeningStatus: body.screeningStatus || undefined
        };
    const candidate = await createCandidate({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      positionAppliedFor: body.positionAppliedFor,
      batchId: body.batchId,
      resumeSource: body.resumeSource,
      hrOwner: body.hrOwner,
      candidateFolderUrl: body.candidateFolderUrl,
      notesSummary: body.notesSummary,
      ...derivedStatus
    });

    if (formRequest) {
      const url = new URL(`/candidates/${candidate.id}`, request.url);
      url.searchParams.set("created", "1");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, candidate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create candidate.";

    if (isFormRequest(request)) {
      const url = new URL("/candidates/new", request.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

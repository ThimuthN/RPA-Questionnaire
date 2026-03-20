import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  candidateFinalDecisionValues,
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues
} from "@/lib/candidates/types";
import { updateCandidate } from "@/lib/db/candidates";

const updateCandidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  stage: z.enum(candidateStageValues),
  finalDecision: z.enum(candidateFinalDecisionValues),
  nextAction: z.enum(candidateNextActionValues),
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
    await updateCandidate(id, {
      ...body,
      screeningStatus: body.screeningStatus || undefined
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
